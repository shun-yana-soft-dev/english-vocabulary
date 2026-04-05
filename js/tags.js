/**
 * tags.js — tags panel: search toggle, filter input, sort dropdown
 *
 * Only active on pages that render the tags panel.
 */

import { $, $$, on } from './helpers.js';
import { closeDropdown, toggleDropdown } from './dropdowns.js';

on($('#tags-search-toggle'), 'click', function () {
  var bar   = $('#tags-search-bar');
  var input = $('#tags-filter-input');
  var open  = bar.hidden;
  bar.hidden = !open;
  this.classList.toggle('active', open);
  this.setAttribute('aria-pressed', String(open));
  if (open) {
    if (input) input.focus();
  } else {
    if (input) { input.value = ''; input.dispatchEvent(new Event('input')); }
  }
});

var tagsSortBtn      = $('#tags-sort-btn');
var tagsSortDropdown = $('#tags-sort-dropdown');

function applyTagsSort(mode) {
  var list = $('#tags-list');
  if (!list) return;
  var items = $$('.tags-list-item', list);
  items.sort(function (a, b) {
    var na = a.querySelector('.tags-list-name').textContent;
    var nb = b.querySelector('.tags-list-name').textContent;
    var ca = parseInt(a.querySelector('.tags-list-count').textContent, 10);
    var cb = parseInt(b.querySelector('.tags-list-count').textContent, 10);
    if (mode === 'name-asc')  return na.localeCompare(nb);
    if (mode === 'name-desc') return nb.localeCompare(na);
    if (mode === 'freq-asc')  return ca - cb;
    return cb - ca; /* freq-desc */
  });
  items.forEach(function (item) { list.appendChild(item); });
}

on(tagsSortBtn, 'click', function (e) {
  e.stopPropagation();
  toggleDropdown(tagsSortDropdown, tagsSortBtn);
});

on(tagsSortDropdown, 'click', function (e) {
  var opt = e.target.closest('.dropdown-item');
  if (!opt) return;
  $$('.dropdown-item', tagsSortDropdown).forEach(function (o) { o.classList.remove('active'); });
  opt.classList.add('active');
  applyTagsSort(opt.dataset.sort);
  closeDropdown(tagsSortDropdown, tagsSortBtn);
});

on($('#tags-filter-input'), 'input', function () {
  var q = this.value.toLowerCase();
  $$('.tags-list-item').forEach(function (item) {
    var name = item.querySelector('.tags-list-name').textContent.toLowerCase();
    item.style.display = name.includes(q) ? '' : 'none';
  });
});
