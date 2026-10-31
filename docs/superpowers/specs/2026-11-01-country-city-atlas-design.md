# Country-to-city exploration refinement

The user asks country selection to automatically zoom into the country with a transition, illuminate stadium cities immediately, and separate same-city stadium locations. Preserve the approved globe and remove unnecessary city-selection clicks.

Selecting a region animates the globe toward it, then crossfades to a sharp, north-up regional atlas in the same stage. Cities with one stadium are direct model-entry markers. Cities with multiple stadiums automatically reveal local coordinate insets with individually positioned club markers and direct model-entry buttons. Spain shows Barcelona and Madrid immediately; Madrid's Bernabeu and Metropolitano are placed separately using existing approximate coordinates. City selection is not a prerequisite for revealing them. No leader lines, invented roads or new map-service dependency.

The country map uses the local Natural Earth outline, fits its bounds on desktop and mobile, preserves region search/filter behavior, and offers a visible back-to-world action. Closing a stadium returns to the same country map. Reduced-motion users see the destination immediately. Distances and markers are illustrative, not navigation.

Validate Spain's two cities and three stadium entries, Madrid's distinct coordinate positions, another multi-city/multi-stadium country, filtering, keyboard entry, model close/return, mobile overflow and animation cancellation on repeated selections.

Self-review: the requested interaction refinement is concrete; all stadium data remain unchanged; local insets are automatic and not click-gated.
