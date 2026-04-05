/**
 * toc.js — table of contents
 *
 * Reads headings from #markdown-body, populates #toc-nav.
 * Supports collapsible parent headings and scroll-based active tracking.
 *
 * Controlled via window.VAULTEX_CONFIG.toc (bool) and .tocDepth (1-6).
 */

import { $, $$, on } from './helpers.js';

var markdownBody = $('#markdown-body');
var tocNav       = $('#toc-nav');
var tocEnabled   = !window.VAULTEX_CONFIG || window.VAULTEX_CONFIG.toc !== false;

if (markdownBody && tocNav && tocEnabled) {
  var tocDepth     = (window.VAULTEX_CONFIG && window.VAULTEX_CONFIG.tocDepth) || 3;
  var tocMaxLevel  = Math.min(tocDepth, 6);
  var tocSelectors = [];
  for (var tl = 1; tl <= tocMaxLevel; tl++) tocSelectors.push('h' + tl);
  var headings = $$(tocSelectors.join(', '), markdownBody);

  if (headings.length > 0) {
    tocNav.innerHTML = ''; /* clear empty placeholder */

    /* ---- Pass 1: create link elements ---- */
    var minLevel = headings.reduce(function (m, h) {
      return Math.min(m, parseInt(h.tagName[1], 10));
    }, 6);
    var tocLinkEls = [];
    headings.forEach(function (h, idx) {
      if (!h.id) {
        h.id = 'heading-' + idx + '-' + h.textContent.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50);
      }
      var level = parseInt(h.tagName[1], 10) - minLevel + 1;
      var link  = document.createElement('a');
      link.href = '#' + h.id;
      link.className = 'toc-item';
      link.dataset.level = level;
      tocLinkEls.push(link);
      tocNav.appendChild(link);
    });

    /* ---- Pass 2: parent-child relationships ---- */
    var tocParentOf = headings.map(function (h, i) {
      var level = parseInt(h.tagName[1], 10);
      for (var j = i - 1; j >= 0; j--) {
        if (parseInt(headings[j].tagName[1], 10) < level) return j;
      }
      return -1;
    });
    var tocIsParent = headings.map(function (h, i) {
      var level = parseInt(h.tagName[1], 10);
      for (var k = i + 1; k < headings.length; k++) {
        if (parseInt(headings[k].tagName[1], 10) <= level) break;
        return true;
      }
      return false;
    });

    /* ---- Pass 3: chevron / spacer + label ---- */
    function makeTocChevron() {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'tree-chevron');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '15');
      svg.setAttribute('height', '15');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2.5');
      svg.setAttribute('aria-hidden', 'true');
      var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      poly.setAttribute('points', '6 9 12 15 18 9');
      svg.appendChild(poly);
      return svg;
    }

    headings.forEach(function (h, i) {
      var link  = tocLinkEls[i];
      var label = document.createElement('span');
      label.className = 'toc-label';
      label.textContent = h.textContent;
      if (tocIsParent[i]) {
        link.classList.add('toc-parent');
        link.dataset.tocOpen = 'true';
        link.appendChild(makeTocChevron());
      } else {
        var spacer = document.createElement('span');
        spacer.className = 'toc-chevron-spacer';
        link.appendChild(spacer);
      }
      link.appendChild(label);
    });

    /* ---- Collapse / expand ---- */
    function updateTocChildVisibility() {
      headings.forEach(function (h, i) {
        if (tocParentOf[i] < 0) { tocLinkEls[i].style.display = ''; return; }
        var visible = true;
        var idx = tocParentOf[i];
        while (idx >= 0) {
          if (tocIsParent[idx] && tocLinkEls[idx].dataset.tocOpen === 'false') {
            visible = false; break;
          }
          idx = tocParentOf[idx];
        }
        tocLinkEls[i].style.display = visible ? '' : 'none';
      });
    }

    function syncTocCollapseBtn() {
      var btn = $('#toc-collapse-all');
      if (!btn) return;
      var anyOpen = $$('.toc-parent', tocNav).some(function (p) {
        return p.dataset.tocOpen !== 'false';
      });
      btn.classList.toggle('is-expanded', !anyOpen);
      var label = anyOpen ? 'Collapse all' : 'Expand all';
      btn.title = label;
      btn.setAttribute('aria-label', label);
    }

    $$('.tree-chevron', tocNav).forEach(function (chevron) {
      chevron.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var parentLink = chevron.closest('.toc-parent');
        var isOpen = parentLink.dataset.tocOpen !== 'false';
        parentLink.dataset.tocOpen = isOpen ? 'false' : 'true';
        updateTocChildVisibility();
        syncTocCollapseBtn();
      });
    });

    on($('#toc-collapse-all'), 'click', function () {
      var expanding = this.classList.contains('is-expanded');
      $$('.toc-parent', tocNav).forEach(function (link) {
        link.dataset.tocOpen = expanding ? 'true' : 'false';
      });
      updateTocChildVisibility();
      syncTocCollapseBtn();
    });

    syncTocCollapseBtn();

    /* ---- Active heading tracking via scroll ---- */
    var headingMap     = new WeakMap();
    headings.forEach(function (h, i) { headingMap.set(h, tocLinkEls[i]); });

    var activeLink       = null;
    var clickScrolling   = false;
    var clickScrollTimer = null;
    var tocTicking       = false;

    function setActiveTocLink(link) {
      if (link === activeLink) return;
      if (activeLink) activeLink.classList.remove('active');
      activeLink = link;
      if (link) {
        link.classList.add('active');
        link.scrollIntoView({ block: 'nearest' });
      }
    }

    function updateActiveToc() {
      tocTicking = false;
      if (clickScrolling) return;
      var threshold = 100;
      var active = null;
      for (var i = headings.length - 1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top <= threshold) {
          active = headings[i];
          break;
        }
      }
      if (!active) active = headings[0];
      setActiveTocLink(active ? headingMap.get(active) : null);
    }

    window.addEventListener('scroll', function () {
      if (!tocTicking) {
        tocTicking = true;
        requestAnimationFrame(updateActiveToc);
      }
    }, { passive: true });

    headings.forEach(function (h, idx) {
      var link = tocLinkEls[idx];
      link.addEventListener('click', function (e) {
        e.preventDefault();
        setActiveTocLink(link);
        clickScrolling = true;
        clearTimeout(clickScrollTimer);
        clickScrollTimer = setTimeout(function () {
          clickScrolling = false;
          updateActiveToc();
        }, 1000);
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        h.classList.add('toc-heading-flash');
        setTimeout(function () { h.classList.remove('toc-heading-flash'); }, 1500);
      });
    });

    updateActiveToc();
  }
}
