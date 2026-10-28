/**
 * The Studio project, for `npm run catchup`.
 *
 * Attendees create their project in the Studio UI in Session 1, and the UI
 * creates the `compositions` content type with it. So this ADOPTS a project
 * that already exists on the stack and never rewrites its content type. Only
 * when there's no project at all (the attendee missed Session 1) does it create
 * both, the way Studio's UI would.
 */
import { cma, studio, log } from './cma.mjs';
import { compositionsContentType } from './compositions-ct.mjs';
import {
  COMPOSITIONS_CT,
  STUDIO_PROJECT_NAME,
  CANVAS_URL,
  LOCALE,
  environmentUid,
} from './config.mjs';

async function createCompositionsContentType(apiKey) {
  const exists = await cma(apiKey, `/content_types/${COMPOSITIONS_CT}`).then(
    () => true,
    (e) => {
      if (e.status !== 422 && e.status !== 404) throw e;
      return false;
    },
  );
  if (exists) return;
  const { firstPass, full } = compositionsContentType(COMPOSITIONS_CT);
  await cma(apiKey, '/content_types', { method: 'POST', body: { content_type: firstPass } });
  await cma(apiKey, `/content_types/${COMPOSITIONS_CT}`, {
    method: 'PUT',
    body: { content_type: full },
  });
  log.ok(`created the "${COMPOSITIONS_CT}" content type`);
}

/**
 * Find or create the stack's Studio project and configure it like Session 1
 * does: environment, language, Canvas URL. `freeform` turns on Enable Freeform
 * Feature, which Session 2 does (it adds the Design and Data tabs).
 */
export async function ensureProject(apiKey, { freeform }) {
  log.step('Studio project');
  const { projects = [] } = await studio('/projects');
  // Two projects on one stack split its templates between them; never add one blind.
  let project = projects.find((p) => p.connectedStackApiKey === apiKey);

  if (project) {
    log.skip(`using your project "${project.name}" (${project.uid})`);
    if (project.contentTypeUid && project.contentTypeUid !== COMPOSITIONS_CT) {
      throw new Error(
        `Your project stores templates in "${project.contentTypeUid}", but the code expects ` +
          `"${COMPOSITIONS_CT}" (src/lib/contentstack.ts). Change one of them to match.`,
      );
    }
  } else {
    await createCompositionsContentType(apiKey);
    const res = await studio('/projects', {
      method: 'POST',
      body: {
        name: STUDIO_PROJECT_NAME,
        description: 'The Wayfarer site, built in the Studio hands-on.',
        connectedStackApiKey: apiKey,
        contentTypeUid: COMPOSITIONS_CT,
        canvasUrl: CANVAS_URL,
      },
    });
    project = res.project ?? res;
    log.ok(`created project "${STUDIO_PROJECT_NAME}" (${project.uid})`);
  }

  // The environment must be given by UID: a name is accepted and never binds.
  const current = project.settings ?? {};
  await studio(`/projects/${project.uid}`, {
    method: 'PUT',
    body: {
      name: project.name,
      canvasUrl: CANVAS_URL,
      connectedStackApiKey: apiKey,
      contentTypeUid: COMPOSITIONS_CT,
      settings: {
        ...current,
        configuration: {
          ...(current.configuration ?? {}),
          environment: environmentUid(),
          locale: LOCALE,
        },
        isFreeformEnabled: freeform || !!current.isFreeformEnabled,
      },
    },
  });
  log.ok(`configured: Canvas URL ${CANVAS_URL}${freeform ? ', Freeform on' : ''}`);
  return project.uid;
}
