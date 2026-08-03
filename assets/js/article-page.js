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
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.01 });
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- 代码块复制按钮 ---- */
  body.querySelectorAll('pre').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.className = 'code-copy';
    btn.type = 'button';
    btn.textContent = '复制';
    btn.addEventListener('click', function () {
      var text = pre.querySelector('code') ? pre.querySelector('code').textContent : pre.textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
      function done() {
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('copied');
        }, 1600);
      }
    });
    pre.appendChild(btn);
  });

  /* ---- Giscus 评论区（GitHub Discussions 驱动） ----
     配置方法：仓库安装 giscus app 后，到 https://giscus.app 填入仓库名并
     选择分类，把生成脚本里的 data-category-id（及 category 名）填到下面。
     categoryId 留空时不渲染评论区。 */
  var GISCUS = {
    repo: 'zymyshadow/zymyshadow.github.io',
    repoId: 'MDEwOlJlcG9zaXRvcnkxODk3MDE1MDk=',
    category: 'Announcements',
    categoryId: 'DIC_kwDOC06dhc4DClM7'
  };

  (function initComments() {
    if (!GISCUS.categoryId) return;
    var layout = document.querySelector('.article-layout');
    if (!layout || !layout.parentNode) return;

    var sec = document.createElement('section');
    sec.className = 'section comments-section';
    sec.innerHTML =
      '<div class="section-head"><h2 class="section-title">评论</h2>' +
      '<span class="section-note mono">GISCUS · GITHUB DISCUSSIONS · 需 GitHub 账号留言</span></div>' +
      '<div class="giscus-box"></div>';
    layout.parentNode.insertBefore(sec, layout.nextSibling);

    var theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    /* 自定义主题：指向本站托管的配色文件，与站点明暗同步切换 */
    var themeUrl = function (t) {
      return 'https://zymyshadow.github.io/assets/css/giscus-' + t + '.css';
    };
    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-repo', GISCUS.repo);
    s.setAttribute('data-repo-id', GISCUS.repoId);
    s.setAttribute('data-category', GISCUS.category);
    s.setAttribute('data-category-id', GISCUS.categoryId);
    s.setAttribute('data-mapping', 'pathname');
    s.setAttribute('data-strict', '0');
    s.setAttribute('data-reactions-enabled', '1');
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', 'bottom');
    s.setAttribute('data-theme', themeUrl(theme));
    s.setAttribute('data-lang', 'zh-CN');
    s.setAttribute('data-loading', 'lazy');
    sec.querySelector('.giscus-box').appendChild(s);

    /* 明暗主题切换时，通知 giscus iframe 同步换肤 */
    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        var frame = document.querySelector('iframe.giscus-frame');
        if (frame && frame.contentWindow) {
          frame.contentWindow.postMessage({ giscus: { setConfig: { theme: themeUrl(t) } } }, 'https://giscus.app');
        }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  })();
})();
