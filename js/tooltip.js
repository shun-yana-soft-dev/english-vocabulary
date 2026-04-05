/**
 * tooltip.js — custom title-based tooltip with configurable position
 *
 * Elements opt in by having a `title` attribute.
 * Position is controlled via data-tooltip-pos="bottom|right|left" (default: bottom).
 */

import { on } from './helpers.js';

var tip = document.createElement('div');
tip.className = 'vault-tooltip';
document.body.appendChild(tip);

var tipTarget = null;
var tipSaved  = '';
var tipTimer  = null;

function tipShow(el) {
  tipSaved = el.getAttribute('title') || '';
  if (!tipSaved) return;
  el.removeAttribute('title');
  tipTarget = el;
  tip.textContent = tipSaved;
  var r   = el.getBoundingClientRect();
  var pos = el.dataset.tooltipPos || 'bottom';
  tip.dataset.dir = pos;
  if (pos === 'right') {
    tip.style.left      = Math.round(r.right + 10) + 'px';
    tip.style.top       = Math.round(r.top + r.height / 2) + 'px';
    tip.style.transform = 'translateY(-50%)';
  } else if (pos === 'left') {
    tip.style.left      = Math.round(r.left - 10) + 'px';
    tip.style.top       = Math.round(r.top + r.height / 2) + 'px';
    tip.style.transform = 'translate(-100%, -50%)';
  } else {
    tip.style.left      = Math.round(r.left + r.width / 2) + 'px';
    tip.style.top       = Math.round(r.bottom + 10) + 'px';
    tip.style.transform = 'translateX(-50%)';
  }
  tip.classList.add('is-visible');
}

function tipHide() {
  clearTimeout(tipTimer);
  if (tipTarget) { tipTarget.setAttribute('title', tipSaved); tipTarget = null; }
  tip.classList.remove('is-visible');
}

on(document.body, 'mouseover', function (e) {
  var el = e.target.closest('[title]');
  if (!el) {
    if (tipTarget && tipTarget.contains(e.target)) return;
    clearTimeout(tipTimer);
    tipHide();
    return;
  }
  if (el === tipTarget) return;
  tipHide();
  tipTimer = setTimeout(function () { tipShow(el); }, 400);
});

on(document.body, 'click',   tipHide);
on(document.body, 'keydown', tipHide);
