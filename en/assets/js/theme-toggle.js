/* ============================================================
   theme-toggle.js · Dark / light mode toggle
   - Theme is written to <html data-theme="dark|light"> and persisted to localStorage
   - Anti-flash on first paint: an inline script in index.html <head> sets the theme early
   - Toggle button is inside the navbar (injected async), bound via 'partials:loaded' event
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'xzc-theme';

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function paint(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function bind() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore in private mode */ }
        paint(next);
      });
    });
    paint(current());
  }

  if (document.querySelector('[data-theme-toggle]')) bind();
  document.addEventListener('partials:loaded', bind);
})();
