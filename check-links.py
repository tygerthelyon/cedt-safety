#!/usr/bin/env python3
"""
check-links.py - verify every link and image across a folder of HTML pages.

Usage:
    python3 check-links.py /path/to/site            # internal links + images only
    python3 check-links.py /path/to/site --external # also test external URLs

Reports, per file:
  BROKEN   internal href/src pointing at a file that does not exist
  ANCHOR   #fragment with no matching id= or name= on the target page
  DEAD     external URL returning 4xx/5xx or failing to connect
  REDIR    external URL that redirects (worth updating to the final URL)

The masthead, sidebar nav, and footer are injected at runtime by
shared-layout.js (see that file), not present as literal <a> tags in
any page's HTML. This script can't execute JavaScript, so it also
parses shared-layout.js's MASTHEAD_HTML/NAVMENU_HTML/FOOTER_HTML
strings directly and checks those links too - otherwise every page
only reachable through that shared nav would wrongly show up as an
orphan, and a broken shared-nav link (which breaks on all 33 pages at
once) would go completely undetected.

Only the standard library is required.
"""

import sys, os, re, html
from pathlib import Path
from urllib.parse import urlparse, unquote
from html.parser import HTMLParser

EXTERNAL = "--external" in sys.argv
_paths = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = Path(_paths[0] if _paths else ".").resolve()   # no path given = this folder

if not ROOT.is_dir():
    sys.exit("Not a folder: %s\n"
             "Usage:  python check-links.py [folder] [--external]" % ROOT)

LINK_ATTRS = {"a": "href", "link": "href", "img": "src",
              "script": "src", "iframe": "src", "source": "src"}


class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []   # (tag, url, line)
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        for key in ("id", "name"):
            if d.get(key):
                self.ids.add(d[key])
        attr = LINK_ATTRS.get(tag)
        if attr and d.get(attr):
            self.links.append((tag, d[attr].strip(), self.getpos()[0]))


def parse(path):
    p = Collector()
    p.feed(path.read_text(encoding="utf-8", errors="replace"))
    return p


def ids_of(path, cache={}):
    if path not in cache:
        try:
            cache[path] = parse(path).ids
        except Exception:
            cache[path] = set()
    return cache[path]


def _extract_js_string_var(js_text, var_name, next_var_name):
    """Pull a JS var built from `'...' + '...' + ...;` back into one string.
    shared-layout.js builds MASTHEAD_HTML/NAVMENU_HTML/FOOTER_HTML this way;
    this reassembles them so the links inside can be checked like any other
    HTML. Hardcoded to this file's exact structure, not a general JS parser."""
    m = re.search(rf"var {var_name} =\n((?:.*\n)+?)  var {next_var_name}", js_text)
    if not m:
        return ""
    return "".join(re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1)))


def shared_layout_collector():
    """The masthead, sidebar nav, and footer are injected into every real
    page at runtime by shared-layout.js, not present as literal <a> tags in
    any page's own HTML. Reconstruct those three HTML fragments from the JS
    source and run them through the same Collector used for real pages, so
    their links get checked and their targets count toward "is this page
    linked from anywhere" - otherwise every page only reachable through the
    shared sidebar nav would wrongly show up as an orphan."""
    js_path = ROOT / "shared-layout.js"
    if not js_path.exists():
        return None
    js_text = js_path.read_text(encoding="utf-8")
    fragments = [
        _extract_js_string_var(js_text, "MASTHEAD_HTML", "NAVMENU_HTML"),
        _extract_js_string_var(js_text, "NAVMENU_HTML", "FOOTER_HTML"),
        _extract_js_string_var(js_text, "FOOTER_HTML", "main"),
    ]
    p = Collector()
    p.feed("".join(fragments))
    return p


def check_external(url, cache={}):
    if url in cache:
        return cache[url]
    import urllib.request, urllib.error, ssl
    ctx = ssl.create_default_context()
    req = urllib.request.Request(
        url, method="HEAD",
        headers={"User-Agent": "Mozilla/5.0 (link-checker)"})
    try:
        with urllib.request.urlopen(req, timeout=12, context=ctx) as r:
            final = r.geturl()
            # A SharePoint/OneDrive link bouncing to the Microsoft login page is
            # normal for an authenticated document, not a broken link.
            if "login.microsoftonline.com" in final or "login.live.com" in final:
                result = ("OK", "auth redirect (expected)")
            elif final.rstrip("/") != url.rstrip("/"):
                result = ("REDIR", f"{r.status} -> {final}")
            else:
                result = ("OK", str(r.status))
    except urllib.error.HTTPError as e:
        # Some servers reject HEAD; retry with GET before calling it dead
        if e.code in (403, 405, 501):
            try:
                req2 = urllib.request.Request(
                    url, headers={"User-Agent": "Mozilla/5.0 (link-checker)"})
                with urllib.request.urlopen(req2, timeout=12, context=ctx) as r:
                    result = ("OK", str(r.status))
            except Exception as e2:
                result = ("DEAD", f"{type(e2).__name__}: {e2}")
        elif e.code == 403:
            result = ("BLOCKED", "403 - server refuses scripted requests; "
                                 "check this one in a browser")
        else:
            result = ("DEAD", f"HTTP {e.code}")
    except Exception as e:
        result = ("DEAD", f"{type(e).__name__}: {e}")
    cache[url] = result
    return result


