# PioneerLab 3D — Pinewood Camp

A playable, browser-based woodland campsite. Walk a backpacked character between three learning stations, inspect knots and a lashing, and complete their recall activities. Each completed activity adds a visible campsite detail: a rope-yard pennant, a shelter guyline, or highlighted rack joints and a rolled camp mat.

Built on 13 September 2026. This standalone source package contains the three-station playable prototype.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

For a production preview:

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Open the address printed by Vite. Use a local server; opening `index.html` directly will not load the modules.

## What works

- Actual third-person movement with WASD or arrow keys, drag-to-orbit camera, scroll zoom, collision handling, camera reset, and E to interact.
- Three complete stations and a direct station list: five-stage Clove Hitch, six-stage Round Turn and Two Half Hitches, and eight-stage Square Lashing at the Camp Rack Workshop. Each has a close-up 3D rope view, timeline, play/pause, front/side views, recall feedback, and repeat visits.
- A field journal saves station discovery and each recall completion independently in this browser. Any lesson can be completed first. Saves from earlier releases are preserved. Completed lessons add their own visible campsite marker.
- Native modal dialogs, keyboard controls, reduced motion, responsive station access, and written content when WebGL cannot start.

## Scope and limits

All lessons are authored **rope-path studies**: a moving bead traces a fixed strand. They do not simulate physical tying, friction, tension, or tightening. Shelter Corner shows a fixed tie-off after a line has been positioned, not an adjustable guyline hitch. Camp Rack Workshop studies one square-lashed joint between touching perpendicular spars; it does not teach or certify a full load-bearing rack design. Sampled geometry checks verify pole clearance, nonlocal strand separation and the Clove Hitch's visible standing-part crossing; they do not certify knot correctness or real-world suitability. The illustrations have not received a qualified instructor's assessment.

The lesson references official Scouting material and explains that the hitch can slip or bind. An activity badge records an in-app recall answer, not practical competence. No AI service, authentication, multiplayer, or account-wide storage is included.

Desktop keyboard and mouse are the gameplay target. Narrow-screen station and lesson access is supported; a touch movement controller and physical-phone testing are outside this version.

## Verification

```sh
npm test
npm run build
```

Node tests cover independent progress and save compatibility, timeline boundaries, collision rules, rope continuity, clearance and crossings.

The standalone export was freshly validated on 13 September 2026: **14/14 Node tests passed** and the production build passed. Vite reported a bundle-size advisory, not a build failure. See [export verification](artifacts/export-verification.json) for exact commands and outputs. The independent GPT-6 Astra workflow combined source review, numerical rope sampling and reproduced browser edge cases; the primary agent applied fixes and the reviewer rechecked them. [FEEDBACK.md](FEEDBACK.md) records the findings, fixes and limits for each release. Browser regression checks were not rerun during source packaging.

Optional browser checks use Python Playwright with installed Microsoft Edge:

```sh
python scripts/verify.py
python scripts/verify-edges.py
```

Install Playwright in the Python environment if needed. Both scripts expect the production preview at `http://127.0.0.1:4173`. The retained browser result JSON documents the earlier two-station release. Screenshot files are omitted from this source package. See `FEEDBACK.md` and `artifacts/station3-verification.json` for Station 3 evidence; the updated browser scripts are available to rerun against the current build.

- [Browser check results](artifacts/verification.json)
- [Independent review and fixes](FEEDBACK.md)
- [Design and build plan](docs/BUILD-PLAN.md)

Source uses Vite and Three.js, with dependency versions recorded in `package-lock.json`. Scenery and rope geometry are authored in code. Fonts load from Google Fonts when available, with local sans-serif fallbacks. No keys or secrets are required.

## Concept and build history

PioneerLab turns a small woodland camp into a navigable learning space. A learner walks to a station, inspects one continuous rope in 3D, checks an answer, and returns to a camp that records that activity visually. The field journal supports revisiting lessons in any order.

This package is the complete compact campsite slice: Clove Hitch at the rope practice yard, Round Turn and Two Half Hitches at Shelter Corner, and Square Lashing at the Camp Rack Workshop. Broader product concepts and separate rope-authoring experiments are outside this repository. All files needed to run, test and build this version are included.

The source baseline is commit `035f1a04bd79201fa4ed56fea2fe591275947c1c`. The export changes documentation for standalone use and omits private hosting metadata and historical screenshots. Application source, tests and dependency manifests match the baseline. See `export-manifest.json` for file hashes, exclusions and validation.
