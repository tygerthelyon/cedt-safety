# CEDT & Engineering Physics Health and Safety Portal

A departmental safety resources portal, compliance hub, and laboratory safety handbook developed for the Centre for Emerging Device Technologies (CEDT) and the Department of Engineering Physics at McMaster University.

## Overview

The portal serves as the central health and safety reference for faculty, researchers, graduate students, and staff working in experimental research facilities, cleanrooms, and undergraduate instructional laboratories across the department.

### Architecture

* **Static & Local-First:** Pure HTML, CSS, and vanilla JavaScript with zero third-party framework runtime dependencies. Loads instantaneously and operates fully offline or over static web hosting.
* **Shared Layout Engine (`shared-layout.js`):** A centralized client-side layout injector that renders the McMaster departmental header, navigation sidebar, emergency quick-access widgets, and page breadcrumbs at runtime, maintaining consistent state and current-page highlighting across all 34 sections.
* **Instant Client-Side Search (`search.js`, `assets/search-index.js`):** Built-in full-text search indexing 150+ headings and sections. Enables keyword queries with deep-linking directly to specific subheadings and anchors.
* **Build & Verification Tooling:**
  * `build-search-index.py`: Python standard-library script that parses `<main>` page markup to extract headings and content into the search index.
  * `check-links.py`: Automated audit tool that scans internal references, `#anchor` targets, media paths, and layout navigation to guarantee zero dead links.

---

## Content & Safety Modules

* **Laboratory Safety Handbook:** Comprehensive guidelines on PPE, glassware handling, gas cylinders, vacuum systems, cryogens, and general laboratory etiquette.
* **Hazard Protocols:**
  * **Chemical:** WHMIS 2015 / GHS pictograms, SDS databases, chemical compatibility, storage, and waste management.
  * **Electrical:** High-voltage safety, arc flash awareness, lock-out/tag-out, and circuit breaker locations.
  * **Laser Safety:** Class 3B and Class 4 laser procedures, interlocks, alignment precautions, and eyewear requirements.
  * **Radiation Safety:** X-ray diffractometer protocols, sealed sources, radioisotopes, and badge monitoring.
* **Emergency Procedures:** Immediate response workflows for 911 dispatch, critical injuries, chemical spills, eyewash/shower stations, and evacuation routes.
* **Training & Compliance:** Matrices for both university-wide mandatory training (EHS) and CEDT site-specific equipment checkouts, JHSC inspection checklists, and standard operating procedure (SOP) documentation templates.

---

## Local Development & Usage

Serve the site locally using any standard static file server:

```bash
# Using Python 3:
python -m http.server 8000
```

Then navigate to `http://localhost:8000` in your web browser.

### Verifying Links and Updating the Search Index

To audit links across the site:
```bash
python check-links.py .
```

To regenerate the client-side search index after making text changes:
```bash
python build-search-index.py
```

---

## Author & Attribution

Developed by **Carter Yott** (Summer 2026) for the Centre for Emerging Device Technologies and the Department of Engineering Physics at McMaster University, modernizing the previous departmental safety resources with support from facility managers and the Joint Health and Safety Committee.
