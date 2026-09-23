// Temporary design-contract audit, injected by Claude during the v1.1 pass. Not shipped.
(() => {
  const hex = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
  // Effective background: walk up compositing solid-ish backgrounds. Stops at an image ancestor (returns null = unknown).
  const bgOf = (el) => {
    let layers = [];
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null;
      const c = hex(cs.backgroundColor);
      if (c && (c[3] === undefined || c[3] > 0)) { layers.push(c); if (c[3] === undefined || c[3] >= 0.99) break; }
    }
    if (!layers.length) return null;
    let base = layers.pop(); base = base.slice(0, 3);
    if (layers.length && (hex('x') || true)) {}
    while (layers.length) { const l = layers.pop(); const a = l[3] ?? 1; base = base.map((v, i) => l[i] * a + v * (1 - a)); }
    return base;
  };
  const ALLOWED = new Set(['➔', '▶', '◀', '✓', '✕']);
  const pictorial = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}]/gu;
  window.__audit = (label) => {
    const out = new Set();
    const root = document.querySelector('.stage-container') || document.body;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const t = n.textContent.trim(); if (!t) continue;
      const el = n.parentElement; if (!el) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
      let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if (op < 0.05) continue;
      const fs = parseFloat(cs.fontSize), fw = +cs.fontWeight, fam = cs.fontFamily.split(',')[0].replace(/"/g, '');
      const cls = (String(el.className) || el.tagName).slice(0, 48);
      if (fs < 9.92) out.add(`${label} | TYPE below-nano ${fs}px | ${cls} | "${t.slice(0, 28)}"`);
      else if (fs < 12.8 && fw < 700) out.add(`${label} | TYPE small<700 ${fs}px/${fw} | ${cls} | "${t.slice(0, 28)}"`);
      if (!/Outfit|Plus Jakarta/.test(fam)) out.add(`${label} | FAMILY ${fam} | ${cls}`);
      for (const g of t.match(pictorial) || []) if (!ALLOWED.has(g)) out.add(`${label} | GLYPH ${g} U+${g.codePointAt(0).toString(16)} | ${cls} | "${t.slice(0, 28)}"`);
      const fg = hex(cs.color), bg = bgOf(el);
      if (fg && bg && (fg[3] ?? 1) > 0.5) {
        const rt = ratio(fg, bg), large = fs >= 24 || (fs >= 18.66 && fw >= 700), need = large ? 3 : 4.5;
        if (rt < need) out.add(`${label} | CONTRAST ${rt.toFixed(2)} < ${need} | ${cls} | ${cs.color} on rgb(${bg.map(Math.round)}) | "${t.slice(0, 28)}"`);
      }
    }
    document.querySelectorAll('button').forEach((b) => {
      const r = b.getBoundingClientRect(); if (!r.width) return;
      const t = b.textContent.trim(), primary = /btn-action-primary|btn-start/.test(b.className);
      if (t.endsWith('▶') && primary) out.add(`${label} | TIER ▶ button is primary | ${b.id} "${t}"`);
      if (t.endsWith('➔') && !primary && !b.closest('[class*=editor]')) out.add(`${label} | TIER ➔ button not primary | ${b.id} "${t}" .${b.className}`);
    });
    const prim = [...document.querySelectorAll('.btn-action-primary, .btn-start')].filter((b) => b.getBoundingClientRect().width);
    if (prim.length > 1) out.add(`${label} | TIER ${prim.length} primaries visible: ${prim.map((b) => b.id).join(', ')}`);
    return [...out];
  };
})();
