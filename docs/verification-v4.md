# v4 verification

- Syntax and catalog checks: 24 unique stadiums, local photographs and credits, 24 real team audio streams, 17 authored model metadata records, 24 local architectural profiles.
- Public source validation: all 24 selected audio URLs returned HTTP 206 with audio content types (the River recording was validated separately). Audio files remain on their original hosts.
- All 24 local models were opened through the browser UI after geometry changes. Every result reported ready, exactly one local canvas and zero authored iframes. Independent seating counts range from 8,026 to 18,562; the Boca three-sided bowl has 10,243. Switching releases the preceding viewer.
- Authored Allianz model loaded successfully in the actual page with visible photographic textures and surrounding buildings. Original author attribution remains available.
- Official Barcelona chant started from the stadium-opening click without a play control. Browser inspection confirmed readyState 4, paused false, currentTime advancing, and final volume 0.1000 after the fade.
- Small mute button toggled successfully and its preference survived reload. Switching to photographs removed both model iframe and local canvas.
- A 390 × 844 viewport fits the detail dialog and model stage without horizontal overflow. Audio captions use the full available line width on phones.
- Closing a stadium was rechecked after the transition: dialog closed, audio elements 0, model iframes 0, local canvases 0.
- Keyboard focus expands the cover entry and retains independent favorite actions.
- Close, model presets, filtering, card entry and source links checked through the browser. Full regression of older quiz/passport scoring is outside this change; their implementation is preserved.

Limitations: authored models and audio need their external publishers to remain available. Models may show historical editions. Seven stadiums currently use the improved local reconstruction rather than an authored precision asset. A loading failure presents a local reconstruction or photograph; no video or unrelated music substitutes are used.
