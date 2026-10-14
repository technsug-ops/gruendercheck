// Rapor Markdown'ı → HTML. /bericht (başvuranın rapor sayfası) kullanır; /rapor sayfasındaki kodun aynısı.
export const L = {
  de:{ report:'Gründungs-Check – Bericht', plan:'Gründungs-Check – Businessplan', for:'für', date:'Stand', verdict:'Einschätzung',
       tiers:{green:'Tragfähig', amber:'Tragfähig mit Auflagen', red:'So nicht tragfähig'}, warn:'zu prüfen', brand:'foundercheck.de',
       foot:'Dieses Dokument ist eine allgemeine Information und keine Rechts-, Steuer- oder Finanzberatung. TechNS UG (haftungsbeschränkt), Ludwig-Erhard-Str. 16A, 61440 Oberursel · info@dgitmarkt.de' },
  tr:{ report:'İş Fikri Kontrolü – Rapor', plan:'İş Fikri Kontrolü – İş planı', for:'', date:'Tarih', verdict:'Karar',
       tiers:{green:'Yürür', amber:'Şartlı yürür', red:'Bu haliyle yürümez'}, warn:'doğrulanmalı', brand:'foundercheck.de',
       foot:'Bu belge genel bilgidir; hukuki, vergisel veya finansal danışmanlık değildir. TechNS UG (haftungsbeschränkt), Ludwig-Erhard-Str. 16A, 61440 Oberursel · info@dgitmarkt.de' }
};
export const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let T = L.tr;
export const setLang = (lang) => { T = L[lang] || L.de; return T; };
export function inline(s) {
  s = esc(s);
  return s.replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/⚠️?\s*(doğrulanmalı|zu prüfen)?/g, (m, w) => `<span class="warn">⚠ ${w || T.warn}</span> `)
    .replace(/\((varsayım|Annahme)\)/gi, '<span class="assume">($1)</span>');
}
const isNum = (s) => /^[\s*]*[-−+≈]?\s*[\d.,]+(\s*[–-]\s*[\d.,]+)?\s*(€|%|€\/Monat)?[\s*]*$/.test(s) && /\d/.test(s);
const num = (s) => Number(String(s).replace(/\./g, '').replace(',', '.'));
function tierOf(word, score) {
  const w = (word || '').toLowerCase();
  if (/ye[sş]il|gr[uü]n|green/.test(w)) return 'green';
  if (/sar[iı]|gelb|yellow|amber/.test(w)) return 'amber';
  if (/k[iı]rm[iı]z[iı]|rot|red/.test(w)) return 'red';
  return score >= 70 ? 'green' : score >= 45 ? 'amber' : 'red';
}
function verdict(arg) {
  const [s, word, ...rest] = arg.split('|').map(x => x.trim());
  const score = Math.max(0, Math.min(100, num(s) || 0)), tier = tierOf(word, score);
  const col = { green:'#1f7a45', amber:'#a86200', red:'#b42318' }[tier];
  const r = 52, c = 2 * Math.PI * r, f = c * score / 100;
  return `<div class="verdict t-${tier}"><svg viewBox="0 0 130 130" role="img" aria-label="${score}/100">
    <circle cx="65" cy="65" r="${r}" fill="none" stroke="#e6eef7" stroke-width="12"/>
    <circle cx="65" cy="65" r="${r}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${f.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 65 65)"/>
    <text x="65" y="70" text-anchor="middle" font-family="Segoe UI,system-ui,Arial,sans-serif" font-size="36" font-weight="700" fill="${col}">${score}</text>
    <text x="65" y="90" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#56616f">/ 100</text></svg>
    <div><div class="label">${esc(T.verdict)}</div><span class="tier">${esc(T.tiers[tier])}</span><p class="text">${inline(rest.join(' | '))}</p></div></div>`;
}
function kpis(items) {
  return '<div class="kpis">' + items.map(a => { const [v, l] = a.split('|').map(x => x.trim()); return `<div class="kpi"><div class="v">${inline(v || '')}</div><div class="l">${inline(l || '')}</div></div>`; }).join('') + '</div>';
}
function bars(items, title) {
  const rows = items.map(a => { const [lab, rng, unit, hi] = a.split('|').map(x => x.trim());
    const m = (rng || '').split(/\s*[–-]\s*/).map(num); const lo = m[0] || 0, up = m.length > 1 ? m[1] : lo;
    return { lab: lab || '', lo, up, unit: unit || '', hi: !!hi, txt: lo === up ? `${lo}` : `${lo}–${up}` }; });
  const max = Math.max(...rows.map(r => r.up)) || 1, step = max <= 10 ? 2 : max <= 25 ? 5 : max <= 60 ? 10 : Math.ceil(max / 50) * 10;
  const top = Math.ceil(max / step) * step, ticks = []; for (let v = 0; v <= top; v += step) ticks.push(`<span>${v}</span>`);
  return `<div class="bars">${title ? `<div class="title">${inline(title)}</div>` : ''}` + rows.map(r =>
    `<div class="bar${r.hi ? ' hi' : ''}"><span class="lab">${inline(r.lab)}</span><span class="track"><span class="seg" style="left:${(r.lo / top * 100).toFixed(1)}%;width:${Math.max((r.up - r.lo) / top * 100, 1.5).toFixed(1)}%"></span></span><span class="val">${esc(r.txt)} ${esc(r.unit)}</span></div>`).join('') +
    `<div class="axis"><span></span><span class="ticks">${ticks.join('')}</span><span></span></div></div>`;
}
export function md(src) {
  const lines = src.replace(/\r/g, '').split('\n'), out = [];
  let i = 0;
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const DIR = /^\s*\{\{\s*(\w+)\s*(.*?)\s*\}\}\s*$/;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(DIR))) {
      const kind = m[1].toLowerCase();
      if (kind === 'skor' || kind === 'score') { out.push(verdict(m[2])); i++; continue; }
      if (kind === 'kpi') { const it = []; while (i < lines.length && (m = lines[i].match(DIR)) && m[1].toLowerCase() === 'kpi') { it.push(m[2]); i++; } out.push(kpis(it)); continue; }
      if (kind === 'grafik' || kind === 'chart' || kind === 'bar') {
        let title = ''; if (kind !== 'bar') { title = m[2]; i++; }
        const it = []; while (i < lines.length && (m = lines[i].match(DIR)) && m[1].toLowerCase() === 'bar') { it.push(m[2]); i++; }
        if (it.length) out.push(bars(it, title)); continue;
      }
      i++; continue;
    }
    if ((m = l.match(/^(#{1,4})\s+(.*)$/))) {
      const n = Math.min(m[1].length, 3);
      if (n === 2) { const k = m[2].match(/^(\d+)\.\s+(.*)$/); out.push(k ? `<h2><span class="n">${k[1]}</span><span>${inline(k[2])}</span></h2>` : `<h2>${inline(m[2])}</h2>`); }
      else out.push(`<h${n}>${inline(m[2])}</h${n}>`);
      i++; continue;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = cells(l); i += 2; const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      const numCol = head.map((_, c) => rows.length > 0 && rows.every(r => !r[c] || isNum(r[c])));
      const dotCol = head.map((h, c) => /^(puan|punkte|score)$/i.test(h) && rows.length > 0 && rows.every(r => /^[1-5]$/.test(r[c] || '')));
      dotCol.forEach((d, c) => { if (d) numCol[c] = false; });
      const cell = (r, c) => {
        const v = r[c] || '';
        if (dotCol[c]) { const n = +v; return `<td class="score"><span class="dots">${[1,2,3,4,5].map(k => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>${n}</td>`; }
        return `<td${numCol[c] ? ' class="num"' : ''}>${inline(v)}</td>`;
      };
      out.push('<table><thead><tr>' + head.map((h, c) => `<th${numCol[c] ? ' class="num"' : ''}>${inline(h)}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map(r => `<tr${/^\**\s*(toplam|gesamt|summe|açık|lücke)/i.test(r[0] || '') ? ' class="total"' : ''}>` + head.map((_, c) => cell(r, c)).join('') + '</tr>').join('') + '</tbody></table>');
      continue;
    }
    if (/^\s*>/.test(l)) { const q = []; while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; } out.push(`<blockquote>${md(q.join('\n'))}</blockquote>`); continue; }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
      const ordered = /^\s*\d/.test(l), items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ''); i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) { item += ' ' + lines[i].trim(); i++; }
        items.push(`<li>${inline(item.replace(/^\[( |x)\]\s*/i, (m0, x) => x.trim() ? '☑ ' : '☐ '))}</li>`);
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`); continue;
    }
    const p = [l.trim()]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||\s*>|\s*([-*+]|\d+[.)])\s+|\s*-{3,}\s*$|\s*\{\{)/.test(lines[i])) { p.push(lines[i].trim()); i++; }
    out.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return out.join('\n');
}

/** İlk "# başlık" ve hemen altındaki düz paragrafı kapak için ayırır. */
export function splitCover(src) {
  src = String(src || '').replace(/\r/g, '');
  let title = '', sub = '';
  const m = src.match(/^\s*#\s+([^\n]+)\n*/);
  if (m) {
    title = m[1].trim(); src = src.slice(m[0].length);
    const p = src.match(/^([^\n#|>{\s-][^\n]*(?:\n[^\n#|>{\s-][^\n]*)*)\n*/);
    if (p && !/^\d+[.)]\s/.test(p[1])) { sub = p[1].replace(/\n/g, ' ').trim(); src = src.slice(p[0].length); }
  }
  return { title, sub, body: src };
}
