/* ============================================================
   article-page.js · 文章类页面公共逻辑
   用于：about.html / 攻略详情页 / 后续知识库文章页
   功能：自动目录（扫描 #article-body 内 h2/h3）+ 目录滚动高亮
        + 顶部阅读进度条（触底强制高亮末项）+ 滚动浮现
   ============================================================ */
(function () {
  'use strict';

  var body = document.getElementById('article-body');
  if (!body) return;
  var heads = body.querySelectorAll('h2, h3');

  /* ---- 自动生成目录 ---- */
  var tocList = document.getElementById('toc-list');
  var tocLinks = [];
  if (tocList && heads.length) {
    tocList.innerHTML = Array.prototype.map.call(heads, function (h) {
      return '<li><a class="toc-' + h.tagName.toLowerCase() + '" href="#' + h.id + '">' +
        h.textContent + '</a></li>';
    }).join('');
    tocLinks = Array.prototype.slice.call(tocList.querySelectorAll('a'));
  }

  /* ---- 目录滚动高亮（scrollspy） ---- */
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

  /* ---- 顶部阅读进度条 ---- */
  var bar = document.getElementById('read-progress');
  function paintProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
    /* 触底时强制高亮目录最后一项 */
    if (max > 0 && doc.scrollTop >= max - 2 && tocLinks.length) {
      tocLinks.forEach(function (a) { a.classList.remove('active'); });
      tocLinks[tocLinks.length - 1].classList.add('active');
    }
  }
  window.addEventListener('scroll', paintProgress, { passive: true });
  window.addEventListener('resize', paintProgress);
  paintProgress();

  /* ---- 滚动浮现 ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          console.log(en.target)
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
