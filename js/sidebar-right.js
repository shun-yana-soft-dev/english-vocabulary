/**
 * sidebar-right.js — right sidebar toggle and tab switching
 */

import { $, $$, on, store, recall } from './helpers.js';
import { isTablet, overlay } from './sidebar-left.js';

var sidebarRight      = $('#sidebar-right');
var toggleRightBtn    = $('#toggle-right');
var tabBarRightSpacer = $('#tab-bar-right-spacer');
var rightActivityBtns = $$('.right-tab-btn');
var rightTabContents  = $$('.right-tab-content');

export function openRight() {
  if (!sidebarRight) return;
  sidebarRight.classList.remove('collapsed');
  sidebarRight.classList.remove('mobile-open');
  if (tabBarRightSpacer) tabBarRightSpacer.classList.remove('spacer-collapsed');
  if (isTablet()) {
    /* At ≤900px the sidebar is position:fixed; mobile-open slides it in */
    sidebarRight.classList.add('mobile-open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  if (toggleRightBtn) toggleRightBtn.classList.add('active');
  store('right-open', '1');
}

export function closeRight() {
  if (!sidebarRight) return;
  sidebarRight.classList.add('collapsed');
  sidebarRight.classList.remove('mobile-open');
  if (tabBarRightSpacer) tabBarRightSpacer.classList.add('spacer-collapsed');
  if (isTablet()) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (toggleRightBtn) toggleRightBtn.classList.remove('active');
  store('right-open', '0');
}

var hasTocTab   = $$('.right-tab-content[data-rtab="toc"]').length > 0;
var rightTabKey = hasTocTab ? 'right-tab-post' : 'right-tab';
var isReload    = (function () {
  try { return performance.getEntriesByType('navigation')[0].type === 'reload'; } catch (_) { return false; }
}());

function activateRightTab(tabName) {
  rightActivityBtns.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.rtab === tabName);
  });
  rightTabContents.forEach(function (panel) {
    panel.classList.toggle('right-tab-hidden', panel.dataset.rtab !== tabName);
  });
  store(rightTabKey, tabName);
}

/* Restore stored tab; fall back to toc on post pages, then first available.
   On post pages, only restore stored tab on page refresh — navigating to a
   post always defaults to toc. Non-post pages always restore stored tab. */
function defaultRightTab() {
  if (hasTocTab) {
    if (isReload) {
      var s = recall(rightTabKey);
      if (s && $$('.right-tab-content[data-rtab="' + s + '"]').length > 0) return s;
    }
    return 'toc';
  }
  var s = recall(rightTabKey);
  if (s && $$('.right-tab-content[data-rtab="' + s + '"]').length > 0) return s;
  return rightActivityBtns.length ? rightActivityBtns[0].dataset.rtab : null;
}

/* Right activity bar: click to open / switch tab */
rightActivityBtns.forEach(function (btn) {
  on(btn, 'click', function () {
    var tabName     = btn.dataset.rtab;
    var isCollapsed = sidebarRight && sidebarRight.classList.contains('collapsed');
    if (isCollapsed) {
      activateRightTab(tabName);
      openRight();
    } else {
      activateRightTab(tabName);
    }
  });
});

/* Tab-bar toggle: open with last/default tab, or close */
on(toggleRightBtn, 'click', function () {
  if (!sidebarRight) return;
  if (sidebarRight.classList.contains('collapsed')) {
    var tab = defaultRightTab();
    if (tab) activateRightTab(tab);
    openRight();
  } else {
    closeRight();
  }
});

/* Restore right sidebar state (HTML default is collapsed) */
var rTab = defaultRightTab();
if (rTab) activateRightTab(rTab);
if (!isTablet() && recall('right-open') === '1') openRight();
document.documentElement.removeAttribute('data-vx-right');
