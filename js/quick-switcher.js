/**
 * quick-switcher.js — Ctrl+O (or Cmd+O) file quick switcher
 *
 * Uses `searchData` from search.js as a live ES module binding — it reads
 * null until the fetch in search.js completes, then sees the populated array.
 */

import { $, $$, on, escHtml } from './helpers.js';
import { navGoTo } from './nav.js';
import { searchData } from './search.js';

var qsBackdrop  = $('#quick-switcher');
var qsInput     = $('#qs-input');
var qsResultsEl = $('#qs-results');
var qsClearBtn  = $('#qs-clear');
var qsActiveIdx = -1;

function qsFormatPath(fullPath, query) {
  if (!query) return escHtml(fullPath);
  var lo = fullPath.toLowerCase();
  var qi = lo.indexOf(query.toLowerCase());
  if (qi === -1) return escHtml(fullPath);
  var qe = qi + query.length;
  return escHtml(fullPath.slice(0, qi)) +
    '<strong>' + escHtml(fullPath.slice(qi, qe)) + '</strong>' +
    escHtml(fullPath.slice(qe));
}

function qsRender(query) {
  if (!searchData) { qsResultsEl.innerHTML = ''; return; }
  var q = query.trim();
  var results = q
    ? searchData.filter(function (p) {
        return p.url.replace(/^\/|\/$/g, '').toLowerCase().indexOf(q.toLowerCase()) !== -1;
      })
    : searchData.slice();
  results = results.slice(0, 20);
  qsActiveIdx = results.length ? 0 : -1;
  qsResultsEl.innerHTML = results.map(function (p, i) {
    var full = p.url.replace(/^\/|\/$/g, '');
    return '<li class="qs-item' + (i === 0 ? ' qs-selected' : '') + '"' +
      ' role="option" data-url="' + escHtml(p.url) + '" data-idx="' + i + '">' +
      qsFormatPath(full, q) + '</li>';
  }).join('');
}

function qsOpen() {
  if (!qsBackdrop) return;
  qsBackdrop.classList.add('qs-open');
  qsInput.value = '';
  qsRender('');
  qsInput.focus();
}

function qsClose() {
  if (!qsBackdrop) return;
  qsBackdrop.classList.remove('qs-open');
  qsActiveIdx = -1;
}

function qsMove(dir) {
  var items = $$('.qs-item', qsResultsEl);
  if (!items.length) return;
  if (qsActiveIdx >= 0) items[qsActiveIdx].classList.remove('qs-selected');
  qsActiveIdx = (qsActiveIdx + dir + items.length) % items.length;
  items[qsActiveIdx].classList.add('qs-selected');
  items[qsActiveIdx].scrollIntoView({ block: 'nearest' });
}

function qsNavigateTo(newTab) {
  var items = $$('.qs-item', qsResultsEl);
  var item  = qsActiveIdx >= 0 ? items[qsActiveIdx] : null;
  if (!item) return;
  var url = item.dataset.url;
  if (newTab) { window.open(url, '_blank', 'noopener'); } else { navGoTo(url); }
  qsClose();
}

on($('#activity-quick-switcher'), 'click', qsOpen);
on(qsInput, 'input', function () { qsRender(this.value); });
on(qsClearBtn, 'click', qsClose);

on(qsInput, 'keydown', function (e) {
  if      (e.key === 'ArrowDown') { e.preventDefault(); qsMove(1); }
  else if (e.key === 'ArrowUp')   { e.preventDefault(); qsMove(-1); }
  else if (e.key === 'Enter')     { e.preventDefault(); qsNavigateTo(e.ctrlKey); }
  else if (e.key === 'Escape')    { qsClose(); }
});

on(qsResultsEl, 'mousemove', function (e) {
  var item = e.target.closest('.qs-item');
  if (!item) return;
  var idx = parseInt(item.dataset.idx, 10);
  if (idx === qsActiveIdx) return;
  $$('.qs-item', qsResultsEl).forEach(function (el) { el.classList.remove('qs-selected'); });
  item.classList.add('qs-selected');
  qsActiveIdx = idx;
});

on(qsResultsEl, 'click', function (e) {
  var item = e.target.closest('.qs-item');
  if (!item) return;
  navGoTo(item.dataset.url);
  qsClose();
});

on(qsBackdrop, 'click', function (e) {
  if (e.target === qsBackdrop) qsClose();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && qsBackdrop && qsBackdrop.classList.contains('qs-open')) qsClose();
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'o') { e.preventDefault(); qsOpen(); }
});
