/**
 * helpers.js — shared DOM, storage, and HTML/text utilities
 */

export function $(sel, ctx)  { return (ctx || document).querySelector(sel); }
export function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
export function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

export function store(key, val) {
  try { localStorage.setItem('obs-' + key, val); } catch (_) {}
}
export function recall(key) {
  try { return localStorage.getItem('obs-' + key); } catch (_) { return null; }
}

/** Escape a string for safe HTML insertion. */
export function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Escape special regex characters in a literal string. */
export function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Decode HTML entities that survive XML parsing (e.g. &quot; &amp; &#39;). */
export function decodeEntities(s) {
  return s
    .replace(/&amp;/g,  '&').replace(/&lt;/g,  '<').replace(/&gt;/g,  '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g,  "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); });
}

/** Strip all HTML tags then decode entities → plain readable text. */
export function toPlain(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Build a combined regex for all search terms. */
export function makeRe(terms, cs) {
  var parts = terms.filter(Boolean).map(escRe);
  return parts.length ? new RegExp('(' + parts.join('|') + ')', cs ? 'g' : 'gi') : null;
}

/**
 * Render text with search highlights. Splits at match boundaries so each
 * part is escaped independently — avoids highlighting inside HTML entities.
 */
export function renderWithHighlight(text, terms, cs) {
  var re = makeRe(terms, cs);
  if (!re) return escHtml(text);
  var out = '', last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    out += escHtml(text.slice(last, m.index));
    out += '<em class="search-highlight">' + escHtml(m[0]) + '</em>';
    last = m.index + m[0].length;
  }
  return out + escHtml(text.slice(last));
}