def main():
    SKIP_DIRS = ("backup", "bak", ".git", "node_modules")
    pages = sorted(p for p in ROOT.rglob("*.htm*")
                   if not p.name.endswith(".bak")
                   and p.name != "SHARED-TOP-BLOCK.html"
                   and not any(part.lower().startswith(SKIP_DIRS) or "backup" in part.lower()
                               for part in p.relative_to(ROOT).parts[:-1]))
    if not pages:
        sys.exit(f"No .html files found under {ROOT}")

    print(f"Scanning {len(pages)} page(s) under {ROOT}\n")
    problems = 0
    grouped = {}
    seen_targets = set()

    def check_doc_links(doc, base_dir):
        """Check every link/image found by a Collector. base_dir is what
        relative internal paths resolve against (a page's own folder, or
        ROOT for the shared-layout fragment - all real pages live at ROOT
        anyway, so it's the same resolution either way)."""
        issues = []
        for tag, raw, line in doc.links:
            url = html.unescape(raw)
            if url.startswith(("mailto:", "tel:", "javascript:", "data:", "#!")):
                continue

            # ---- pure fragment: must exist on this page
            if url.startswith("#"):
                frag = unquote(url[1:])
                if frag and frag not in doc.ids:
                    issues.append(f"  ANCHOR  line {line:>4}  {url}  (no id on this page)")
                continue

            parsed = urlparse(url)

            # ---- external
            if parsed.scheme in ("http", "https"):
                if EXTERNAL:
                    status, detail = check_external(url)
                    if status != "OK":
                        issues.append(f"  {status:<7} line {line:>4}  {url}\n           {detail}")
                continue
            if parsed.scheme:
                continue  # some other protocol, skip

            # ---- internal file
            target_rel = unquote(parsed.path)
            if not target_rel:
                continue
            target = (base_dir / target_rel).resolve()
            seen_targets.add(target)

            if not target.exists():
                issues.append(f"  BROKEN  line {line:>4}  {url}  <{tag}>")
            elif parsed.fragment and target.suffix.lower() in (".html", ".htm"):
                if unquote(parsed.fragment) not in ids_of(target):
                    issues.append(
                        f"  ANCHOR  line {line:>4}  {url}  (no such id in {target.name})")
        return issues

    for page in pages:
        try:
            doc = parse(page)
        except Exception as e:
            print(f"!! could not parse {page.name}: {e}")
            continue

        issues = check_doc_links(doc, page.parent)
        if issues:
            problems += len(issues)
            for text in issues:
                key = text.split("  ", 2)[-1].strip()
                grouped.setdefault(key, []).append(page.name)

    shared = shared_layout_collector()
    if shared is not None:
        issues = check_doc_links(shared, ROOT)
        if issues:
            problems += len(issues)
            for text in issues:
                key = text.split("  ", 2)[-1].strip()
                grouped.setdefault(key, []).append("shared-layout.js (every page)")

    # ---- grouped report: each distinct problem shown ONCE ----
    if grouped:
        print("Each distinct problem is listed once, with the pages it affects.\n")
        for key in sorted(grouped, key=lambda k: (-len(grouped[k]), k)):
            where = sorted(set(grouped[key]))
            short = key if len(key) < 140 else key[:137] + "..."
            print("  " + short)
            if len(where) > 4:
                print("      on %d pages: %s, ..." % (len(where), ", ".join(where[:3])))
            else:
                print("      on: %s" % ", ".join(where))
        print()

    # ---- orphan report: pages nothing links to
    linked = {t for t in seen_targets if t.suffix.lower() in (".html", ".htm")}
    orphans = [p for p in pages if p.resolve() not in linked
               and p.name.lower() not in ("index.html", "index.htm", "404.html")]
    if orphans:
        print("Pages that nothing links to (possible orphans):")
        for o in orphans:
            print(f"  {o.relative_to(ROOT)}")
        print()

    print("=" * 60)
    print(f"{problems} issue(s) found." if problems else "No broken links found.")
    if not EXTERNAL:
        print("External URLs were not tested. Re-run with --external to check them.")


if __name__ == "__main__":
    main()