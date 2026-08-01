/* ============================================================
   article-page.js · Shared logic for article-type pages
   Used on: about.html / guide detail pages / future knowledge base article pages
   Features: auto TOC (scans h2/h3 inside #article-body) + scrollspy highlight
        + top reading progress bar (forces last-item highlight at bottom) + scroll reveal
   ============================================================ */
(function () {
  'use strict';

  var body = document.getElementById('article-body');
  if (!body) return;
  var heads = body.querySelectorAll('h2, h3');

  /* ---- Auto-generate table of contents ---- */
  var tocList = document.getElementById('toc-list');
  var tocLinks = [];
  if (tocList && heads.length) {
    tocList.innerHTML = Array.prototype.map.call(heads, function (h) {
      return '<li><a class="toc-' + h.tagName.toLowerCase() + '" href="#' + h.id + '">' +
        h.textContent + '</a></li>';
    }).join('');
    tocLinks = Array.prototype.slice.call(tocList.querySelectorAll('a'));
  }

  /* ---- TOC scroll highlight (scrollspy) ---- */
  if ('IntersectionObserver' in window && tocLinks.length) {
    var linkMap = {};
    tocLinks.forEach(function (a) {
      linkMap[a.getAttribute('href').slice(1)] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('active'); });
          var hit = linkMap[en.target.id];
          if (hit) hit.classList.add('active');
        }
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    heads.forEach(function (h) { spy.observe(h); });
  }

  /* ---- Top reading progress bar ---- */
  var bar = document.getElementById('read-progress');
  function paintProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
    /* Force-highlight last TOC item when reaching the bottom */
    if (max > 0 && doc.scrollTop >= max - 2 && tocLinks.length) {
      tocLinks.forEach(function (a) { a.classList.remove('active'); });
      tocLinks[tocLinks.length - 1].classList.add('active');
    }
  }
  window.addEventListener('scroll', paintProgress, { passive: true });
  window.addEventListener('resize', paintProgress);
  paintProgress();

  /* ---- Scroll reveal ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();
