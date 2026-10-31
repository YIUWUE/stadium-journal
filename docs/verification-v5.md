# v5 verification

## Scope delivered

- Main selection uses a 3D stadium globe with 24 positions, city clusters, direct stadium activation, camera flight, search and existing filters. The three introductory photograph cards were replaced by illustrated signal controls.
- Five author assets replaced with stadium-focused models. Urban/site-heavy Paris, Monumental, Metropolitano and Old Trafford sources removed from the active manifest. There are 13 active authored models plus all 24 original detailed reconstructions. Camp Nou is explicitly an expansion-design model.
- Local scenes contain stadium structure only; no plaza, street, tree or detached environment dressing. Seven previously missing authored stadiums have distinct original reconstruction profiles.

## Validation

- All JavaScript syntax and catalog/resource/source checks pass. Every stadium has an atlas position, photograph, audio metadata and reconstruction profile.
- Geometry validation from the renderer task: all 24 meshes have finite geometry/matrices; about 19k–36k representative individual seats, no environment dressing and at most 124 mesh batches. These seat counts are rendering detail, not stadium capacities.
- Browser opened Juventus, Stamford Bridge, Luz, Cruyff, De Kuip, Celtic and Napoli individually. Each reported its own profile, ready state, stadium-only environment and exactly one local canvas.
- Actual globe pointer drag changed camera from 2.617,2.409,-0.556 to 2.333,2.589,0.902. Keyboard/toolbar zoom and region controls work. London expands into Arsenal, Tottenham and Chelsea entries; keyboard activation enters the chosen stadium.
- A 390×844 phone viewport fits the globe, city menu and Stamford Bridge reconstruction without horizontal overflow; rendered model canvas width was 537px for its ~358px display width.
- Bernabeu replacement loaded in the actual browser with texture quality HD and automatic camera fit confirmed. Initial publisher framing was too close; viewer recentering and controlled framing now present the stadium body.
- Audio still plays from the click gesture and reaches 0.1000 volume; no video/manual-play interface introduced. Muting and source metadata preserved.
- Fixed two observed interaction races: global smooth scrolling moving targets during automatic focus, and a delayed modal close stealing focus from the next input. User-triggered anchor navigation still scrolls smoothly. Stale close events cannot dispose a newly opened stadium.
- Three.js shadow mode updated to PCFShadowMap for the pinned runtime, removing its deprecated soft-shadow warning.

## Source limits

Authored models and songs depend on their publishers. Original reconstructions are architectural interpretations, not surveyed CAD assets, and can represent historical stages. Higher render resolution and HD texture requests do not invent missing source detail. No restricted model files were extracted or purchased. Natural Earth outline data is public domain.

- Final close cleanup: zero open dialogs, audio elements, model canvases and authored iframes; one globe canvas remains. Empty search correctly shows reset, which restores all 24 stadiums.
