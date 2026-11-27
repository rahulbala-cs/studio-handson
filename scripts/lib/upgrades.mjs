/**
 * Upgrades for stacks that were set up by an earlier version of this repo.
 *
 * `npm run setup`, `npm run catchup` and `npm run dev` run these first, and
 * `npm run doctor` reports a stack that still needs one, so nobody has to
 * remember them. Each one checks before it writes and can be run any number of
 * times: a run that stops part-way leaves the content intact, and the next run
 * finishes the job.
 *
 * quote_text: the Itinerary's Quote block used to have a text field with the
 * uid `quote`, the same as the block's. Studio binds a field inside a block by
 * its path from the block, so a Text bound to that field read as bound to the
 * whole block, and Studio refused to save the template. The field is now
 * `quote_text`; its display name is still "Quote".
 */
import zlib from 'node:zlib';
import { cma, log } from './cma.mjs';
import { decodeUi } from './composition.mjs';
import { COMPOSITIONS_CT, ENVIRONMENT, LOCALE } from './config.mjs';

const CT = 'destination';
const BLOCK = 'quote';
const OLD = 'quote';
const NEW = 'quote_text';
const LABEL = 'Quote';
/** Both fields exist for a few seconds mid-upgrade, and display names must differ. */
const LABEL_WHILE_MOVING = 'Quote (moving)';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const notFound = (e) => e.status === 404 || e.status === 422;

/** Every entry of a content type, 100 at a time. */
async function allEntries(stack, contentType) {
  const out = [];
  for (let skip = 0; ; skip += 100) {
    const { entries = [] } = await cma(
      stack,
      `/content_types/${contentType}/entries?locale=${LOCALE}&include_publish_details=true&limit=100&skip=${skip}`,
    );
    out.push(...entries);
    if (entries.length < 100) return out;
  }
}

async function environmentUid(stack) {
  const { environments = [] } = await cma(stack, '/environments');
  return environments.find((e) => e.name === ENVIRONMENT)?.uid;
}

/** The entry's latest version is (or isn't) the one live on the environment. */
function published(entry, envUid) {
  const rows = (entry.publish_details ?? []).filter(
    (d) => d.environment === envUid && (d.locale ?? LOCALE) === LOCALE,
  );
  if (!rows.length) return null;
  return { behind: !rows.some((d) => d.version === entry._version) };
}

async function publish(stack, contentType, uid) {
  await cma(stack, `/content_types/${contentType}/entries/${uid}/publish`, {
    method: 'POST',
    body: { entry: { environments: [ENVIRONMENT], locales: [LOCALE] } },
  });
}

/** PUT a content type as it is now, with only the schema changed. */
async function putContentType(stack, ct, schema) {
  const { title, uid, description, options, field_rules } = ct;
  await cma(stack, `/content_types/${uid}`, {
    method: 'PUT',
    body: { content_type: { title, uid, description, options, field_rules, schema } },
  });
}

/** Top-level modular-blocks fields that have a Quote block, and that block. */
function quoteBlocks(schema = []) {
  return schema
    .filter((f) => f.data_type === 'blocks')
    .flatMap((f) =>
      (f.blocks ?? [])
        .filter((b) => b.uid === BLOCK && !b.reference_to)
        .map((block) => ({ field: f.uid, block })),
    );
}

// ─── quote_text ──────────────────────────────────────────────────────────────
/** What the stack's Destination content type looks like now. */
async function readModel(stack) {
  const ct = await cma(stack, `/content_types/${CT}`).then(
    (r) => r.content_type,
    (e) => {
      if (notFound(e)) return null;
      throw e;
    },
  );
  const blocks = quoteBlocks(ct?.schema).map(({ field, block }) => {
    const oldField = block.schema?.find((f) => f.uid === OLD);
    const newField = block.schema?.find((f) => f.uid === NEW);
    return { field, block, oldField, newField };
  });
  const pending = blocks.filter(
    (b) => b.oldField || (b.newField && b.newField.display_name !== LABEL),
  );
  return { ct, blocks, pending };
}

/** (a) Add quote_text next to quote, in the stack's own schema. */
async function addNewField(stack, ct, blocks) {
  const todo = blocks.filter((b) => b.oldField && !b.newField);
  if (!todo.length) return false;
  const schema = structuredClone(ct.schema);
  for (const { field } of todo) {
    const block = schema.find((f) => f.uid === field).blocks.find((b) => b.uid === BLOCK);
    const i = block.schema.findIndex((f) => f.uid === OLD);
    const copy = {
      ...structuredClone(block.schema[i]),
      uid: NEW,
      display_name: LABEL_WHILE_MOVING,
    };
    block.schema.splice(i + 1, 0, copy);
  }
  await putContentType(stack, ct, schema);
  log.ok(`added the field "${NEW}" to the Quote block`);
  return true;
}

