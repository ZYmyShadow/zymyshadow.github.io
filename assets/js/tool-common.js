/* ============================================================
   tool-common.js · 工具页公共脚本
   提供：HTML 转义、复制到剪贴板（带按钮反馈）、滚动浮现
   挂载在 window.TC 上，供 /tools/*.html 各工具页复用
   ============================================================ */
(function () {
  'use strict';

  /* HTML 转义，防止用户输入破坏结构或引发注入 */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 兜底复制（旧浏览器 / 非安全上下文） */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /*
   * 复制文本到剪贴板
   * @param text   要复制的文本
   * @param btn    触发复制的按钮（可选），复制后显示"已复制"反馈
   */
  function copy(text, btn) {
    var done = function () {
      if (!btn) return;
      var orig = btn.getAttribute('data-orig');
      if (orig === null) {
        orig = btn.textContent;
        btn.setAttribute('data-orig', orig);
      }
      btn.textContent = '已复制 ✓';
      btn.classList.add('is-copied');
      setTimeout(function () {
        btn.textContent = orig;
        btn.classList.remove('is-copied');
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  /* 滚动浮现（与全站 .reveal 行为一致） */
  function reveal() {
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
    }, { threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reveal);
  } else {
    reveal();
  }

  window.TC = { esc: esc, copy: copy, reveal: reveal };
})();
