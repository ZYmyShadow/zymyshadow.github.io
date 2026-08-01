/* ============================================================
   components.js · 公共组件注入
   1. fetch partials/navbar.html、footer.html 注入占位容器
   2. file:// 双击打开时 fetch 会被同源策略拦截，
      自动降级为内置兜底导航（仅保证基本可用，正式以 partials 为准）
   3. 读取 /data/articles.json，动态生成「文章系列」下拉菜单
   4. 高亮当前导航项 / 移动端汉堡菜单 / 下拉折叠
   5. 全部完成后派发 'partials:loaded' 事件，供 theme-toggle.js 等绑定
   ============================================================ */
(function () {
  'use strict';

  /* ---- 站点根目录自动推算 ----
     通过本脚本自身的 src 反推站点根（去掉 assets/js/components.js 后缀）。
     这样无论页面在根目录还是子目录（如 articles/series-tech/xxx.html），
     也无论 http 还是 file:// 环境，fetch 路径都能正确定位。 */
  var BASE = '';
  if (document.currentScript && document.currentScript.src) {
    BASE = document.currentScript.src.replace(/assets\/js\/components\.js.*$/, '');
  }

  /* ---- file:// 环境兜底内容（精简版，链接用相对路径） ---- */
  var NAV_FALLBACK =
    '<header class="site-nav"><div class="nav-inner">' +
    '<a class="brand" href="index.html"><span class="seal">藏</span><span class="brand-name">修仙藏书阁</span></a>' +
    '<nav class="nav-menu"><ul class="nav-list">' +
    '<li><a class="nav-link" href="index.html">首页</a></li>' +
    '<li><a class="nav-link" href="articles/index.html">文章系列</a></li>' +
    '<li><a class="nav-link" href="games/index.html">游戏攻略</a></li>' +
    '<li><a class="nav-link" href="tools/index.html">工具合集</a></li>' +
    '<li><a class="nav-link" href="nav.html">导航站</a></li>' +
    '<li><a class="nav-link" href="about.html">关于宗主</a></li>' +
    '<li class="nav-theme"><button class="lang-btn" data-lang-toggle type="button"><span>EN</span></button></li>' +
    '</ul></nav></div></header>';

  var FOOTER_FALLBACK =
    '<footer class="site-footer"><div class="footer-inner">' +
    '<div class="footer-bottom"><span>© 2026 修仙藏书阁</span>' +
    '<span class="mono">POWERED BY GITHUB PAGES</span></div>' +
    '</div></footer>';

  /* ---- 注入单个组件 ---- */
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

  /* ---- 动态生成「文章系列」下拉菜单（含篇数） ---- */
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
        var html = '<li><a href="/articles/index.html">全部文章<span class="sub-count">' +
          (list ? list.length : 0) + '</span></a></li>';
        Object.keys(counts).forEach(function (s) {
          html += '<li><a href="/articles/index.html?series=' +
            encodeURIComponent(s) + '">' + s + '<span class="sub-count">' +
            counts[s] + '</span></a></li>';
        });
        menu.innerHTML = html;
      })
      .catch(function () {
        menu.innerHTML = '<li><a href="/articles/index.html">全部文章</a></li>';
      });
  }

  /* ---- 动态生成「游戏攻略」下拉菜单（从 games.json 读取） ---- */
  function buildGamesMenu() {
    var menu = document.getElementById('games-menu');
    if (!menu) return Promise.resolve();
    return fetch(BASE + 'data/games.json')
      .then(function (res) { return res.json(); })
      .then(function (list) {
        var html = '<li><a href="/games/index.html">全部攻略<span class="sub-count">' +
          (list ? list.length : 0) + '</span></a></li>';
        (list || []).forEach(function (g) {
          html += '<li><a href="' + (g.url || '/games/' + g.id + '/index.html') + '">' +
            g.name + '<span class="sub-count">' + (g.status || '') + '</span></a></li>';
        });
        menu.innerHTML = html;
      })
      .catch(function () {
        menu.innerHTML = '<li><a href="/games/index.html">全部攻略</a></li>';
      });
  }

  /* ---- 高亮当前页面对应的导航项 ---- */
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

  /* ---- 汉堡菜单 & 移动端下拉折叠 ---- */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      });
    }

    /* 移动端：点击父级菜单展开/收起子菜单；桌面端：直接跳转 */
    document.querySelectorAll('.has-sub > a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (window.matchMedia('(max-width: 900px)').matches) {
          e.preventDefault();
          a.parentElement.classList.toggle('open');
        }
      });
    });

    /* 点击叶子链接后自动收起移动端菜单 */
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('.nav-menu a');
      if (link && !link.parentElement.classList.contains('has-sub')) {
        document.body.classList.remove('nav-open');
      }
    });

    /* ---- 中英文切换 ---- */
    var langBtn = document.querySelector('[data-lang-toggle]');
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        var isEN = /\/en\/?$/.test(BASE);
        var href = location.href;
        var target;

        if (BASE) {
          /* 正常情况：BASE 已推算 */
          if (isEN) {
            /* 英文 → 中文：去掉 /en */
            var baseWithoutEn = BASE.replace(/en\/?$/, '');
            target = baseWithoutEn + href.substring(BASE.length);
          } else {
            /* 中文 → 英文：插入 /en */
            target = BASE + 'en/' + href.substring(BASE.length);
          }
        } else {
          /* file:// 兜底：用 pathname 推算 */
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

  /* ---- 启动 ---- */
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
