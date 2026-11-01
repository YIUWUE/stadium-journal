# v9 verification — 2026-11-02

## Pointer browsing

Removed the previous/next arrow buttons. Fine mouse movement near the rail edges controls eased horizontal velocity; the central rest zone, leaving the rail, pointer down and modal entry stop the animation. Touch scrolling, dragging and keyboard browsing remain. Reduced motion disables continuous mouse scrolling and stops pending native smooth scroll. The help text changes with input/motion mode.

Browser checks moved the rail 77px by mouse movement alone, then verified center rest, reverse motion and immediate stop on leave. No model opened during movement, no arrow buttons remained, keyboard ArrowRight still previews Barcelona, and reduced-motion browsing stays still. All dialogs pause the underlying rail.

## Team finder

Four viewing-preference questions map to actual score-derived metrics. The published source corpus contains 19,839 deduplicated in-window fixtures; 4,220 unique matches involve the 24 candidate clubs (4,473 club appearances). The UI labels this effective sample and exposes the broader source count, periods, fixed-rule method and relevant league-format limits.

Questions/weights are designed and documented by this project. This is an interpretable preference matcher, not a fan-personality model or validated affinity predictor. No match/accuracy percentage is claimed. Neutral answers return explicitly labelled style examples rather than fabricated personalization.

Data source uses 47 original Football-Data.co.uk CSVs; exact source URLs, timestamps and SHA-256 hashes are retained. The data task independently verified every raw hash, rate/count identities, no odds fields and an identical offline rebuild. The source's private-use restriction is documented; Site audience remains owner-private. No model training is performed.

## Validation

- npm check validates syntax, all 24 stadium/model/audio/image/identity records and city credits. Additional tests cover all 81 answer combinations, deterministic ranking, three unique results, 18 distinct leading candidates across those paths, neutral/missing-answer handling and metric agreement with source counts.
- Browser completes the quiz, goes back with an answer retained, restarts and uses all-neutral answers. Each result has three candidates and source/window disclosure. Result entry opens the Metropolitano reconstruction, then close releases canvas/iframe/audio after the close event and audio fade settle.
- Phone 390×844: question page width and scroll width both 390px; result dialog width and scroll width both 372px. Mobile result card wrapping refined after visual inspection. Desktop viewport restored.
- Answers remain in current-page memory and are not submitted to a recommendation server. Source-read failure has an honest retry state. No model/audio is loaded by the quiz until a result is opened.

Screenshots and browser QA are ignored under output/playwright. Existing model sources, music and storage keys are preserved.
