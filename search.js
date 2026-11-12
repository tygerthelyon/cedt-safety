/* ------------------------------------------------------------
   CEDT / Engineering Physics Health & Safety Resources Site
   Shared page script - linked by EVERY page.

   CURRENT-PAGE HIGHLIGHT
   Marks the left-sidebar link matching the page you are on, so
   the shared block never has to be hand-edited per page.

   Matches on filename only, so it works from any folder depth
   and whether or not the URL carries a query string or #anchor.
   ------------------------------------------------------------ */
(function () {
  var HOME = 'index.html';   /* used when the URL ends in a bare "/" */

  function filename(path) {
    var last = path.split('/').pop();
    last = last.split('?')[0].split('#')[0];
    return (last || HOME).toLowerCase();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var here = filename(window.location.pathname);
    var links = document.querySelectorAll('#navmenu a[href]');

    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href || /^(https?:|mailto:|#)/i.test(href)) continue;
      if (filename(href) === here) {
        links[i].classList.add('current');
        links[i].setAttribute('aria-current', 'page');
      }
    }
  });
})();
