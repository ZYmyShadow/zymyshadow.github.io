/* ============================================================
   theme-toggle.js · 深色 / 浅色模式切换
   - 主题写入 <html data-theme="dark|light">，并持久化到 localStorage
   - 首屏防闪烁：index.html <head> 里有一段内联脚本提前设置主题
   - 切换按钮在导航栏内（异步注入），通过 'partials:loaded' 事件绑定
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'xzc-theme';

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function paint(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
    });
  }

  function bind() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* 隐私模式下忽略 */ }
        paint(next);
      });
    });
    paint(current());
  }

  if (document.querySelector('[data-theme-toggle]')) bind();
  document.addEventListener('partials:loaded', bind);
})();
