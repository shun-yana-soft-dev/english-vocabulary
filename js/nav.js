/**
 * nav.js — custom navigation history (back / forward) using sessionStorage
 */

import { $, on } from './helpers.js';

var NAV_BACK_KEY = 'vx-back';
var NAV_FWD_KEY  = 'vx-fwd';
var NAV_ACT_KEY  = 'vx-act';

function navGetStack(key) {
  try { return JSON.parse(sessionStorage.getItem(key) || '[]'); } catch (_) { return []; }
}
function navSetStack(key, arr) {
  try { sessionStorage.setItem(key, JSON.stringify(arr)); } catch (_) {}
}
function navSetAction(val) {
  try { sessionStorage.setItem(NAV_ACT_KEY, val); } catch (_) {}
}

var btnBack    = $('#nav-back');
var btnForward = $('#nav-forward');

function navUpdateButtons() {
  var hasBack = navGetStack(NAV_BACK_KEY).length > 0;
  var hasFwd  = navGetStack(NAV_FWD_KEY).length  > 0;
  if (btnBack)    btnBack.disabled    = !hasBack;
  if (btnForward) btnForward.disabled = !hasFwd;
}

/* On page load: if a close action was flagged, wipe both stacks */
(function () {
  try {
    var action = sessionStorage.getItem(NAV_ACT_KEY) || '';
    sessionStorage.removeItem(NAV_ACT_KEY);
    if (action === 'close') {
      navSetStack(NAV_BACK_KEY, []);
      navSetStack(NAV_FWD_KEY,  []);
    }
  } catch (_) {}
  navUpdateButtons();
}());

/** Navigate to a new page, pushing current URL onto the back stack. */
export function navGoTo(url) {
  var back = navGetStack(NAV_BACK_KEY);
  back.push(window.location.href);
  navSetStack(NAV_BACK_KEY, back);
  navSetStack(NAV_FWD_KEY,  []);
  window.location.href = url;
}

on(btnBack, 'click', function () {
  var back = navGetStack(NAV_BACK_KEY);
  if (!back.length) return;
  var dest = back.pop();
  var fwd  = navGetStack(NAV_FWD_KEY);
  fwd.push(window.location.href);
  navSetStack(NAV_BACK_KEY, back);
  navSetStack(NAV_FWD_KEY,  fwd);
  window.location.href = dest;
});

on(btnForward, 'click', function () {
  var fwd = navGetStack(NAV_FWD_KEY);
  if (!fwd.length) return;
  var dest = fwd.pop();
  var back = navGetStack(NAV_BACK_KEY);
  back.push(window.location.href);
  navSetStack(NAV_BACK_KEY, back);
  navSetStack(NAV_FWD_KEY,  fwd);
  window.location.href = dest;
});

/* Tab close — reset both stacks then go home */
on($('.tab-close'), 'click', function (e) {
  e.preventDefault();
  navSetAction('close');
  window.location.href = this.href;
});

/* Intercept all internal same-origin link clicks */
document.addEventListener('click', function (e) {
  var link = e.target.closest('a');
  if (!link || link.classList.contains('tab-close')) return;
  if (!link.href || link.target === '_blank') return;
  try {
    var url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    /* Skip pure anchor scrolls on the same page */
    if (url.pathname === window.location.pathname && url.hash) return;
  } catch (_) { return; }
  e.preventDefault();
  navGoTo(link.href);
});
