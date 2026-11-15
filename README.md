# MarsPath — Postcards from Mars

**NASA / USGS-inspired GIS workspace and expedition-planning prototype for Jezero Crater, Mars.**

MarsPath is a browser-based interactive planning experience that brings together a layered Martian map, environmental controls, route comparison, scientific context, and a simulated astronaut visor interface. This repository is the modular development version of the supplied single-file HTML project.

> **Data-preservation note:** The project's original JavaScript data declarations have been moved verbatim into `data.js`. Their values and ordering were not intentionally edited. The HTML content, application logic, and CSS were separated into their own files; this restructuring is not a scientific validation of the underlying datasets or claims.

---

## Contents

- [Highlights](#highlights)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Application architecture](#application-architecture)
- [Data integrity](#data-integrity)
- [External services and dependencies](#external-services-and-dependencies)
- [Development workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Limitations and scientific-use notice](#limitations-and-scientific-use-notice)

## Highlights

The interface is organized into four main work areas:

1. **Mission Map** — interactive canvas-based Mars map, map layers, waypoints, map inspection tools, coordinate readout, and elevation-profile presentation.
2. **Environment** — environmental parameter controls and visibility/readout calculations.
3. **Route Analysis** — comparison of three candidate traverses and related mission metrics.
4. **Science & Sources** — scientific context, dataset notes, and source information.

Additional interface features include:

- Light and dark visual themes.
- A simulated AR-style helmet visor / HUD.
- Emergency-abort presentation state.
- Site AI Analyst drawer and chat interface.
- Responsive layouts for desktop and smaller screens.

Feature availability and live-data behavior depend on the original application logic and external services configured in that code.

## Project structure

```text
space_path1/
├── index.html          # Page structure and interface markup
├── README.md           # Project documentation
├── style.css           # Original visual styles and responsive rules
├── data.js             # Preserved project data declarations
└── app.js              # Application behavior, calculations, rendering, events
```

### File responsibilities

| File | Responsibility |
|---|---|
| `index.html` | Semantic page structure, controls, panels, and interface elements |
| `style.css` | Theme variables, layout, components, responsive styling, and HUD visuals |
| `data.js` | Static project datasets and reference records |
| `app.js` | Map rendering, application state, calculations, interactions, and analyst UI |

The page loads `data.js` before `app.js`, so the application can access the preserved data declarations when it initializes.

## Getting started

### Requirements

- A modern browser (Chrome, Edge, Firefox, or Safari).
- A local static web server is recommended.
- Internet access may be needed for externally hosted fonts and map/data services used by the original application.

### Option A — Python

Open a terminal in the project root and run:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

### Option B — Visual Studio Code

1. Open the `MarsPath-Development` folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

You can also open `index.html` directly in a browser. If map services or browser security restrictions prevent some features from working, use a local server instead.

## Application architecture

MarsPath uses a lightweight, framework-free front end:

- **HTML5** provides the document and interface structure.
- **CSS3** provides styling, themes, responsive layout, and visual effects.
- **Vanilla JavaScript** manages state, canvas drawing, calculations, UI events, and interactions.
- **HTML Canvas / SVG** are used by the original interface for map and HUD visualizations.
- External resources are loaded by the browser where referenced by the source project.

No build step, package installation, or bundler is required for the current structure.

## Data integrity

The original inline data declarations were extracted into `data.js` without intentionally changing their contents. This file is separated from the application logic so that future interface and behavior work can be performed without editing the static data.

**Recommended workflow:**

- Treat `data.js` as read-only unless a deliberate dataset update is required.
- Make interface changes in `index.html` and `style.css`.
- Make behavior changes in `app.js`.
- If data must be updated, make a separate, documented change and record its source and date.
- Do not interpret the words “NASA / USGS verified” in the interface as independent verification performed by this refactor.

The data file contains the project's existing declarations, including landmark records, geologic-unit records, traverse points, and region callouts. This README does not certify their scientific accuracy.

## External services and dependencies

The project is intentionally kept dependency-light. The original source references externally hosted typography and includes its own application logic. Some map layers, imagery, or analyst features may rely on network services or endpoints referenced in `app.js`.

For reliable operation:

- Keep an internet connection available when using network-backed layers.
- Check the browser developer console if a remote resource fails.
- Review the relevant service's usage policy, attribution requirements, rate limits, and availability before deploying publicly.
- Do not add private API keys or credentials directly to client-side JavaScript.

The application should be treated as a client-side prototype unless its external integrations, data provenance, and operational assumptions have been independently reviewed.

## Development workflow

1. Start the local server using one of the methods above.
2. Edit the relevant file according to the architecture table.
3. Refresh the browser and inspect the developer console.
4. Test the map, layer controls, route selection, theme toggle, visor, and analyst drawer after changes.
5. Keep `data.js` unchanged when working only on presentation or application behavior.

### Suggested quality checks

- Test at desktop and mobile viewport widths.
- Confirm both themes remain readable.
- Verify all navigation links and buttons.
- Check map interactions with mouse and touch input.
- Confirm the page still loads when an optional external service is unavailable.
- Re-check that the data file has not changed after UI-only work.

## Troubleshooting

| Symptom | What to check |
|---|---|
| Page is unstyled | Confirm `style.css` exists and the path in `index.html` is correct |
| Controls do nothing | Check that both JavaScript files load and inspect the browser console |
| Map tiles or layers are missing | Check internet connectivity, remote service availability, and browser network errors |
| Fonts look different | The browser may be unable to reach Google Fonts; local system fallbacks are defined |
| Some features fail from a file URL | Run the project through a local HTTP server |

## Limitations and scientific-use notice

MarsPath is an educational / exploratory planning prototype. Route scores, visibility estimates, oxygen budgets, environmental parameters, and simulated HUD information should not be used as real mission-operational guidance.

NASA and USGS names or references in the interface describe the project's stated data context; this repository restructuring does not imply endorsement by either organization. Validate datasets against their authoritative publications and services before using them in research or public-facing scientific work.

---

## License

No license was supplied with the source HTML. All rights and permissions therefore remain with their respective owners. Add an explicit license only after confirming that you have the right to distribute the project and any included assets or data.
