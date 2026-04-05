/**
 * dropdowns.js — shared dropdown helpers + global outside-click close
 */

import { $$ } from './helpers.js';

export function closeDropdown(menu, btn) {
  if (!menu) return;
  menu.hidden = true;
  if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('active'); }
}

export function toggleDropdown(menu, btn) {
  if (!menu) return;
  var opening = menu.hidden;
  menu.hidden = !opening;
  if (btn) { btn.setAttribute('aria-expanded', String(opening)); btn.classList.toggle('active', opening); }
}

/* Close any open dropdown on outside click */
document.addEventListener('click', function () {
  $$('.dropdown').forEach(function (menu) {
    if (!menu.hidden) {
      var wrap = menu.closest('.dropdown-wrap');
      var btn  = wrap && wrap.querySelector('[aria-expanded]');
      closeDropdown(menu, btn);
    }
  });
});
