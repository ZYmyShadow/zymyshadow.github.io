/* ============================================================
   render-list.js · Universal list rendering functions
   Shared by home / news / articles / games pages, each passing different JSON.
   Mounted on window.RL:
     RL.renderNews(host, data)       Trending news (tabs + card stream)
     RL.renderSeries(host, articles) Article series (grouped by series)
     RL.renderGames(host, games)     Game hub cards
   ============================================================ */
(function () {
  'use strict';

  /* HTML escape to prevent special characters from breaking structure */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Trending News ---------- */

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

    /* Compute cutoff date */
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
      /* Filter by date */
      if (cutoff) {
        items = items.filter(function (item) {
          return !item.date || item.date >= cutoff;
        });
      }
      /* On home page, cap items per category */
      if (maxItems && maxItems > 0) {
        items = items.slice(0, maxItems);
      }
      tabs +=
        '<button class="tab' + (ci === 0 ? ' active' : '') + '" type="button" role="tab" data-tab="' + ci + '">' +
          esc(cat.name) + '<span class="tab-count">' + items.length + '</span>' +
        '</button>';
      panels +=
        '<div class="tab-panel' + (ci === 0 ? ' active' : '') + '" data-panel="' + ci + '">' +
          (items.map(newsItemHTML).join('') || '<p class="empty-tip">No content in this category yet, stay tuned…</p>') +
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

  /* Home page only: show last 2 days, max 3 items per category */
  function renderNewsRecent(host, data) {
    renderNews(host, data, 2, 3);
  }

  /* ---------- Article series (grouped by series) ---------- */

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
          '<span class="chip">' + g.list.length + ' posts</span>' +
          '<a class="series-more" href="/en/articles/index.html?series=' + encodeURIComponent(g.name) + '">View All →</a>' +
        '</header>' +
        '<ul class="series-list">' + rows + '</ul>' +
      '</section>';
    }).join('');
  }

  /* ---------- Pinned guides list (shared by home game cards & guide hub) ---------- */

  function pinnedListHTML(items, wide) {
    if (!items || !items.length) {
      return '<p class="pinned-empty">No pinned guides yet, stay tuned…</p>';
    }
    return '<ul class="game-pinned' + (wide ? ' pinned-wide' : '') + '">' + items.map(function (g) {
      var cat = '<span class="gp-cat">' + esc(g.category || 'Guide') + '</span>';
      var title = '<span class="gp-title">' + esc(g.title) + '</span>';
      if (g.url && g.url !== '#') {
        return '<li><a class="gp-link" href="' + esc(g.url) + '">' + cat + title + '<span class="arr">→</span></a></li>';
      }
      return '<li class="is-pending">' + cat + title + '<span class="gp-tag">Pending</span></li>';
    }).join('') + '</ul>';
  }

  /* ---------- Game hub cards (home page, with pinned guide entries) ---------- */

  function renderGames(host, games, pinnedByGame) {
    if (!host || !Array.isArray(games)) return;
    host.innerHTML = games.map(function (g, i) {
      var pinned = pinnedByGame && pinnedByGame[g.id] ? pinnedByGame[g.id] : [];
      return '<div class="game-card accent-' + esc(g.accent || 'jade') + '" data-num="' + esc(g.code || String(i + 1)) + '">' +
        '<a class="game-card-main" href="' + esc(g.url) + '">' +
          '<span class="game-status">' + esc(g.status || 'Coming Soon') + '</span>' +
          '<h3 class="game-name">' + esc(g.name) + '</h3>' +
          '<p class="game-desc">' + esc(g.desc) + '</p>' +
          '<span class="game-enter">Enter Hub <span class="arr">→</span></span>' +
        '</a>' +
        pinnedListHTML(pinned) +
      '</div>';
    }).join('');
  }

  /* ---------- Series entry cards (home page) ---------- */

  function renderSeriesCards(host, articles) {
    if (!host || !Array.isArray(articles)) return;

    var META = {
      'Security Series': { code: '壹', accent: 'jade', desc: 'Network security hardening, penetration testing, toolkits, and compliance cheatsheets, covering Linux security, level protection workflows, and reverse engineering tools.' },
      'Development Series': { code: '贰', accent: 'gold', desc: 'Spring Boot framework integration, logging configuration, IDE tooling, and blog tag plugin syntax.' },
      'Lifestyle Series': { code: '叁', accent: 'seal', desc: 'Peripheral buying guides, food safety explainers, monitor recommendations, and PC repair logs.' }
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
        var cat = (a.tags || ['Article'])[0];
        return '<li><a class="gp-link" href="' + esc(a.url) + '">' +
          '<span class="gp-cat">' + esc(cat) + '</span>' +
          '<span class="gp-title">' + esc(a.title) + '</span>' +
          '<span class="arr">→</span>' +
        '</a></li>';
      }).join('');

      return '<div class="game-card accent-' + esc(meta.accent) + '" data-num="' + esc(meta.code) + '">' +
        '<a class="game-card-main" href="/en/articles/series.html?name=' + encodeURIComponent(g.name) + '">' +
          '<span class="game-status">' + g.list.length + ' posts</span>' +
          '<h3 class="game-name">' + esc(g.name) + '</h3>' +
          '<p class="game-desc">' + esc(meta.desc) + '</p>' +
          '<span class="game-enter">View Series <span class="arr">→</span></span>' +
        '</a>' +
        '<ul class="game-pinned">' + latest + '</ul>' +
      '</div>';
    }).join('');
  }

  /* ---------- Game hub panels (games/index.html) ---------- */

  function renderGamePanels(host, games, pinnedByGame) {
    if (!host || !Array.isArray(games)) return;
    host.innerHTML = games.map(function (g, i) {
      var pinned = pinnedByGame && pinnedByGame[g.id] ? pinnedByGame[g.id] : [];
      return '<section class="game-panel reveal accent-' + esc(g.accent || 'jade') + '" data-num="' + esc(g.code || String(i + 1)) + '">' +
        '<div class="gp-id">' +
          '<span class="game-status">' + esc(g.status || 'Coming Soon') + '</span>' +
          '<h2 class="game-name">' + esc(g.name) + '</h2>' +
          '<p class="game-desc">' + esc(g.desc) + '</p>' +
          '<a class="btn-enter" href="' + esc(g.url) + '">Enter Hub <span class="arr">→</span></a>' +
        '</div>' +
        '<div class="gp-list">' +
          '<p class="gp-list-title mono">PINNED GUIDES</p>' +
          pinnedListHTML(pinned, true) +
        '</div>' +
      '</section>';
    }).join('');
  }

  /* ---------- Guide list + category filter (game home page) ---------- */

  function renderGuideHub(host, guides) {
    if (!host || !Array.isArray(guides)) return;
    var sorted = guides.slice().sort(function (x, y) {
      return (y.date || '').localeCompare(x.date || '');
    });
    var cats = [];
    sorted.forEach(function (g) {
      if (g.category && cats.indexOf(g.category) === -1) cats.push(g.category);
    });

    /* ---- Category panel grid (wiki-style) ---- */
    var panels = '<div class="guide-panels">' + cats.map(function (c) {
      var items = sorted.filter(function (g) { return g.category === c; });
      var links = items.map(function (g) {
        var pending = !g.url || g.url === '#';
        var inner =
          '<span class="gp-icon">' + esc((g.title || '?').charAt(0)) + '</span>' +
          '<span class="gp-link-title">' + esc(g.title) + '</span>' +
          (pending ? '<span class="gp-pending">Pending</span>' : '<span class="arr">→</span>');
        return pending
          ? '<div class="gp-item is-pending">' + inner + '</div>'
          : '<a class="gp-item" href="' + esc(g.url) + '">' + inner + '</a>';
      }).join('');
      return '<section class="guide-panel">' +
        '<header class="guide-panel-head">' +
          '<h3>' + esc(c) + '</h3>' +
          '<span class="chip">' + items.length + ' posts</span>' +
        '</header>' +
        '<div class="guide-panel-body">' + links + '</div>' +
      '</section>';
    }).join('') + '</div>';

    /* ---- All guides list (sorted by date + filter) ---- */
    var listHead =
      '<div class="section-head reveal" style="margin-top:40px">' +
        '<span class="section-index mono">LIST</span>' +
        '<h2 class="section-title">All Guides</h2>' +
        '<span class="section-note mono">Sorted by date</span>' +
      '</div>';

    var chips = '<div class="filter-chips">' +
      '<button type="button" class="f-chip active" data-cat="All">All <span>' + sorted.length + '</span></button>' +
      cats.map(function (c) {
        var n = sorted.filter(function (g) { return g.category === c; }).length;
        return '<button type="button" class="f-chip" data-cat="' + esc(c) + '">' + esc(c) + ' <span>' + n + '</span></button>';
      }).join('') + '</div>';

    var rows = sorted.map(function (g) {
      var pending = !g.url || g.url === '#';
      var inner = '<span class="gp-cat">' + esc(g.category || 'Guide') + '</span>' +
        '<span class="guide-title">' + esc(g.title) + '</span>' +
        '<time class="mono">' + esc(g.date || '') + '</time>' +
        (pending ? '<span class="gp-tag">Pending</span>' : '<span class="arr">→</span>');
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
          row.classList.toggle('row-hidden', cat !== 'All' && row.dataset.cat !== cat);
        });
      });
    });
  }

  /* ---------- Directory (sidebar categories + section card grid) ---------- */

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
          '<span class="chip">' + (c.items || []).length + ' sites</span>' +
        '</header>' +
        '<div class="nav-grid">' +
          (c.items || []).map(function (it) { return navCardHTML(it, c.accent || 'jade'); }).join('') +
        '</div>' +
      '</section>';
    }).join('');
  }

  /* ---------- Scroll reveal (shared) ---------- */

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
    renderGames: renderGames,
    renderGamePanels: renderGamePanels,
    renderGuideHub: renderGuideHub,
    renderNav: renderNav
  };
})();