/** Itinerary items of one entry, with each Quote's text copied to quote_text. */
function copyQuotes(entry, fields) {
  let changed = false;
  let moved = false;
  const updates = {};
  for (const field of fields) {
    const items = entry[field];
    if (!Array.isArray(items)) continue;
    updates[field] = items.map((item) => {
      const q = item?.[BLOCK];
      if (!q || typeof q !== 'object') return item;
      if (q[NEW]) moved = true;
      if (q[OLD] == null || q[OLD] === '' || q[NEW] === q[OLD]) return item;
      changed = moved = true;
      return { ...item, [BLOCK]: { ...q, [NEW]: q[OLD] } };
    });
  }
  return { changed, moved, updates };
}

/**
 * A read returns each file field as the whole asset; a write takes its uid
 * ("is not a valid upload" otherwise). Walks the schema, so it covers every
 * block, an attendee's own included.
 */
function writable(value, schema = []) {
  if (!value || typeof value !== 'object') return value;
  const out = { ...value };
  for (const f of schema) {
    const v = out[f.uid];
    if (v == null) continue;
    const each = (fn) => (Array.isArray(v) ? v.map(fn) : fn(v));
    if (f.data_type === 'file') out[f.uid] = each((a) => (a && typeof a === 'object' ? a.uid : a));
    else if (f.data_type === 'group') out[f.uid] = each((g) => writable(g, f.schema));
    else if (f.data_type === 'blocks') {
      out[f.uid] = each((item) => {
        const uid = Object.getOwnPropertyNames(item ?? {}).find((n) => n !== '_metadata');
        const block = f.blocks?.find((b) => b.uid === uid);
        return block ? { ...item, [uid]: writable(item[uid], block.schema) } : item;
      });
    }
  }
  return out;
}

/** (b) Copy every Quote into quote_text, and re-publish what was published. */
async function copyEntries(stack, ct, fields, envUid) {
  const entries = await allEntries(stack, CT);
  let copied = 0;
  let republished = 0;
  for (const entry of entries) {
    const { changed, moved, updates } = copyQuotes(entry, fields);
    const live = published(entry, envUid);
    if (changed) {
      await cma(stack, `/content_types/${CT}/entries/${entry.uid}?locale=${LOCALE}`, {
        method: 'PUT',
        body: { entry: writable(updates, ct.schema) },
      });
      copied++;
    }
    // A previous run may have saved the copy and stopped before publishing it.
    if (live && (changed || (moved && live.behind))) {
      await publish(stack, CT, entry.uid);
      republished++;
    }
  }
  if (copied || republished) {
    log.ok(`copied the Quote text in ${copied} entries; re-published ${republished}`);
  }
}

/** Every Quote with text has the same text in quote_text. Checked again before (c). */
async function verifyEntries(stack, fields) {
  const left = (await allEntries(stack, CT)).filter((e) => copyQuotes(e, fields).changed);
  if (left.length) {
    throw new Error(
      `${left.length} destination entries still have a Quote that is not copied yet ` +
        `(${left.map((e) => e.title).join(', ')}). Nothing was removed. Run npm run upgrade again.`,
    );
  }
}

const isPath = (path, segs) => {
  let p = path;
  for (const s of segs) {
    const fields = p && typeof p === 'object' ? Object.entries(p) : [];
    if (fields.length !== 1 || fields[0][0] !== s) return false;
    p = fields[0][1];
  }
  return !!p && typeof p === 'object' && Object.entries(p).length === 0;
};

/** The repeater uids a node's condition tests for the Quote block type. */
function quoteConditionRepeaters(condition) {
  const uids = [];
  (function walk(c) {
    if (!c || typeof c !== 'object') return;
    if (Array.isArray(c)) return c.forEach(walk);
    if (c.type === 'modular_block' && c.value === BLOCK) {
      for (const b of [c.conditionBinding, c.dataBinding]) {
        if (b?.type === 'repeater' && b.value?.repeaterUID) uids.push(b.value.repeaterUID);
      }
    }
    Object.values(c).forEach(walk);
  })(condition);
  return uids;
}

/**
 * In a composition tree, point every prop inside a Quote Condition Block that
 * reads `quote` from that Repeater's item at `quote_text` instead. The
 * condition itself tests the block name and keeps `quote`.
 */
