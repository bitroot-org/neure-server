// Rich-text description sanitiser (no library available). Keeps a small whitelist of tags with NO attributes
// (links keep a validated http/https/mailto href). Everything else is dropped or escaped, so stored HTML
// can be rendered safely on the public booking page.
const ALLOWED = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'div', 'span']);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi;
const escText = (t) => t.replace(/&(?!(amp|lt|gt|quot|#39);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sanitizeHtml = (input) => {
  if (input == null) return null;
  let html = String(input).replace(DROP_WITH_CONTENT, '').replace(/<!--[\s\S]*?-->/g, '');
  const tag = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  let out = '', last = 0, m;
  while ((m = tag.exec(html))) {
    out += escText(html.slice(last, m.index));
    last = tag.lastIndex;
    const name = m[1].toLowerCase();
    if (!ALLOWED.has(name)) continue;
    if (m[0].startsWith('</')) { out += `</${name}>`; continue; }
    if (name === 'a') {
      const href = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(m[2]);
      const url = href ? (href[1] ?? href[2]).trim() : '';
      out += /^(https?:\/\/|mailto:)/i.test(url) ? `<a href="${url.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">` : '<a>';
    } else out += `<${name}>`;
  }
  out += escText(html.slice(last));
  return out.trim() || null;
};

module.exports = { sanitizeHtml };
