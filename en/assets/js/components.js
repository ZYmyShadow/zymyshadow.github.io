/* ============================================================
   components.js · Shared component injection
   1. Fetch partials/navbar.html, footer.html and inject into placeholder containers
   2. When opened via file:// (double-click), fetch is blocked by same-origin policy;
      automatically falls back to a built-in fallback nav (basic usability only;
      full partials take precedence in production)
   3. Read /data/articles.json and dynamically build the "Articles" dropdown menu
   4. Highlight the current nav item / mobile hamburger menu / dropdown folding
   5. Dispatch 'partials:loaded' event when done, for theme-toggle.js etc. to bind
   ============================================================ */
(function () {
  'use strict';

  /* ---- Auto-detect site root ----
     Derive the site root from this script's own src (strip the assets/js/components.js suffix).
     This way, whether the page is at the root or in a subdirectory (e.g. articles/series-tech/xxx.html),
     and whether under http or file://, the fetch paths resolve correctly. */
  var BASE = '';
  if (document.currentScript && document.currentScript.src) {
    BASE = document.currentScript.src.replace(/assets\/js\/components\.js.*$/, '');
  }

  /* ---- Fallback content for file:// environment (simplified, relative links) ---- */
  var NAV_FALLBACK =
    '<header class="site-nav"><div class="nav-inner">' +
    '<a class="brand" href="index.html"><span class="seal">藏</span><span class="brand-name">The Cultivation Library</span></a>' +
    '<nav class="nav-menu"><ul class="nav-list">' +
    '<li><a class="nav-link" href="index.html">Home</a></li>' +
    '<li><a class="nav-link" href="articles/index.html">Articles</a></li>' +
    '<li><a class="nav-link" href="games/index.html">Game Guides</a></li>' +
    '<li><a class="nav-link" href="nav.html">Directory</a></li>' +
    '<li><a class="nav-link" href="about.html">About</a></li>' +
    '<li class="nav-theme"><button class="lang-btn" data-lang-toggle type="button"><span>中文</span></button></li>' +
    '</ul></nav></div></header>';

  var FOOTER_FALLBACK =
    '<footer class="site-footer"><div class="footer-inner">' +
    '<div class="footer-bottom"><span>© 2026 The Cultivation Library</span>' +
    '<span class="mono">POWERED BY GITHUB PAGES</span></div>' +
    '</div></footer>';

  /* ---- Inject a single component ---- */
  function inject(selector, url, fallback) {
    var host = document.querySelector(selector);
    if (!host) return Promise.resolve();
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        host.innerHTML = html;
      })
      .catch(function () {
        host.innerHTML = fallback;
        host.classList.add('using-fallback');
      });
  }

  /* ---- Build the "Articles" dropdown menu dynamically (with post count) ---- */
  function buildSeriesMenu() {
    var menu = document.getElementById('series-menu');
    if (!menu) return Promise.resolve();
    return fetch(BASE + 'data/articles.json')
      .then(function (res) { return res.json(); })
      .then(function (list) {
        var counts = {};
        (list || []).forEach(function (a) {
          if (a.series) counts[a.series] = (counts[a.series] || 0) + 1;
        });
        var html = '<li><a href="/en/articles/index.html">All Articles<span class="sub-count">' +
          (list ? list.length : 0) + '</span></a></li>';
        Object.keys(counts).forEach(function (s) {
          html += '<li><a href="/en/articles/index.html?series=' +
            encodeURIComponent(s) + '">' + s + '<span class="sub-count">' +
            counts[s] + '</span></a></li>';
        });
        menu.innerHTML = html;
      })
      .catch(function () {
        menu.innerHTML = '<li><a href="/en/articles/index.html">All Articles</a></li>';
      });
  }

  /* ---- Build the "Game Guides" dropdown menu dynamically (from games.json) ---- */
  function buildGamesMenu() {
    var menu = document.getElementById('games-menu');
    if (!menu) return Promise.resolve();
    return fetch(BASE + 'data/games.json')
      .then(function (res) { return res.json(); })
      .then(function (list) {
        var html = '<li><a href="/en/games/index.html">All Guides<span class="sub-count">' +
          (list ? list.length : 0) + '</span></a></li>';
        (list || []).forEach(function (g) {
          html += '<li><a href="' + (g.url || '/en/games/' + g.id + '/index.html') + '">' +
            g.name + '<span class="sub-count">' + (g.status || '') + '</span></a></li>';
        });
        menu.innerHTML = html;
      })
      .catch(function () {
        menu.innerHTML = '<li><a href="/en/games/index.html">All Guides</a></li>';
      });
  }

  /* ---- Highlight the nav item matching the current page ---- */
  function markActive() {
    var norm = function (p) {
      return (p || '/').replace(/\/index\.html$/, '/');
    };
    var path = norm(location.pathname);
    document.querySelectorAll('.nav-list > li > a.nav-link').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('javascript:') === 0) return;
      if (norm(new URL(href, location.href).pathname) === path) {
        a.classList.add('active');
      }
    });
  }

  /* ---- Hamburger menu & mobile dropdown folding ---- */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
    }

    /* Mobile: click parent menu to expand/collapse submenu; Desktop: navigate directly */
    document.querySelectorAll('.has-sub > a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.matchMedia('(max-width: 900px)').matches) {
          e.preventDefault();
          a.parentElement.classList.toggle('open');
        }
      });
    });

    /* Collapse mobile menu after clicking a leaf link */
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('.nav-menu a');
      if (link && !link.parentElement.classList.contains('has-sub')) {
        document.body.classList.remove('nav-open');
      }
    });

    /* ---- Language toggle (EN ↔ CN) ---- */
    var langBtn = document.querySelector('[data-lang-toggle]');
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        var isEN = /\/en\/?$/.test(BASE);
        var href = location.href;
        var target;

        if (BASE) {
          /* Normal case: BASE is detected */
          if (isEN) {
            /* English → Chinese: strip /en */
            var baseWithoutEn = BASE.replace(/en\/?$/, '');
            target = baseWithoutEn + href.substring(BASE.length);
          } else {
            /* Chinese → English: insert /en */
            target = BASE + 'en/' + href.substring(BASE.length);
          }
        } else {
          /* file:// fallback: use pathname */
          var path = location.pathname;
          var search = location.search;
          var hash = location.hash;
          if (path.indexOf('/en/') === 0 || path === '/en' || path === '/en/') {
            target = path.replace(/^\/en/, '') || '/';
          } else {
            target = '/en' + (path === '/' ? '/' : path);
          }
          target += search + hash;
        }

        location.href = target;
      });
    }
  }

  /* ---- Boot ---- */
  Promise.all([
    inject('#navbar', BASE + 'partials/navbar.html', NAV_FALLBACK),
    inject('#footer', BASE + 'partials/footer.html', FOOTER_FALLBACK)
  ])
    .then(function () {
      return Promise.all([buildSeriesMenu(), buildGamesMenu()]);
    })
    .then(function () {
      markActive();
      initNav();
      document.dispatchEvent(new CustomEvent('partials:loaded'));
    });
})();
