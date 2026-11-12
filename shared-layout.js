/* ------------------------------------------------------------
   CEDT / Engineering Physics Health & Safety Resources Site
   Shared page layout - linked by EVERY page, listed FIRST among
   the shared <script> tags so this runs before search.js and
   sitesearch.js go looking for #navmenu / #siteSearchInput.

   Builds the skip-link, masthead (logo + title + red ribbon nav
   + site search box), left sidebar nav, and footer around the
   page's own <main id="main"> element. Previously this ~90 lines
   of markup was hand-copied into all 34 pages (see the now-retired
   SHARED-TOP-BLOCK.html); edit the HTML strings below once and
   every page picks it up.

   Runs as plain top-level code, not inside a DOMContentLoaded
   listener: a `defer` script only ever executes after the document
   has finished parsing, so <main id="main"> is guaranteed to exist
   already, and building the surrounding DOM here (rather than
   waiting for DOMContentLoaded) guarantees it's in place before
   search.js/sitesearch.js's own DOMContentLoaded handlers run.

   Pages without JavaScript get a <noscript> fallback (in the page
   itself) instead of this - there is no non-JS path through here.
   -------------------------------------------------------------- */
(function () {
  var MASTHEAD_HTML =
    '<a class="brand" href="https://www.mcmaster.ca/" target="_blank">' +
      '<img src="assets/images/mcmaster-logo.png" alt="McMaster University" class="logo-mcmaster" width="960" height="960">' +
    '</a>' +

    '<div id="header-row">' +
      '<div id="header-title">' +
        '<div class="site-title">Health &amp; Safety Resources Site</div>' +
        '<div class="dept-links">' +
          '<a href="https://www.eng.mcmaster.ca/centre-emerging-device-technologies-cedt/" target="_blank">CEDT</a> and ' +
          '<a href="https://www.eng.mcmaster.ca/engphys/" target="_blank">Engineering Physics</a>' +
        '</div>' +
      '</div>' +
      '<a class="cedt-link" href="https://www.eng.mcmaster.ca/centre-emerging-device-technologies-cedt/" target="_blank">' +
        '<img src="assets/images/cedt-logo.png" alt="CEDT" class="logo-cedt" width="1095" height="228">' +
      '</a>' +
    '</div>' +

    '<nav id="topnav" aria-label="Main">' +
      '<ul>' +
      '<li><a href="https://www.mcmaster.ca/" target="_blank">McMaster Home</a>' +
        '<ul>' +
          '<li><a href="https://directories.mcmaster.ca/" target="_blank">McMaster Directory</a></li>' +
          '<li><a href="https://hr.mcmaster.ca/employees/health_safety_well-being/our-safety/health-and-safety-training/" target="_blank">McMaster H&amp;S Training</a></li>' +
          '<li><a href="https://csprd.mcmaster.ca/psp/prcsprd/?cmd=login" target="_blank">Mosaic Login</a></li>' +
          '<li><a href="https://discover.mcmaster.ca/" target="_blank">About the Campus</a></li>' +
          '<li><a href="https://discover.mcmaster.ca/map/" target="_blank">Campus Map</a></li>' +
          '<li><a href="https://discover.mcmaster.ca/directions/" target="_blank">How to Get to McMaster</a></li>' +
          '<li><a href="https://secretariat.mcmaster.ca/" target="_blank">University Secretariat</a></li>' +
          '<li><a href="https://secretariat.mcmaster.ca/university-policies-procedures-guidelines/" target="_blank">Policies, Procedures, &amp; Guidelines</a></li>' +
        '</ul>' +
      '</li>' +
      '<li><a href="https://future.mcmaster.ca/programs/" target="_blank">Academics</a>' +
        '<ul>' +
          '<li><a href="https://future.mcmaster.ca/programs/" target="_blank">Departments and Programs</a></li>' +
          '<li><a href="https://gs.mcmaster.ca/" target="_blank">Graduate Studies</a></li>' +
          '<li><a href="https://directories.mcmaster.ca/faculty-staff/" target="_blank">Faculty &amp; Staff</a></li>' +
        '</ul>' +
      '</li>' +
      '<li><a href="https://library.mcmaster.ca/about/" target="_blank">Library</a>' +
        '<ul>' +
          '<li><a href="https://library.mcmaster.ca/about/" target="_blank">Library Services</a></li>' +
          '<li><a href="https://library.mcmaster.ca/" target="_blank">Omni (Online Library)</a></li>' +
          '<li><a href="https://libguides.mcmaster.ca/omni/intro" target="_blank">How to Use Omni</a></li>' +
          '<li><a href="https://library.mcmaster.ca/justask/" target="_blank">Contact Us</a></li>' +
        '</ul>' +
      '</li>' +
      '<li><a href="https://research.mcmaster.ca/" target="_blank">Research</a>' +
        '<ul>' +
          '<li><a href="https://research.mcmaster.ca/prizes-honours-research-chairs/research-chairs/" target="_blank">McMaster Research Chairs</a></li>' +
          '<li><a href="https://www.chairs-chaires.gc.ca/home-accueil-eng.aspx" target="_blank">Canada Research Chairs</a></li>' +
          '<li><a href="https://global.mcmaster.ca/about-us/" target="_blank">Office of International Affairs</a></li>' +
        '</ul>' +
      '</li>' +
      '<li><a href="https://studentaffairs.mcmaster.ca/" target="_blank">Student Resources</a>' +
        '<ul>' +
          '<li><a href="https://registrar.mcmaster.ca/services/" target="_blank">Office of the Registrar</a></li>' +
          '<li><a href="https://studentaffairs.mcmaster.ca/students/departments-services/" target="_blank">Chaplaincy</a></li>' +
          '<li><a href="https://equity.mcmaster.ca/" target="_blank">Equity &amp; Inclusion Office</a></li>' +
          '<li><a href="https://uts.mcmaster.ca/" target="_blank">Information Technology</a></li>' +
          '<li><a href="https://parking.mcmaster.ca/" target="_blank">Parking &amp; Transit</a></li>' +
          '<li><a href="https://msumcmaster.ca/" target="_blank">McMaster Students Union</a></li>' +
          '<li><a href="https://news.mcmaster.ca/events/" target="_blank">Events</a></li>' +
        '</ul>' +
      '</li>' +
      '</ul>' +

      '<div id="sitesearch" role="search">' +
        '<label for="siteSearchInput" class="visually-hidden">Search site</label>' +
        '<input type="search" id="siteSearchInput" placeholder="Search site&hellip;" autocomplete="off">' +
        '<div id="siteSearchResults"></div>' +
      '</div>' +
    '</nav>';

  var NAVMENU_HTML =
    '<div class="indexlink"><a href="index.html">HOME</a></div>' +
    '<div class="indexlink"><a href="department-policy.html">Department Policy</a></div>' +
    '<div class="indexlink"><a href="safety-program.html">Safety Program</a></div>' +

    '<div class="indexsublink">Roles</div>' +
    '<div class="indexsubsublink">' +
      '<a href="employer-responsibilities.html">Employer</a>' +
      '<a href="supervisor-responsibilities.html">Supervisor</a>' +
      '<a href="worker-responsibilities.html">Worker</a>' +
    '</div>' +

    '<div class="indexsublink">Training</div>' +
    '<div class="indexsubsublink">' +
      '<a href="mandatory-training.html">Mandatory</a>' +
      '<a href="site-specific-training.html">Site-Specific</a>' +
    '</div>' +

    '<div class="indexsublink">Documentation</div>' +
    '<div class="indexsubsublink">' +
      '<a href="lab-assessment.html">Lab Assessment</a>' +
      '<a href="SOP.html">SOPs</a>' +
      '<a href="JHA.html">JHAs</a>' +
      '<a href="hazard-reports.html">Hazard Reports</a>' +
      '<a href="inspections.html">Inspections</a>' +
      '<a href="SDSinfo.html">SDS Info</a>' +
      '<a href="incident-reports.html">Incident Reports</a>' +
    '</div>' +

    '<div class="indexlink">General Info</div>' +
    '<div class="indexsublink"><a href="lab-safety-handbook.html">Lab Safety Handbook</a></div>' +
    '<div class="indexsublink"><a href="hazard-awareness.html">Hazard Awareness</a></div>' +
    '<div class="indexsubsublink">' +
      '<a href="chemical-hazards.html">Chemical</a>' +
      '<a href="radiation-hazards.html">Radiation</a>' +
      '<a href="laser-hazards.html">Laser</a>' +
      '<a href="electrical-hazards.html">Electrical</a>' +
    '</div>' +
    '<div class="indexsublink"><a href="protective-equipment.html">Protective Equipment</a></div>' +
    '<div class="indexsublink"><a href="waste-management.html">Waste Management</a></div>' +
    '<div class="indexsublink"><a href="dial-911.html">Dialing 911</a></div>' +
    '<div class="indexsublink"><a href="first-aid.html">First Aid</a></div>' +
    '<div class="indexsublink"><a href="food-and-drink.html">Food and Drink</a></div>' +

    '<div class="indexlink"><a href="health-and-safety-committee.html">Health &amp; Safety Committee</a></div>';

  var FOOTER_HTML =
    '&copy; 2026 McMaster University &nbsp;|&nbsp; 1280 Main Street West &nbsp;|&nbsp; Hamilton, Ontario L8S 4L8 &nbsp;|&nbsp; 905-525-9140 ' +
    '&nbsp;|&nbsp; <a href="https://www.mcmaster.ca/contact" target="_blank">Contact McMaster</a> ' +
    '&nbsp;|&nbsp; <a href="https://www.mcmaster.ca/website-terms-of-use" target="_blank">Terms of Use &amp; Privacy Policy</a>';

  var main = document.getElementById('main');
  if (!main) return;   /* page is missing its content anchor - leave it alone */

  var skipLink = document.createElement('a');
  skipLink.className = 'skip-link';
  skipLink.href = '#main';
  skipLink.textContent = 'Skip to main content';

  var container = document.createElement('div');
  container.id = 'container';

  var masthead = document.createElement('header');
  masthead.id = 'masthead';
  masthead.innerHTML = MASTHEAD_HTML;

  var bodyWrap = document.createElement('div');
  bodyWrap.id = 'body-wrap';

  var navmenu = document.createElement('nav');
  navmenu.id = 'navmenu';
  navmenu.setAttribute('aria-label', 'Section');
  navmenu.innerHTML = NAVMENU_HTML;

  var footer = document.createElement('footer');
  footer.id = 'footer';
  footer.innerHTML = FOOTER_HTML;

  document.body.insertBefore(skipLink, main);
  document.body.insertBefore(container, main);
  container.appendChild(masthead);
  container.appendChild(bodyWrap);
  bodyWrap.appendChild(navmenu);
  bodyWrap.appendChild(main);   /* moves the existing <main>, doesn't clone it */
  container.appendChild(footer);

  /* Narrow screens: submenus are closed until their parent is tapped. The
     first tap opens the submenu instead of following the parent link; a
     second tap on the same label follows it. The CSS only shows .open
     submenus below 720px, so on wider screens this changes nothing. */
  var narrow = window.matchMedia('(max-width: 720px)');
  var topItems = masthead.querySelectorAll('#topnav > ul > li');
  Array.prototype.forEach.call(topItems, function (li) {
    var link = li.querySelector('a');
    if (!li.querySelector('ul') || !link) return;
    link.addEventListener('click', function (e) {
      if (!narrow.matches || li.classList.contains('open')) return;
      e.preventDefault();
      Array.prototype.forEach.call(topItems, function (o) { o.classList.remove('open'); });
      li.classList.add('open');
    });
  });
})();
