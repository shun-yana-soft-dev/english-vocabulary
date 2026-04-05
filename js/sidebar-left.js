/**
 * sidebar-left.js — left sidebar toggle, vault switcher dropdown, tab switching
 *
 * Exports openLeft/closeLeft/activateSidebarTab for use by other modules.
 * The overlay click handler (closeLeft + closeRight) lives in vaultex.js
 * because it needs both sidebars.
 */

import { $, $$, on, store, recall } from './helpers.js';

export var isMobile = function () { return window.innerWidth <= 768; };
export var isTablet = function () { return window.innerWidth <= 900; }; /* matches right-sidebar fixed breakpoint */

export var sidebarLeft   = $('#sidebar-left');
export var toggleLeftBtn = $('#toggle-left');
export var overlay       = $('#sidebar-overlay');

var tabBarSpacer = $('#tab-bar-left-spacer');
var activityBar  = $('#activity-bar');

export function openLeft() {
  if (!sidebarLeft) return;
  sidebarLeft.classList.remove('collapsed');
  if (toggleLeftBtn) toggleLeftBtn.classList.add('active');
  if (tabBarSpacer) tabBarSpacer.classList.remove('spacer-collapsed');
  if (activityBar) activityBar.classList.remove('sidebar-collapsed');
  if (isMobile()) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  store('left-open', '1');
}

export function closeLeft() {
  if (!sidebarLeft) return;
  sidebarLeft.classList.add('collapsed');
  if (toggleLeftBtn) toggleLeftBtn.classList.remove('active');
  if (tabBarSpacer) tabBarSpacer.classList.add('spacer-collapsed');
  if (activityBar) setTimeout(function () { activityBar.classList.add('sidebar-collapsed'); }, 250);
  if (isMobile()) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  store('left-open', '0');
}

on(toggleLeftBtn, 'click', function () {
  if (!sidebarLeft) return;
  if (sidebarLeft.classList.contains('collapsed')) { openLeft(); } else { closeLeft(); }
});

/* Restore sidebar state (desktop only) */
if (!isMobile()) {
  var leftState = recall('left-open');
  if (leftState === '0') {
    sidebarLeft && sidebarLeft.classList.add('collapsed');
    tabBarSpacer && tabBarSpacer.classList.add('spacer-collapsed');
    activityBar && activityBar.classList.add('sidebar-collapsed');
  } else {
    toggleLeftBtn && toggleLeftBtn.classList.add('active');
  }
} else {
  /* Always collapsed on mobile by default */
  sidebarLeft && sidebarLeft.classList.add('collapsed');
  tabBarSpacer && tabBarSpacer.classList.add('spacer-collapsed');
  activityBar && activityBar.classList.add('sidebar-collapsed');
}
document.documentElement.removeAttribute('data-vx-left');

/* ---- Vault switcher dropdown ---- */
var vaultSwitcher = $('#vault-switcher');
var vaultDropdown = $('#vault-dropdown');

on(vaultSwitcher, 'click', function (e) {
  e.stopPropagation();
  var opening = vaultDropdown.hidden;
  vaultDropdown.hidden = !opening;
  vaultSwitcher.setAttribute('aria-expanded', String(opening));
});

document.addEventListener('click', function () {
  if (vaultDropdown && !vaultDropdown.hidden) {
    vaultDropdown.hidden = true;
    if (vaultSwitcher) vaultSwitcher.setAttribute('aria-expanded', 'false');
  }
});

/* ---- Sidebar tab switching ---- */
var sidebarViewBtns    = $$('.sidebar-view-btn');
var sidebarTabContents = $$('.sidebar-tab-content');

export function activateSidebarTab(tabName) {
  sidebarViewBtns.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  sidebarTabContents.forEach(function (panel) {
    panel.classList.toggle('sidebar-tab-hidden', panel.dataset.tab !== tabName);
  });
  store('left-tab', tabName);
}

sidebarViewBtns.forEach(function (btn) {
  on(btn, 'click', function () {
    var tabName     = btn.dataset.tab;
    var isCollapsed = sidebarLeft && sidebarLeft.classList.contains('collapsed');
    var currentTab  = recall('left-tab') || 'folder';

    if (isCollapsed) {
      openLeft();
    }
    activateSidebarTab(tabName);

    if (tabName === 'search') {
      var si = $('#search-input');
      if (si) setTimeout(function () { si.focus(); }, 50);
    }
  });
});

/* Restore last active tab */
var lastLeftTab = recall('left-tab');
if (lastLeftTab) activateSidebarTab(lastLeftTab);
