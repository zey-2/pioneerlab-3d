# PioneerLab 3D: design and build plan

## Current playable scope

A miniature woodland camp with a backpacked learner, pines, tents, wooden learning stations and a fire ring. A field-journal interface uses forest green, cream and orange. Three stations are fully playable: Clove Hitch, Round Turn and Two Half Hitches, and Square Lashing. Each lesson is an authored static rope-path study with a moving tracer and a recall activity.

The journey is arrival → station → close-up rope lesson → recall activity → return to the same camp location. Each completed activity adds a distinct visual marker. The journal records in-app activity, not practical competence.

## Architecture

- Vite and Three.js produce a client-side static application. No account, API key or backend is required.
- `src/world.js`: procedural scenery, avatar movement, collision, orbit/follow camera, station proximity and completion markers.
- `src/lesson.js`: rope viewer, endpoint labels, deterministic step timeline and inspection controls.
- `src/content.js`: lesson registry, teaching text, references, quizzes and completion identifiers.
- `src/*rope-path.js`: continuous authored rope geometry for the three lessons.
- `src/state.js`: validated local progress, collision helpers and timeline boundaries.
- `src/main.js` and `src/style.css`: station menu, dialogs, responsive layout, keyboard focus and journal.

Desktop keyboard and mouse are the gameplay target. Narrow screens provide direct station access. Reduced motion and text content when WebGL cannot start preserve access to the learning flow.

## Incremental implementation

1. Build the camp and five-stage Clove Hitch; validate progress, movement and timeline behavior. The other stations began as labelled previews.
2. Add Shelter Corner as a six-stage fixed tie-off study. Keep finished-path tracing distinct from physical tying instructions. Preserve existing version-one saves and add an independent shelter completion marker. Refine the geometry for a compact dressed appearance.
3. Add the eight-stage Square Lashing around touching perpendicular spars: starting Clove Hitch, three wraps, two fraps, finishing Clove Hitch and inspection. Add independent rack completion and a rolled camp mat. All three stations now offer full lessons.
4. Run unit and geometry checks, build production assets, independently review the result and resolve reproduced findings. Review history and the scope of historical browser checks are recorded in `FEEDBACK.md`.

## Local verification and deployment

From the repository root, run `npm ci`, `npm test`, and `npm run build`. Serve the resulting `dist/` directory on any static web host. For local production inspection, run `npm run preview -- --port 4173 --strictPort`. Optional Python Playwright scripts use installed Microsoft Edge and expect that local preview address. They write their results into `artifacts/`.

The illustrations do not simulate rope forces or certify a load-bearing structure. Qualified instructional assessment and physical-phone testing remain outside this version.
