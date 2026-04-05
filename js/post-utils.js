/**
 * post-utils.js — post page utilities
 *
 * - Smooth scroll for in-page anchor links
 * - External link safety (rel="noopener noreferrer")
 *
 * Only runs when #markdown-body exists (post / page layouts).
 */

import { $, $$, on, makeRe } from './helpers.js';

var markdownBody = $('#markdown-body');

/* Wrap matching text nodes inside `el` with <mark class="search-highlight">.
   Returns the array of all inserted marks (empty if nothing matched). */
function highlightTermsInEl(el, re) {
  var marks = [];
  function walkText(node) {
    if (node.nodeType === 3) {                          /* TEXT_NODE */
      re.lastIndex = 0;
      var text = node.nodeValue;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var last = 0, m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = m[0];
        frag.appendChild(mark);
        marks.push(mark);
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
      Array.from(node.childNodes).forEach(walkText);
    }
  }

  walkText(el);

  if (!marks.length) return marks;
  setTimeout(function () {
    marks.forEach(function (mark) {
      var p = mark.parentNode;
      if (p) p.replaceChild(document.createTextNode(mark.textContent), mark);
    });
  }, 2500);
  return marks;
}

/* Scroll to search excerpt on arrival from a match-card click */
(function () {
  var SCROLL_TARGET_KEY = 'vaultex-scroll-target';
  var raw = sessionStorage.getItem(SCROLL_TARGET_KEY);
  if (!raw) return;
  var t;
  try { t = JSON.parse(raw); } catch (e) { return; }

  /* Compare pathnames only — g.url may be a full URL or just a path */
  var targetPath;
  try { targetPath = new URL(t.url, window.location.href).pathname; } catch (e) { targetPath = t.url; }
  if (targetPath !== window.location.pathname) return;
  sessionStorage.removeItem(SCROLL_TARGET_KEY);

  requestAnimationFrame(function () {
    var root = markdownBody || document.body;
    var norm = t.matchCase
      ? function (s) { return s.replace(/\s+/g, ' ').trim(); }
      : function (s) { return s.replace(/\s+/g, ' ').trim().toLowerCase(); };

    var blocks = root.querySelectorAll('p, pre, li, h1, h2, h3, h4, h5, h6, blockquote, td');
    var el = null;

    /* Strategy 1: find block(s) containing the query terms.
       The excerpt text in t.text mixes content from multiple DOM blocks
       (e.g. line numbers + code), so anchor-text disambiguation is unreliable.
       We use it only as a tiebreaker and always fall back to candidates[0]. */
    if (t.query) {
      var qTerms = t.query.trim().split(/\s+/).filter(Boolean);
      var qRe = makeRe(qTerms, t.matchCase);
      if (qRe) {
        var candidates = [];
        for (var i = 0; i < blocks.length; i++) {
          qRe.lastIndex = 0;
          if (qRe.test(blocks[i].textContent)) candidates.push(blocks[i]);
        }
        if (candidates.length === 1) {
          el = candidates[0];
        } else if (candidates.length > 1) {
          if (t.text) {
            var anchor = norm(t.text.slice(0, 40));
            for (var j = 0; j < candidates.length; j++) {
              if (norm(candidates[j].textContent).includes(anchor)) { el = candidates[j]; break; }
            }
          }
          if (!el) el = candidates[0];
        }
      }
    }

    /* Strategy 2: fallback to excerpt anchor text matching */
    if (!el && t.text) {
      var lengths = [60, 40, 25];
      outer: for (var li = 0; li < lengths.length; li++) {
        var needle = norm(t.text.slice(0, lengths[li]));
        if (!needle) continue;
        for (var k = 0; k < blocks.length; k++) {
          if (norm(blocks[k].textContent).includes(needle)) { el = blocks[k]; break outer; }
        }
      }
    }

    /* Highlight ALL occurrences of the query terms across the entire post body,
       then scroll to the specific occurrence that was clicked (hitIdx).
       The excerpt text can span multiple DOM blocks (e.g. line-numbered code
       blocks mix gutter + code text), so we rely on ordinal position instead
       of anchor-text matching to land on the right occurrence. */
    if (t.query) {
      var hTerms = t.query.trim().split(/\s+/).filter(Boolean);
      var hRe = makeRe(hTerms, t.matchCase);
      if (hRe) {
        var allMarks = highlightTermsInEl(root, hRe);
        if (allMarks.length) {
          var hitIdx = t.hitIdx != null ? t.hitIdx : 0;
          var scrollTarget = allMarks[Math.min(hitIdx, allMarks.length - 1)];
          scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }

    /* Fallback: whole-block animation when no query is stored */
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('search-scroll-highlight');
    el.addEventListener('animationend', function () {
      el.classList.remove('search-scroll-highlight');
    }, { once: true });
  });
})();

if (markdownBody) {
  $$('a[href^="#"]', markdownBody).forEach(function (a) {
    on(a, 'click', function (e) {
      var target = $(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  $$('a', markdownBody).forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if ((href.startsWith('http://') || href.startsWith('https://')) &&
        a.hostname !== window.location.hostname) {
      a.setAttribute('rel', 'noopener noreferrer');
      /* target="_blank" is already set by Hexo's external_link config */
    }
  });
}
