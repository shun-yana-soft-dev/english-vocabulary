/**
 * responsive.js — handle window resize
 *
 * Collapses sidebars at breakpoints and restores desktop state.
 */

import { recall } from './helpers.js';
import { isMobile, isTablet, closeLeft, sidebarLeft, toggleLeftBtn, overlay } from './sidebar-left.js';
import { closeRight } from './sidebar-right.js';

var resizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    if (isTablet()) {
      /* Tablet/mobile: collapse right sidebar */
      closeRight();
    }
    if (isMobile()) {
      closeLeft();
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      /* Desktop: restore left sidebar stored state */
      if (recall('left-open') !== '0') {
        sidebarLeft && sidebarLeft.classList.remove('collapsed');
        toggleLeftBtn && toggleLeftBtn.classList.add('active');
      }
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }, 150);
});
