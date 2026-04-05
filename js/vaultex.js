/**
 * vaultex.js — entry point
 *
 * Imports all feature modules (their side effects register all event handlers)
 * and wires the one cross-cutting concern that needs both sidebars:
 * the overlay click that closes whichever sidebar is open.
 */

import { on } from './helpers.js';
import { closeLeft, overlay } from './sidebar-left.js';
import { closeRight } from './sidebar-right.js';

import './nav.js';
import './dropdowns.js';
import './explorer.js';
import './tags.js';
import './help-modal.js';
import './search.js';
import './quick-switcher.js';
import './toc.js';
import './responsive.js';
import './post-utils.js';
import './tooltip.js';

/* Shared overlay click: close whichever sidebar is open */
on(overlay, 'click', function () { closeLeft(); closeRight(); });
