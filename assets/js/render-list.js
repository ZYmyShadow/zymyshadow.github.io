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

  function renderNews(host, data) {
    if (!host || !data || !Array.isArray(data.categories)) return;

    var updatedEl = document.getElementById('news-updated');
    if (updatedEl && data.updated_at) updatedEl.textContent = data.updated_at;

    var tabs = '<div class="tabs" role="tablist">';
    var panels = '';
    data.categories.forEach(function (cat, ci) {
      var items = cat.items || [];
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

  /* ---------- 游戏专区卡片 ---------- */

  function renderGames(host, games) {
    if (!host || !Array.isArray(games)) return;
    host.innerHTML = games.map(function (g, i) {
      return '<a class="game-card accent-' + esc(g.accent || 'jade') + '" data-num="' + esc(g.code || String(i + 1)) + '" href="' + esc(g.url) + '">' +
        '<span class="game-status">' + esc(g.status || '筹备中') + '</span>' +
        '<h3 class="game-name">' + esc(g.name) + '</h3>' +
        '<p class="game-desc">' + esc(g.desc) + '</p>' +
        '<span class="game-enter">进入专区 <span class="arr">→</span></span>' +
      '</a>';
    }).join('');
  }

  window.RL = {
    esc: esc,
    renderNews: renderNews,
    renderSeries: renderSeries,
    renderGames: renderGames
  };
})();
