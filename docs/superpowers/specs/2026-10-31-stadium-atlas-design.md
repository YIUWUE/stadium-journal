# Stadium atlas and isolated models

Approved by the user: replace card selection with an interactive stadium globe. Clicking a stadium flies into its own model exhibit. Preserve low-volume, fading, pure home-team audio and the small mute control.

## Experience

A dark globe with luminous coastlines and club-colour markers becomes the main exploration surface. Drag to rotate; hover or focus a stadium label for its identity; activate it to open the exhibit with a flight transition. Search, league filters, favourites and a compact accessible stadium index remain available. Close the exhibit to return to the same globe view. Touch and reduced-motion alternatives remain fully usable.

## Model requirements

Display the stadium itself without neighbouring urban buildings. Inspect source nodes and replace inseparable city scans with stadium-only assets or explicit architectural reconstruction. Request the publisher's highest available texture quality; avoid claiming that increased pixel resolution restores detail absent in the source. Curate author and edition information for every asset. Complete detailed local models for all 24 stadiums, including the seven currently lacking authored assets, with stadium-specific structure and higher-quality rendering. Distinguish author-provided models and reconstructed geometry honestly.

## Implementation plan

1. Audit model sources, node structure and quality; retain attribution and do not extract restricted models.
2. Build the globe and its accessible stadium index as a separate module using the existing local Three.js runtime.
3. Connect filters, saved stadiums and exhibit entry. Pause the globe while an exhibit is open.
4. Isolate model views, improve texture quality and complete the local geometry catalogue.
5. Verify globe selection, gestures, keyboard input, model switching, audio lifecycle, phone layout and reduced motion; publish to the existing private Site.

Self-review: the selected interaction has user approval; music behavior remains in scope; original scans are not described as newly detailed assets; no downloads requiring authorization or purchase are assumed.
