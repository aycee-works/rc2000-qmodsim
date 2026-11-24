# Design system

The Reading Club 2000 public-site palette supplies cream, paper, navy, burgundy, and gold. Dark mode uses the public site’s deep blue-gray surfaces with gold foreground accents. The hero illustrates the intake workflow, the Scenarios view opens first, and the Codex links module cards to derivations. Thin borders define the desk, controls, and charts. Georgia headings, system-text body copy, and monospace metric values use local fonts.

The Lab places controls beside a volunteer-desk view and simulation outputs. Scenarios uses a narrative, radio choices, and comparison table. Codex uses expandable derivations. Smaller screens stack the workbench. Canvas content has adjacent textual readouts. Reduced-motion preference starts the simulation paused.

Architecture: index.html and style.css define the shell. src/app.js applies validated numeric input, routes between views, manages browser state, and paints the canvases. src/engines/model.js owns numerical calculations. risk-worker.js calls the same engine in a background worker when served over HTTP.

