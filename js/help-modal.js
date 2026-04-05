/**
 * help-modal.js — help modal open / close
 */

import { $, on } from './helpers.js';

var helpModal    = $('#help-modal');
var vaultHelpBtn = $('#vault-help-btn');

function openHelpModal() {
  if (!helpModal) return;
  helpModal.hidden = false;
  var closeBtn = $('#hm-close');
  if (closeBtn) closeBtn.focus();
}

function closeHelpModal() {
  if (!helpModal) return;
  helpModal.hidden = true;
  if (vaultHelpBtn) vaultHelpBtn.focus();
}

on(vaultHelpBtn,      'click', openHelpModal);
on($('#hm-close'),    'click', closeHelpModal);
on($('#hm-minimize'), 'click', closeHelpModal);
on(helpModal, 'click', function (e) {
  if (e.target === helpModal) closeHelpModal();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && helpModal && !helpModal.hidden) closeHelpModal();
});
