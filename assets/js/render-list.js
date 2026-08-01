/* ============================================================
   render-list.js · 通用列表渲染函数
   首页 / 新闻页 / 文章页 / 游戏页共用，只是传入不同 JSON。
   挂载在 window.RL 上：
     RL.renderNews(host, data)       热点情报（Tab + 卡片流）
     RL.renderSeries(host, articles) 文章系列（按 series 分组）
     RL.renderGames(host, games)     游戏专区卡片
   ============================================================ */
(function () {
  'use strict';

  /* HTML 转义，防止数据里的特殊字符破坏结构 */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 热点情报 ---------- */

  function newsItemHTML(item, i) {
    var rank = String(i + 1).padStart(2, '0');
    var body =
      '<span class="news-rank">' + rank + '</span>' +
      '<h3 class="news-title">' + esc(item.title) + '<span class="news-arrow">→</span></h3>' +
      '<p class="news-summary">' + esc(item.summary) + '</p>' +
      '<div class="news-meta">' +
        (item.source ? '<span class="chip chip-source">' + esc(item.source) + '</span>' : '') +
        (item.tag ? '<span class="chip">' + esc(item.tag) + '</span>' : '') +
      '</div>';
    var href = item.url && item.url !== '#' ? item.url : '';
    return href
      ? '<a class="news-item" href="' + esc(href) + '" target="_blank" rel="noopener">' + body + '</a>'
      : '<div class="news-item">' + body + '</div>';
  }

  function renderNews(host, data, days, maxItems) {
    if (!host || !data || !Array.isArray(data.categories)) return;

    var updatedEl = document.getElementById('news-updated');
    if (updatedEl && data.updated_at) updatedEl.textContent = data.updated_at;

    /* 计算截止日期 */
    var cutoff = '';
    if (days && days > 0 && data.updated_at) {
      var d = new Date(data.updated_at);
      d.setDate(d.getDate() - days);
      cutoff = d.toISOString().slice(0, 10);
    }

    var tabs = '<div class="tabs" role="tablist">';
    var panels = '';
    data.categories.forEach(function (cat, ci) {
      var items = cat.items || [];
      /* 按日期过滤 */
      if (cutoff) {
        items = items.filter(function (item) {
          return !item.date || item.date >= cutoff;
        });
      }
      /* 首页限制每分类最多显示条数 */
      if (maxItems && maxItems > 0) {
        items = items.slice(0, maxItems);
      }
      tabs +=
        '<button class="tab' + (ci === 0 ? ' active' : '') + '" type="button" role="tab" data-tab="' + ci + '">' +
          esc(cat.name) + '<span class="tab-count">' + items.length + '</span>' +
        '</button>';
      panels +=
        '<div class="tab-panel' + (ci === 0 ? ' active' : '') + '" data-panel="' + ci + '">' +
          (items.map(newsItemHTML).join('') || '<p class="empty-tip">该分类暂无内容，等待阁主更新…</p>') +
        '</div>';
    });
    tabs += '</div>';
    host.innerHTML = tabs + panels;

    host.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        host.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
        host.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        host.querySelector('[data-panel="' + btn.dataset.tab + '"]').classList.add('active');
      });
    });
  }

  /* 首页专用：只显示最近 2 天、每分类最多 3 条 */
  function renderNewsRecent(host, data) {
    renderNews(host, data, 2, 3);
  }

  /* ---------- 文章系列（按 series 分组） ---------- */

  function renderSeries(host, articles) {
    if (!host || !Array.isArray(articles)) return;

    var groups = [];
    var map = {};
    articles.forEach(function (a) {
      if (!map[a.series]) {
        map[a.series] = [];
        groups.push({ name: a.series, list: map[a.series] });
      }
      map[a.series].push(a);
    });

    host.innerHTML = groups.map(function (g) {
      g.list.sort(function (x, y) { return (y.date || '').localeCompare(x.date || ''); });
      var rows = g.list.map(function (a) {
        return '<li><a class="article-row" href="' + esc(a.url) + '">' +
          '<time class="mono">' + esc(a.date) + '</time>' +
          '<span class="article-title">' + esc(a.title) + '</span>' +
          '<span class="article-tags">' +
            (a.tags || []).map(function (t) { return '<i>' + esc(t) + '</i>'; }).join('') +
          '</span>' +
        '</a></li>';
      }).join('');

      return '<section class="series-panel">' +
        '<header class="series-head">' +
          '<h3 class="series-name">' + esc(g.name) + '</h3>' +
          '<span class="chip">' + g.list.length + ' 篇</span>' +
          '<a class="series-more" href="/articles/index.html?series=' + encodeURIComponent(g.name) + '">查看全部 →</a>' +
        '</header>' +
        '<ul class="series-list">' + rows + '</ul>' +
      '</section>';
    }).join('');
  }

  /* ---------- 置顶攻略列表（首页游戏卡片 / 攻略总入口共用） ---------- */

  function pinnedListHTML(items, wide) {
    if (!items || !items.length) {
      return '<p class="pinned-empty">暂无置顶攻略，待阁主开坑…</p>';
    }
    return '<ul class="game-pinned' + (wide ? ' pinned-wide' : '') + '">' + items.map(function (g) {
      var cat = '<span class="gp-cat">' + esc(g.category || '攻略') + '</span>';
      var title = '<span class="gp-title">' + esc(g.title) + '</span>';
      if (g.url && g.url !== '#') {
        return '<li><a class="gp-link" href="' + esc(g.url) + '">' + cat + title + '<span class="arr">→</span></a></li>';
      }
      return '<li class="is-pending">' + cat + title + '<span class="gp-tag">待更新</span></li>';
    }).join('') + '</ul>';
  }

  /* ---------- 游戏专区卡片（首页，带置顶攻略入口） ---------- */

  function renderGames(host, games, pinnedByGame) {
    if (!host || !Array.isArray(games)) return;
    host.innerHTML = games.map(function (g, i) {
      var pinned = pinnedByGame && pinnedByGame[g.id] ? pinnedByGame[g.id] : [];
      return '<div class="game-card accent-' + esc(g.accent || 'jade') + '" data-num="' + esc(g.code || String(i + 1)) + '">' +
        '<a class="game-card-main" href="' + esc(g.url) + '">' +
          '<span class="game-status">' + esc(g.status || '筹备中') + '</span>' +
          '<h3 class="game-name">' + esc(g.name) + '</h3>' +
          '<p class="game-desc">' + esc(g.desc) + '</p>' +
          '<span class="game-enter">进入专区 <span class="arr">→</span></span>' +
        '</a>' +
        pinnedListHTML(pinned) +
      '</div>';
    }).join('');
  }

  /* ---------- 系列入口卡片（首页） ---------- */

  function renderSeriesCards(host, articles) {
    if (!host || !Array.isArray(articles)) return;

    var META = {
      '网安系列': { code: '壹', accent: 'jade', desc: '网络安全加固、渗透测试、工具集与合规备忘录，涵盖 Linux 安全、等保流程与逆向工具。' },
      '开发系列': { code: '贰', accent: 'gold', desc: 'Springboot 框架整合、日志配置、IDE 工具整理与博客标签插件语法。' },
      '生活系列': { code: '叁', accent: 'seal', desc: '外设购买指南、食品安全科普、显示器选购与电脑维修日志。' },
      'AI系列': { code: '肆', accent: 'gold', desc: '大语言模型入门、Prompt Engineering、AI 绘图工具对比与本地部署实战。' }
    };
    var CODES = ['壹', '贰', '叁', '肆', '伍'];
    var ACCENTS = ['jade', 'gold', 'seal', 'jade', 'gold'];

    var groups = [];
    var map = {};
    articles.forEach(function (a) {
      if (!map[a.series]) {
        map[a.series] = [];
        groups.push({ name: a.series, list: map[a.series] });
      }
      map[a.series].push(a);
    });

    host.innerHTML = groups.map(function (g, gi) {
      g.list.sort(function (x, y) { return (y.date || '').localeCompare(x.date || ''); });
      var meta = META[g.name] || { code: CODES[gi] || String(gi + 1), accent: ACCENTS[gi] || 'jade', desc: '' };
      var latest = g.list.slice(0, 3).map(function (a) {
        var cat = (a.tags || ['文章'])[0];
        return '<li><a class="gp-link" href="' + esc(a.url) + '">' +
          '<span class="gp-cat">' + esc(cat) + '</span>' +
          '<span class="gp-title">' + esc(a.title) + '</span>' +
          '<span class="arr">→</span>' +
        '</a></li>';
      }).join('');

      return '<div class="game-card accent-' + esc(meta.accent) + '" data-num="' + esc(meta.code) + '">' +
        '<a class="game-card-main" href="/articles/series.html?name=' + encodeURIComponent(g.name) + '">' +
          '<span class="game-status">' + g.list.length + ' 篇</span>' +
          '<h3 class="game-name">' + esc(g.name) + '</h3>' +
          '<p class="game-desc">' + esc(meta.desc) + '</p>' +
          '<span class="game-enter">进入系列 <span class="arr">→</span></span>' +
        '</a>' +
        '<ul class="game-pinned">' + latest + '</ul>' +
      '</div>';
    }).join('');
  }

  /* ---------- 系列大卡片面板（articles/index.html 系列视图） ---------- */

  function renderSeriesPanels(host, articles) {
    if (!host || !Array.isArray(articles)) return;

    var META = {
      '网安系列': { code: '壹', accent: 'jade', desc: '网络安全加固、渗透测试、工具集与合规备忘录，涵盖 Linux 安全、等保流程与逆向工具。' },
      '开发系列': { code: '贰', accent: 'gold', desc: 'Springboot 框架整合、日志配置、IDE 工具整理与博客标签插件语法。' },
      '生活系列': { code: '叁', accent: 'seal', desc: '外设购买指南、食品安全科普、显示器选购与电脑维修日志。' },
      'AI系列': { code: '肆', accent: 'gold', desc: '大语言模型入门、Prompt Engineering、AI 绘图工具对比与本地部署实战。' }
    };
    var CODES = ['壹', '贰', '叁', '肆', '伍'];
    var ACCENTS = ['jade', 'gold', 'seal', 'jade', 'gold'];

    var groups = [];
    var map = {};
    articles.forEach(function (a) {
      if (!map[a.series]) {
        map[a.series] = [];
        groups.push({ name: a.series, list: map[a.series] });
      }
      map[a.series].push(a);
    });

    host.innerHTML = groups.map(function (g, gi) {
      g.list.sort(function (x, y) { return (y.date || '').localeCompare(x.date || ''); });
      var meta = META[g.name] || { code: CODES[gi] || String(gi + 1), accent: ACCENTS[gi] || 'jade', desc: '' };
      var latest = g.list.slice(0, 3).map(function (a) {
        var cat = (a.tags || ['文章'])[0];
        return '<li><a class="gp-link" href="' + esc(a.url) + '">' +
          '<span class="gp-cat">' + esc(cat) + '</span>' +
          '<span class="gp-title">' + esc(a.title) + '</span>' +
          '<span class="arr">→</span>' +
        '</a></li>';
      }).join('');

      return '<section class="game-panel reveal accent-' + esc(meta.accent) + '" data-num="' + esc(meta.code) + '">' +
        '<div class="gp-id">' +
          '<span class="game-status">' + g.list.length + ' 篇</span>' +
          '<h2 class="game-name">' + esc(g.name) + '</h2>' +
          '<p class="game-desc">' + esc(meta.desc) + '</p>' +
          '<a class="btn-enter" href="/articles/index.html?name=' + encodeURIComponent(g.name) + '">进入系列 <span class="arr">→</span></a>' +
        '</div>' +
        '<div class="gp-list">' +
          '<p class="gp-list-title mono">最新文章 · LATEST</p>' +
          (latest || '<p class="pinned-empty">暂无文章，等待阁主更新…</p>') +
        '</div>' +
      '</section>';
    }).join('');
  }

  /* ---------- 游戏总入口面板（games/index.html） ---------- */

  function renderGamePanels(host, games, pinnedByGame) {
    if (!host || !Array.isArray(games)) return;
    host.innerHTML = games.map(function (g, i) {
      var pinned = pinnedByGame && pinnedByGame[g.id] ? pinnedByGame[g.id] : [];
      return '<section class="game-panel reveal accent-' + esc(g.accent || 'jade') + '" data-num="' + esc(g.code || String(i + 1)) + '">' +
        '<div class="gp-id">' +
          '<span class="game-status">' + esc(g.status || '筹备中') + '</span>' +
          '<h2 class="game-name">' + esc(g.name) + '</h2>' +
          '<p class="game-desc">' + esc(g.desc) + '</p>' +
          '<a class="btn-enter" href="' + esc(g.url) + '">进入专区 <span class="arr">→</span></a>' +
        '</div>' +
        '<div class="gp-list">' +
          '<p class="gp-list-title mono">置顶攻略 · PINNED</p>' +
          pinnedListHTML(pinned, true) +
        '</div>' +
      '</section>';
    }).join('');
  }

  /* ---------- 攻略列表 + 分类筛选（游戏主页） ---------- */

  function renderGuideHub(host, guides) {
    if (!host || !Array.isArray(guides)) return;
    var sorted = guides.slice().sort(function (x, y) {
      return (y.date || '').localeCompare(x.date || '');
    });
    var cats = [];
    sorted.forEach(function (g) {
      if (g.category && cats.indexOf(g.category) === -1) cats.push(g.category);
    });

    /* ---- 分类面板网格（灰机wiki风格） ---- */
    var panels = '<div class="guide-panels">' + cats.map(function (c) {
      var items = sorted.filter(function (g) { return g.category === c; });
      var links = items.map(function (g) {
        var pending = !g.url || g.url === '#';
        var inner =
          '<span class="gp-icon">' + esc((g.title || '?').charAt(0)) + '</span>' +
          '<span class="gp-link-title">' + esc(g.title) + '</span>' +
          (pending ? '<span class="gp-pending">待更新</span>' : '<span class="arr">→</span>');
        return pending
          ? '<div class="gp-item is-pending">' + inner + '</div>'
          : '<a class="gp-item" href="' + esc(g.url) + '">' + inner + '</a>';
      }).join('');
      return '<section class="guide-panel">' +
        '<header class="guide-panel-head">' +
          '<h3>' + esc(c) + '</h3>' +
          '<span class="chip">' + items.length + ' 篇</span>' +
        '</header>' +
        '<div class="guide-panel-body">' + links + '</div>' +
      '</section>';
    }).join('') + '</div>';

    /* ---- 全部攻略列表（按时间排序 + 筛选） ---- */
    var listHead =
      '<div class="section-head reveal" style="margin-top:40px">' +
        '<span class="section-index mono">LIST</span>' +
        '<h2 class="section-title">全部攻略</h2>' +
        '<span class="section-note mono">按时间排序</span>' +
      '</div>';

    var chips = '<div class="filter-chips">' +
      '<button type="button" class="f-chip active" data-cat="全部">全部 <span>' + sorted.length + '</span></button>' +
      cats.map(function (c) {
        var n = sorted.filter(function (g) { return g.category === c; }).length;
        return '<button type="button" class="f-chip" data-cat="' + esc(c) + '">' + esc(c) + ' <span>' + n + '</span></button>';
      }).join('') + '</div>';

    var rows = sorted.map(function (g) {
      var pending = !g.url || g.url === '#';
      var inner = '<span class="gp-cat">' + esc(g.category || '攻略') + '</span>' +
        '<span class="guide-title">' + esc(g.title) + '</span>' +
        '<time class="mono">' + esc(g.date || '') + '</time>' +
        (pending ? '<span class="gp-tag">待更新</span>' : '<span class="arr">→</span>');
      return '<li class="guide-row' + (pending ? ' is-pending' : '') + '" data-cat="' + esc(g.category || '') + '">' +
        (pending ? '<div>' + inner + '</div>' : '<a href="' + esc(g.url) + '">' + inner + '</a>') +
      '</li>';
    }).join('');

    host.innerHTML = panels + listHead + chips + '<ul class="guide-list">' + rows + '</ul>';

    host.querySelectorAll('.f-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        host.querySelectorAll('.f-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.dataset.cat;
        host.querySelectorAll('.guide-row').forEach(function (row) {
          row.classList.toggle('row-hidden', cat !== '全部' && row.dataset.cat !== cat);
        });
      });
    });
  }

  /* ---------- 导航站（侧栏分类 + 分区卡片网格） ---------- */

  function navCardHTML(item, accent) {
    var search = ((item.name || '') + ' ' + (item.desc || '') + ' ' + (item.tag || '')).toLowerCase();
    return '<a class="nav-card" data-accent="' + esc(accent) + '" data-search="' + esc(search) + '" href="' + esc(item.url) + '" target="_blank" rel="noopener">' +
      '<span class="nav-icon">' + esc((item.name || '?').charAt(0)) + '</span>' +
      '<div class="nav-info">' +
        '<h4>' + esc(item.name) + '<span class="nav-go">↗</span></h4>' +
        '<p>' + esc(item.desc) + '</p>' +
        (item.tag ? '<span class="chip">' + esc(item.tag) + '</span>' : '') +
      '</div>' +
    '</a>';
  }

  function renderNav(host, sideHost, data) {
    if (!host || !data || !Array.isArray(data.categories)) return;
    if (sideHost) {
      sideHost.innerHTML = data.categories.map(function (c, i) {
        return '<a class="side-cat" href="#cat-' + i + '" data-spy="cat-' + i + '">' +
          '<span class="side-dot accent-dot-' + esc(c.accent || 'jade') + '"></span>' +
          esc(c.name) + '<span class="side-count mono">' + (c.items || []).length + '</span></a>';
      }).join('');
    }
    host.innerHTML = data.categories.map(function (c, i) {
      return '<section class="nav-section reveal" id="cat-' + i + '" data-accent="' + esc(c.accent || 'jade') + '">' +
        '<header class="nav-sec-head">' +
          '<span class="nav-sec-bar"></span><h2>' + esc(c.name) + '</h2>' +
          '<span class="chip">' + (c.items || []).length + ' 站</span>' +
        '</header>' +
        '<div class="nav-grid">' +
          (c.items || []).map(function (it) { return navCardHTML(it, c.accent || 'jade'); }).join('') +
        '</div>' +
      '</section>';
    }).join('');
  }

  /* ---------- 滚动浮现（共享） ---------- */

  function initReveal() {
    var els = document.querySelectorAll('.reveal:not(.in)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  window.RL = {
    esc: esc,
    initReveal: initReveal,
    renderNews: renderNews,
    renderNewsRecent: renderNewsRecent,
    renderSeries: renderSeries,
    renderSeriesCards: renderSeriesCards,
    renderSeriesPanels: renderSeriesPanels,
    renderGames: renderGames,
    renderGamePanels: renderGamePanels,
    renderGuideHub: renderGuideHub,
    renderNav: renderNav
  };
})();
