/* ------------------------------------------------------------
   CEDT / Engineering Physics Health & Safety Resources Site
   Site-wide search - linked by EVERY page.

   Reads window.SEARCH_INDEX, built offline by build-search-index.py
   into assets/search-index.js and loaded via a plain <script src>
   (not fetch/XHR, so this also works when a page is opened directly
   as a local file - file:// blocks fetch of other local files, but
   not <script src>).

   Requires these element IDs to exist on the page:
     #siteSearchInput  #siteSearchResults
   ------------------------------------------------------------ */
(function () {
  var MAX_RESULTS = 20;
  var MIN_QUERY = 2;

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* The whole query is treated as one phrase, not a bag of independent
     words - a search for "summer student" only matches sections where
     that exact phrase appears, not sections where "summer" and "student"
     each show up somewhere unrelated. */
  function scoreSection(page, section, phrase) {
    var titleLower = page.title.toLowerCase();
    var headingLower = section.heading.toLowerCase();
    var textLower = section.text.toLowerCase();

    var inTitle = titleLower.indexOf(phrase) !== -1;
    var inHeading = headingLower.indexOf(phrase) !== -1;
    var count = 0, from = 0, idx;
    while ((idx = textLower.indexOf(phrase, from)) !== -1) { count++; from = idx + phrase.length; }

    if (!inTitle && !inHeading && !count) return -1;
    return (inTitle ? 50 : 0) + (inHeading ? 25 : 0) + count;
  }

  function snippetFor(text, phrase) {
    if (!text) return '';
    var lower = text.toLowerCase();
    var pos = lower.indexOf(phrase);
    if (pos === -1) pos = 0;

    var start = Math.max(0, pos - 60);
    var end = Math.min(text.length, pos + 140);
    var snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');

    var escaped = escapeHTML(snippet);
    var re = new RegExp('(' + escapeRegExp(phrase) + ')', 'ig');
    return escaped.replace(re, '<mark>$1</mark>');
  }

  function runSearch(query) {
    var phrase = query.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!phrase) return { phrase: phrase, results: [] };

    var index = window.SEARCH_INDEX || [];
    var results = [];
    for (var p = 0; p < index.length; p++) {
      var page = index[p];
      for (var s = 0; s < page.sections.length; s++) {
        var section = page.sections[s];
        var score = scoreSection(page, section, phrase);
        if (score > 0) results.push({ page: page, section: section, score: score });
      }
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return { phrase: phrase, results: results.slice(0, MAX_RESULTS) };
  }

  function render(container, phrase, results) {
    if (!results.length) {
      container.innerHTML = '<div class="ssr-empty">No matches</div>';
      container.classList.add('open');
      return;
    }
    var html = '';
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var href = r.page.url + (r.section.id ? '#' + r.section.id : '');
      var showHeading = r.section.heading && r.section.heading !== r.page.title;
      html += '<a class="ssr-item" href="' + href + '">' +
        '<span class="ssr-title">' + escapeHTML(r.page.title) + '</span>' +
        (showHeading ? '<span class="ssr-heading">' + escapeHTML(r.section.heading) + '</span>' : '') +
        '<span class="ssr-snippet">' + snippetFor(r.section.text, phrase) + '</span>' +
        '</a>';
    }
    container.innerHTML = html;
    container.classList.add('open');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('siteSearchInput');
    var panel = document.getElementById('siteSearchResults');
    if (!input || !panel) return;

    if (!window.SEARCH_INDEX) return;   /* search-index.js failed to load - fail quiet, not broken */

    var timer, active = -1;

    function close() {
      panel.classList.remove('open');
      panel.innerHTML = '';
      active = -1;
    }

    function setActive(items, next) {
      active = next;
      for (var i = 0; i < items.length; i++) items[i].classList.toggle('active', i === active);
      if (items[active]) items[active].scrollIntoView({ block: 'nearest' });
    }

    function run() {
      var q = input.value.trim();
      if (q.length < MIN_QUERY) { close(); return; }
      var found = runSearch(q);
      render(panel, found.phrase, found.results);
      active = -1;
    }

    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(run, 150);
    });

    input.addEventListener('focus', function () {
      if (input.value.trim().length >= MIN_QUERY) run();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); input.blur(); return; }

      var items = panel.querySelectorAll('.ssr-item');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(items, (active + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(items, (active - 1 + items.length) % items.length);
      } else if (e.key === 'Enter' && active >= 0 && items[active]) {
        e.preventDefault();
        window.location.href = items[active].getAttribute('href');
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target !== input && !panel.contains(e.target)) close();
    });
  });
})();
