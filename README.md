# CEDT & Engineering Physics Health and Safety Portal

A departmental safety resources website developed for the Centre for Emerging Device Technologies (CEDT) and the Department of Engineering Physics at McMaster University.

## Overview

The website serves as the central health and safety reference for faculty, researchers, graduate students, and staff working in facilities across the CEDT.

### Architecture

* HTML, CSS, and JavaScript with zero third-party framework runtime dependencies. Loads instantaneously and operates fully offline or over static web hosting.
* Shared Layout Engine (`shared-layout.js`): centralized client-side layout injector that renders the McMaster departmental header, navigation sidebar, emergency quick-access widgets, and page breadcrumbs at runtime, which maintains consistent state and current-page highlighting across all 34 sections.
* Instant Client-Side Search (`search.js`, `assets/search-index.js`): built-in full-text search which enables keyword queries with deep-linking directly to specific subheadings and anchors.
* **Build & Verification Tooling:**
  * `build-search-index.py`: Python standard-library script that parses `<main>` page markup to extract headings and content into the search index.
  * `check-links.py`: Automated audit tool that scans internal references, `#anchor` targets, media paths, and layout navigation to guarantee zero dead links.

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

Developed by Carter Yott in Summer 2026 for the Centre for Emerging Device Technologies and the Department of Engineering Physics at McMaster University, modernizing the previous departmental safety resource website (developed by Graham Pearson) with support from supervisors Doris Stevanovic and Nebile Isik Goktas.
