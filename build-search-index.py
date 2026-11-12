#!/usr/bin/env python3
"""
build-search-index.py - generate assets/search-index.js for site-wide search.

Walks every real page (same discovery rule as check-links.py: every *.htm*
file except SHARED-TOP-BLOCK.html and 404.html), pulls the text out of each page's
<main id="main"> content only (so the masthead, red ribbon, left sidebar and
footer, identical on every page, never pollute the index), and breaks it
into sections at each heading (h1-h4, or a <summary> inside a <details>,
which lab-safety-handbook.html uses for its collapsible sections).

Each section keeps whatever id it can find (its own id=, or the nearest
enclosing element's id=) so a search result can deep-link straight to
page.html#section-id instead of just the top of the page.

No third-party packages - stdlib only, same as check-links.py.

Usage:
    python build-search-index.py            # writes assets/search-index.js
    python build-search-index.py --check    # write nothing; exit 1 if the
                                             # committed file is stale

Re-run this any time page content changes; the output is a plain committed
file, not something built automatically (this project has no build step).
--check is what the git pre-commit hook (.git/hooks/pre-commit) runs to
catch a forgotten regeneration before it's committed.
"""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "assets" / "search-index.js"
CHECK_ONLY = "--check" in sys.argv

HEADING_TAGS = {"h1", "h2", "h3", "h4"}
SKIP_TEXT_TAGS = {"script", "style"}
WS_RE = re.compile(r"\s+")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_main = 0
        self.main_seen = False
        self.svg_depth = 0
        self.skip_depth = 0          # inside <script> or <style>
        self.id_stack = []           # ids of currently-open ancestor tags
        self.sections = []           # finished sections
        self.heading_tag = None      # tag name of heading currently being read
        self.heading_buf = []
        self.body_buf = []
        self.cur_id = ""
        self.cur_heading = ""

    # -- helpers ---------------------------------------------------------
    def _flush(self):
        text = WS_RE.sub(" ", "".join(self.body_buf)).strip()
        if text or self.cur_heading:
            self.sections.append({
                "id": self.cur_id,
                "heading": self.cur_heading,
                "text": text,
            })
        self.body_buf = []

    def _nearest_id(self):
        for i in reversed(self.id_stack):
            if i:
                return i
        return ""

    # -- HTMLParser hooks --------------------------------------------------
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "main" and d.get("id") == "main":
            self.in_main += 1
            self.main_seen = True
        if not self.in_main:
            return

        if tag == "svg":
            self.svg_depth += 1
        if tag in SKIP_TEXT_TAGS:
            self.skip_depth += 1

        self.id_stack.append(d.get("id", ""))

        if tag in HEADING_TAGS or tag == "summary":
            self._flush()
            self.heading_tag = tag
            self.heading_buf = []
            # own id wins; otherwise fall back to the nearest open ancestor's
            # id (eg. a <summary> takes its parent <details id="...">'s id)
            self.cur_id = d.get("id") or self._nearest_id()

    def handle_endtag(self, tag):
        if not self.in_main:
            return

        if tag in HEADING_TAGS or tag == "summary":
            if self.heading_tag == tag:
                self.cur_heading = WS_RE.sub(" ", "".join(self.heading_buf)).strip()
                self.heading_tag = None

        if self.id_stack:
            self.id_stack.pop()
        if tag == "svg" and self.svg_depth:
            self.svg_depth -= 1
        if tag in SKIP_TEXT_TAGS and self.skip_depth:
            self.skip_depth -= 1

        if tag == "main" and self.in_main:
            self.in_main -= 1
            if not self.in_main:
                self._flush()

    def handle_data(self, data):
        if not self.in_main or self.svg_depth or self.skip_depth:
            return
        if self.heading_tag:
            self.heading_buf.append(data)
        else:
            self.body_buf.append(data)


def load_title(html_text):
    m = re.search(r"<title>(.*?)</title>", html_text, re.S | re.I)
    if not m:
        return ""
    t = re.sub(r"\s+", " ", m.group(1)).strip()
    # every <title> is "CEDT / Engineering Physics - Page Name" - the page
    # name alone reads better as a search-result title than repeating the
    # site name in every single row
    return re.sub(r"^CEDT\s*/\s*Engineering Physics\s*[—–-]\s*", "", t).strip() or t


def build_page(path):
    html_text = path.read_text(encoding="utf-8", errors="replace")
    parser = PageParser()
    parser.feed(html_text)
    if not parser.main_seen:
        return None

    sections = [s for s in parser.sections if s["text"] or s["heading"]]
    if not sections:
        return None

    # "main" only ever surfaces here as the fallback id for a heading with
    # no id of its own and no other enclosing id (almost always the h1) -
    # linking to page.html#main isn't meaningfully different from just
    # page.html, so drop it rather than emit a slightly odd-looking anchor
    for s in sections:
        if s["id"] == "main":
            s["id"] = ""

    title = sections[0]["heading"] or load_title(html_text) or path.name
    return {
        "url": path.name,
        "title": title,
        "sections": sections,
    }


def main():
    SKIP_DIRS = ("backup", "bak", ".git", "node_modules")
    SKIP_FILES = ("SHARED-TOP-BLOCK.html", "404.html")
    pages = sorted(p for p in ROOT.rglob("*.htm*")
                   if not p.name.endswith(".bak")
                   and p.name not in SKIP_FILES
                   and not any(part.lower().startswith(SKIP_DIRS) or "backup" in part.lower()
                               for part in p.relative_to(ROOT).parts[:-1]))
    if not pages:
        sys.exit(f"No .html files found under {ROOT}")

    index = []
    for p in pages:
        entry = build_page(p)
        if entry:
            index.append(entry)

    total_sections = sum(len(e["sections"]) for e in index)
    print(f"Indexed {len(index)} page(s), {total_sections} section(s).")

    body = json.dumps(index, ensure_ascii=False, separators=(",", ":"))
    contents = (
        "/* Auto-generated by build-search-index.py - do not hand-edit.\n"
        "   Regenerate after any content change: python build-search-index.py */\n"
        "window.SEARCH_INDEX = " + body + ";\n"
    )

    if CHECK_ONLY:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else None
        if current != contents:
            print(f"STALE: {OUT.relative_to(ROOT)} doesn't match current page content.")
            print("Run: python build-search-index.py")
            sys.exit(1)
        print(f"{OUT.relative_to(ROOT)} is up to date.")
        return

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(contents, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
