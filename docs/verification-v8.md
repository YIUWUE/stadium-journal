# v8 verification — 2026-11-02

## Delivered

- Main flow is city opening → direct club selection → existing 3D exhibit. Removed active globe, country maps, city hierarchy and local insets, including their unused scripts/styles/textures.
- Initial page has 24 club entries and zero canvas, audio or iframe elements. Models and pure home-team audio are still mounted only after explicit stadium activation.
- 19 licensed real city photos cover all 24 stadium records. Each local image is under 700 KB, with author, license, license URL and source URL in city-credits.json and the in-app credits. Original club-colour monograms are identified as navigation graphics rather than official crests.

## Browser validation

- Isolated Playwright CLI session using local Microsoft Edge. The previously available browser-control namespace was unavailable, so the Playwright skill supplied this QA path.
- Hovered Barcelona: club preview updates and no model/media is created. Later verified Paris background loads and fades in from its matching city record.
- Directly activated Atletico's club symbol; Metropolitano reconstruction reached ready. Closing releases its model canvas/audio/iframe; subsequent checks find zero remaining media.
- London search produces exactly three club entries. Empty favourites produces reset; reset restores 24 entries.
- Keyboard ArrowRight from Real Madrid previews Barcelona. Mouse drag moved the club rail 443px and did not open the stadium. Passport opens and closes normally.
- At 390×844, opening and selector both have clientWidth = scrollWidth = 390px; no horizontal page overflow. Keyboard browsing changes active club to Barcelona; city photography is present. Desktop viewport restored after responsive checks.
- All 19 city-photography entries are present in the live credits dialog. Final initial-page/preview run checks browser errors.

## Automated and visual checks

npm run check covers all script syntax, 24 distinct stadium identities, all photo/model/audio records, original navigation marks, city image/source coverage and removal of the old map flow. Desktop opening and selector, plus phone opening and selector, were captured and visually inspected. Test outputs are ignored under output/playwright/.

Existing browser storage keys, model author/edition labels, music sources and low-volume mute behavior are preserved. Third-party model/audio availability remains controlled by its publisher; local reconstructions remain architectural interpretations rather than surveyed files.
