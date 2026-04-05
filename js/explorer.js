/**
 * explorer.js — file explorer: category tree, section collapse, action bar
 *
 * Manages the left sidebar's file tree state:
 *   - Category tree expand/collapse with persisted state
 *   - Explorer section headers (collapse/expand)
 *   - Action bar: collapse-all, auto-reveal active item, close button
 */

import { $, $$, on, store, recall } from './helpers.js';
import { closeLeft } from './sidebar-left.js';

var navCategories = $('#nav-categories');

function updateCatVisibility() {
  if (!navCategories) return;
  $$('[data-depth]', navCategories).forEach(function (item) {
    var visible = true;
    var pid = item.dataset.parentTreeId;
    /* Walk up the parent chain; if any ancestor is collapsed, hide */
    while (pid) {
      var parentEl = navCategories.querySelector('[data-tree-id="' + pid + '"]');
      if (!parentEl) break;
      if (parentEl.dataset.treeOpen === 'false') { visible = false; break; }
      pid = parentEl.dataset.parentTreeId;
    }
    item.style.display = visible ? 'flex' : 'none';
  });
}

/* Sync collapse-all button label and state */
function syncCollapseBtn() {
  var btn = $('#explorer-collapse-all');
  if (!btn) return;
  var anyOpen =
    $$('.explorer-section-header').some(function (h) { return !h.classList.contains('collapsed'); }) ||
    $$('.nav-tree-parent').some(function (p) { return p.dataset.treeOpen !== 'false'; });
  btn.classList.toggle('is-expanded', !anyOpen);
  var label = anyOpen ? 'Collapse all' : 'Expand all';
  btn.title = label;
  btn.setAttribute('aria-label', label);
}

/* ---- Category tree ---- */
$$('.nav-tree-parent').forEach(function (parent) {
  /* Restore persisted state */
  try {
    var saved = localStorage.getItem('obs-' + parent.dataset.treeId);
    if (saved === '0') parent.dataset.treeOpen = 'false';
  } catch (_) {}
  var toggleBtn = parent.querySelector('.tree-toggle-btn');
  on(toggleBtn, 'click', function (e) {
    e.stopPropagation();
    var isOpen = parent.dataset.treeOpen === 'true';
    parent.dataset.treeOpen = isOpen ? 'false' : 'true';
    updateCatVisibility();
    try { localStorage.setItem('obs-' + parent.dataset.treeId, isOpen ? '0' : '1'); } catch (_) {}
    syncCollapseBtn();
  });
});
updateCatVisibility();

/* ---- Explorer section collapse ---- */
$$('.explorer-section-header').forEach(function (header) {
  var sectionId = header.dataset.section;
  var tree = $('#nav-' + sectionId);
  var key  = 'section-' + sectionId;

  /* Restore collapsed state */
  if (recall(key) === '0' && tree) {
    header.classList.add('collapsed');
    tree.classList.add('section-hidden');
  }

  on(header, 'click', function () {
    var isCollapsed = header.classList.toggle('collapsed');
    if (tree) tree.classList.toggle('section-hidden', isCollapsed);
    store(key, isCollapsed ? '0' : '1');
    syncCollapseBtn();
  });
});

/* Remove FOUC-prevention overrides injected by the inline script in <head> */
var sectionsInitStyle = document.getElementById('vx-sections-init');
if (sectionsInitStyle) sectionsInitStyle.remove();
document.documentElement.removeAttribute('data-vx-init');

syncCollapseBtn();

/* ---- Explorer action bar ---- */
on($('#explorer-collapse-all'), 'click', function () {
  var btn      = this;
  var expanding = btn.classList.contains('is-expanded');
  $$('.explorer-section-header').forEach(function (header) {
    var sectionId = header.dataset.section;
    var tree = $('#nav-' + sectionId);
    if (expanding) {
      header.classList.remove('collapsed');
      if (tree) tree.classList.remove('section-hidden');
      store('section-' + sectionId, '1');
    } else {
      header.classList.add('collapsed');
      if (tree) tree.classList.add('section-hidden');
      store('section-' + sectionId, '0');
    }
  });
  $$('.nav-tree-parent').forEach(function (parent) {
    parent.dataset.treeOpen = expanding ? 'true' : 'false';
    try { localStorage.setItem('obs-' + parent.dataset.treeId, expanding ? '1' : '0'); } catch (_) {}
  });
  updateCatVisibility();
  btn.classList.toggle('is-expanded', !expanding);
  var label = expanding ? 'Collapse all' : 'Expand all';
  btn.title = label;
  btn.setAttribute('aria-label', label);
});

on($('#explorer-auto-reveal'), 'click', function () {
  var active = $('.nav-item.active');
  if (!active) return;

  /* 1. Expand the section that contains the active item */
  var section = active.closest('.explorer-section');
  if (section) {
    var header    = section.querySelector('.explorer-section-header');
    var sectionId = header && header.dataset.section;
    var tree      = sectionId && $('#nav-' + sectionId);
    if (header && header.classList.contains('collapsed')) {
      header.classList.remove('collapsed');
      if (tree) tree.classList.remove('section-hidden');
      store('section-' + sectionId, '1');
    }
  }

  /* 2. Expand all ancestor tree-parent nodes */
  var pid = active.dataset.parentTreeId;
  while (pid) {
    var parentEl = navCategories && navCategories.querySelector('[data-tree-id="' + pid + '"]');
    if (!parentEl) break;
    if (parentEl.dataset.treeOpen === 'false') {
      parentEl.dataset.treeOpen = 'true';
      try { localStorage.setItem('obs-' + pid, '1'); } catch (_) {}
    }
    pid = parentEl.dataset.parentTreeId;
  }
  updateCatVisibility();

  /* 3. Sync collapse-all button state */
  syncCollapseBtn();
});
