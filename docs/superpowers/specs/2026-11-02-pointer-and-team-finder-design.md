# Pointer-driven club rail and evidence-based team matching

The user explicitly requests mouse movement to browse the club rail instead of arrow clicks, and a short questionnaire that helps find a home team with real data support.

Mouse UX: remove arrow buttons; a fine mouse near either edge of the club rail controls smoothly eased horizontal velocity, the central area is a rest zone, leaving the rail or opening a modal stops motion. Pointer down stops automatic motion so direct club activation remains reliable. Keep touch scrolling, mouse dragging and keyboard arrows/Home/End. Respect reduced-motion preference and avoid continuous animation offscreen.

Quiz UX: a visible optional home-team finder, four plain-language viewing-preference questions, progress/back/restart, and three explainable candidate clubs. The dimensions use observed domestic league match metrics (goal density, win frequency, scoring/clean sheets and home/away point rates). Show source window, match counts and recommendation evidence, with expandable methodology. Answers are calculated locally.

Evidence: collect a genuine multi-season public results corpus, aggregate all 24 primary club profiles and expose source URLs, row counts, coverage and reproducible build logic. Do not claim a fan-personality model, predictive accuracy or learned correlations that have not been measured. Compare domestic frequencies as viewing preferences, not as cross-league strength rankings. Neutral answers must not produce a fabricated personalized fit. Source failures show an honest retry state.

Validation: mouse-only edge scroll/rest/leave/boundary behavior, click safety, touch/keyboard, paused/reduced motion; quiz source validation, all options/neutral/back/restart, score determinism and sensitivity, source/metadata rendering, direct model entry and mobile layout. Publish to the existing owner-private Site.

Self-review: both requests are explicit. Large-corpus aggregates are factual; questions and matching are documented design choices, not psychometric claims. No betting fields ship.
