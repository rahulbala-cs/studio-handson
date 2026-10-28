# Wayfarer: the Contentstack Studio hands-on

A small travel site that you turn into a Studio site over four sessions. It
starts as an ordinary Next.js site, with each page's layout written in code,
and ends with every page built in Studio.

Your components stay in code and your content stays in Contentstack. Studio
takes over the page layout: it's built on a canvas from your registered
components, bound to your existing entries, and deployed without a code
release.

**The step-by-step guides are in <GUIDE LINK>.** Start with **Before you start**.

## Branches: one starting point per session

| Branch            | What's in it                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `session-1-start` | The plain site: layout in `src/app/page.tsx` and `src/app/destinations/[slug]/page.tsx`. No Studio yet.    |
| `session-2-start` | The end of Session 1: Studio SDK, `/canvas`, one catch-all route, compounds, atoms and layouts registered. |
| `session-3-start` | The end of Session 2: breakpoints and design props.                                                        |
| `session-4-start` | The end of Session 3. Session 3 changes no code, so it's the same as `session-3-start`.                    |
| `final`           | The end of Session 4: design tokens.                                                                       |

Each branch is also the answer to the session before it. To switch, keep or
drop your own changes first:

```bash
git stash            # keeps your changes aside
git switch session-2-start
npm install
```

## Commands

| Command                       | What it does                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run setup`               | Before Session 1: creates your stack, its environment, Live Preview, tokens, content types and content. Safe to re-run.                                |
| `npm run dev`                 | The site at http://localhost:3000, which is what Studio loads. Keep it running during the sessions.                                                    |
| `npm run doctor`              | Checks everything is ready. Run it with `npm run dev` running.                                                                                         |
| `npm run catchup -- <N>`      | Rebuilds what the earlier sessions did in Studio: project settings, Sections, Templates, breakpoints. `2`, `3`, `4` or `final`. Asks before replacing. |
| `npm run build` / `npm start` | A production build (http, port 3000).                                                                                                                  |

`setup` and `catchup` use your Contentstack CLI login. If the CLI isn't logged in yet, `npm run setup` asks for your region and runs `csdx auth:login --oauth` for you, and it installs the CLI's Studio plugin if it's missing.

## What's inside

```
src/
  app/
    layout.tsx                  renders <StudioInit /> (from Session 1)
    studio-init.tsx             starts the Studio SDK in the browser and loads the registrations
    canvas/page.tsx             where Studio opens Sections
    [[...slug]]/page.tsx        one route for every page; template-renderer.tsx renders it
  components/
    compound/                   Header, Hero, Carousel, Destination Cards, Footer: layout fixed in code
    atoms/                      Heading, Text, Image, Badge, Button: one piece of content each
    layout/                     Container, Stack: hold other components
  lib/contentstack.ts           the stack, Live Preview and the Studio SDK (`sdk`)
  studio/
    register-components.ts      what Studio's palette offers (written by the Studio CLI)
    breakpoints.ts              Session 2: Desktop, Tablet, Mobile
    register-design-tokens.ts   Session 4 (written by the Studio CLI)
scripts/                        setup, doctor and catchup (no dependencies)
```

The file names and the setup code follow the Studio docs' Next.js App Router guide.
The plain site at `session-1-start` has only `app/`, `components/` and `lib/`.

### Content types

```
site_settings  (1 entry)   site_name · logo · nav_links (label, url) · footer_text
destination    (6 entries) title · url · site_settings → · tagline · image · duration · price
                           price_from · region · on_sale · spots_left · gallery (images)
                           itinerary (modular blocks: day, quote, photo) · related_trips → destination
home_page      (1 entry)   title · url · site_settings → · hero (group) · featured_destinations → destination
region         (2 entries) title · url · site_settings → · tagline · image · duration · price · trips → destination
```

Some details are deliberate, because the sessions use them. Region shares
Destination's field uids for the hero (title, tagline, image, image_alt,
duration, price), so one Section works on both. The itineraries mix their three
block types differently. The three European trips are all under $3,000.

## If something's wrong

Run `npm run doctor` first: every red line says what to do.

| Symptom                                     | Fix                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `No Contentstack OAuth session found`       | `csdx auth:login --oauth`                                                               |
| `A stack named "…" already exists`          | Run `npm run setup` again and give another name                                         |
| Studio's canvas is blank                    | `npm run dev` must be running, and http://localhost:3000 must open                      |
| `CONTENT_TYPE_NOT_FOUND … "compositions"`   | Create the Studio project first (Session 1). Its content type must be `compositions`.   |
| A change in Studio doesn't show on the site | Deploy it in Studio: Save keeps it in Studio, Deploy puts it on the site                |
| A component shows "Component Loading Error" | It's not registered: check `src/studio/register-components.ts` imports and registers it |

Sample photos are from [Unsplash](https://unsplash.com/license), downloaded
during setup; each asset's description records its source.