export function rewriteQuoteBindings(tree) {
  let changed = 0;
  let current = 0;
  const visitProps = (value, repeaters) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach((v) => visitProps(v, repeaters));
    if (value.type === 'repeater' && repeaters.has(value.value?.repeaterUID)) {
      const v = value.value;
      if (isPath(v.path, [OLD])) {
        v.path = { [NEW]: {} };
        changed++;
      } else if (isPath(v.path, [BLOCK, OLD])) {
        v.path = { [BLOCK]: { [NEW]: {} } };
        changed++;
      } else if (isPath(v.path, [NEW]) || isPath(v.path, [BLOCK, NEW])) {
        current++;
      }
      return;
    }
    Object.values(value).forEach((v) => visitProps(v, repeaters));
  };
  (function walk(n, repeaters) {
    if (!n || typeof n !== 'object') return;
    let inside = repeaters;
    const own = quoteConditionRepeaters(n.metadata?.condition);
    if (n.type === 'condition-block' && own.length) inside = new Set([...repeaters, ...own]);
    if (inside.size) {
      visitProps(n.props, inside);
      visitProps(n.attrs, inside);
    }
    for (const arr of Object.values(n.slots ?? {})) (arr ?? []).forEach((c) => walk(c, inside));
  })(tree, new Set());
  return { changed, current };
}

/** Encode a tree the way the stored `ui` was encoded. */
const encodeLike = (original, tree) =>
  original?.startsWith('zlib:')
    ? `zlib:${zlib.deflateSync(Buffer.from(JSON.stringify(tree))).toString('base64')}`
    : JSON.stringify(tree);

/** (d) Studio compositions: rebind, save, and deploy again where deployed. */
async function rebindCompositions(stack, envUid) {
  let entries;
  try {
    entries = await allEntries(stack, COMPOSITIONS_CT);
  } catch (e) {
    if (notFound(e)) return; // No Studio project yet.
    throw e;
  }
  for (const entry of entries) {
    if (!entry.ui) continue;
    let tree;
    try {
      tree = decodeUi(entry.ui);
    } catch {
      log.warn(`"${entry.title}": could not read its layout, left as it is`);
      continue;
    }
    const { changed, current } = rewriteQuoteBindings(tree);
    const live = published(entry, envUid);
    if (changed) {
      await cma(stack, `/content_types/${COMPOSITIONS_CT}/entries/${entry.uid}?locale=${LOCALE}`, {
        method: 'PUT',
        body: { entry: { ui: encodeLike(entry.ui, tree) } },
      });
    }
    if (live && (changed || (current && live.behind))) {
      await publish(stack, COMPOSITIONS_CT, entry.uid);
    }
    if (changed) {
      log.ok(
        `"${entry.title}": ${changed} binding${changed > 1 ? 's' : ''} now read ${NEW}` +
          (live ? ', saved and deployed' : ', saved (it was not deployed, so it still is not)'),
      );
    }
  }
}

/** (c) Remove quote, and show quote_text as "Quote". Only after (b) and (d). */
async function removeOldField(stack) {
  const { ct, pending } = await readModel(stack);
  if (!pending.length) return;
  const schema = structuredClone(ct.schema);
  for (const { field } of pending) {
    const block = schema.find((f) => f.uid === field).blocks.find((b) => b.uid === BLOCK);
    if (!block.schema.some((f) => f.uid === NEW)) {
      throw new Error(`The Quote block has no "${NEW}" field yet. Run npm run upgrade again.`);
    }
    block.schema = block.schema
      .filter((f) => f.uid !== OLD)
      .map((f) => (f.uid === NEW ? { ...f, display_name: LABEL } : f));
  }
  await putContentType(stack, ct, schema);
  log.ok(`removed the old field "${OLD}"; "${NEW}" shows as "${LABEL}"`);
}

const quoteText = {
  id: 'quote_text',
  title: 'The Quote block’s text field is now quote_text',
  /** True when this stack still needs it. One read of the Destination content type. */
  async needed(stack) {
    return (await readModel(stack)).pending.length > 0;
  },
  async apply(stack) {
    const { ct, blocks, pending } = await readModel(stack);
    if (!pending.length) return false;
    const fields = [...new Set(pending.map((b) => b.field))];
    const envUid = await environmentUid(stack);
    await addNewField(stack, ct, blocks);
    if (pending.some((b) => b.oldField)) {
      // The schema as it is now, with quote_text in it.
      const current = (await readModel(stack)).ct;
      await copyEntries(stack, current, fields, envUid);
      await rebindCompositions(stack, envUid);
      await verifyEntries(stack, fields);
    }
    await removeOldField(stack);
    return true;
  },
};

export const UPGRADES = [quoteText];

/** The upgrades this stack still needs. Reads only. */
export async function pendingUpgrades(stack) {
  const out = [];
  for (const u of UPGRADES) if (await u.needed(stack)) out.push(u);
  return out;
}

/** Run every upgrade this stack needs. Silent when there is none. */
export async function runUpgrades(stack, todo) {
  todo ??= await pendingUpgrades(stack);
  if (!todo.length) return [];
  log.step('Upgrading your stack to this version of the hands-on');
  for (const u of todo) {
    log.info(u.title);
    await u.apply(stack);
  }
  log.ok('upgraded');
  return todo;
}
