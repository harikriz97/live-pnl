
let D = null, tab = 'live', per = 'all', fail = false;
const PAL = ['#39c5ff','#7aa2ff','#2ee6a6','#ffc857','#ff9d5c','#f58bd1'], KOL = new Proxy({}, {get: (_, k) => PAL[[...String(k)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % PAL.length]});
const $ = s => document.querySelector(s), n = x => Number(x) || 0;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rs = x => (Math.round(x) < 0 ? '−' : Math.round(x) > 0 ? '+' : '') + '₹' + Math.abs(Math.round(x)).toLocaleString('en-IN');
const cl = x => x < 0 ? 'r' : x > 0 ? 'g' : '', S = a => a.reduce((s, t) => s + n(t.pnl), 0), pl = (k, w) => `${k} ${w}${k === 1 ? '' : 's'}`;
const day = d => { const x = new Date(d + 'T00:00:00Z'); return isNaN(x) ? esc(d) : x.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', timeZone:'UTC'}); };
function card(t){
  const one = !String(t.sym).includes(' + '), open = t.status === 'open';
  const size = t.u === 'share' ? pl(n(t.qty), 'share') : pl(n(t.lots), 'lot');
  const px = [`in <b>${esc(t.tin)}</b>` + (one ? ` @ <b>${n(t.entry).toFixed(2)}</b>` : '')].concat(open ? [one ? `now <b>${n(t.ltp).toFixed(2)}</b>` : ''] : [t.tout ? `out <b>${esc(t.tout)}</b>` : '', esc(t.why)]).filter(Boolean).join('  ·  ');
  return `<div class="c in"><div class="row"><span class="nm">${esc(t.strat)}</span><span class="pn ${cl(n(t.pnl))}" data-k="${esc(t.id)}" data-v="${n(t.pnl)}">${rs(n(t.pnl))}</span></div>` +
    `<div class="tags"><span class="d" style="--k:${KOL[t.desk] || '#93a0b8'}">${esc(t.desk)}</span><span>${size}</span>${t.side ? `<span>${esc(t.side)}</span>` : ''}</div>` +
    (t.sym ? `<div class="px"><b>${esc(t.sym)}</b></div>` : '') + `<div class="px">${px}</div></div>`;
}
const kpi = a => '<div class="k">' + a.map(x => `<div><span class="m">${x[0]}</span><b class="${x[2] || ''}">${x[1]}</b></div>`).join('') + '</div>';
function line(v){
  if(v.length < 2) return '<div style="height:16px"></div>';
  const lo = Math.min(0, ...v), hi = Math.max(0, ...v), s = (hi - lo) || 1, y = q => 92 - (q - lo) / s * 82, col = v[v.length - 1] < 0 ? '#ff6b81' : '#2ee6a6';
  const pts = v.map((q, i) => (i / (v.length - 1) * 300).toFixed(1) + ',' + y(q).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label="P&amp;L line"><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".38"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>` +
    `<polygon fill="url(#gr)" points="0,100 ${pts} 300,100"/><line x1="0" x2="300" y1="${y(0)}" y2="${y(0)}" stroke="rgba(255,255,255,.22)" stroke-dasharray="4 5" vector-effect="non-scaling-stroke"/>` +
    `<polyline fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" points="${pts}"/></svg><div class="lh m"><span>Low ${rs(Math.min(...v))}</span><span>High ${rs(Math.max(...v))}</span></div>`;
}
const hero = (label, x, v) => `<div class="hero ${x < 0 ? 'neg' : ''}"><div class="m">${label}</div><div class="big ${cl(x)}" data-k="hero-${tab}-${tab === 'stats' ? per : ''}" data-v="${x}">${rs(x)}</div>${line(v)}</div>`;
const head = (t, x) => `<h3>${t}<span class="${x === undefined ? '' : cl(x)}">${x === undefined ? '' : rs(x)}</span></h3>`;
function live(){
  const M = D.meta, by = (a, b) => n(b.pnl) - n(a.pnl), o = D.live.filter(t => t.status === 'open').sort(by), c = D.live.filter(t => t.status === 'closed').sort(by);
  const lots = o.filter(t => t.u !== 'share').reduce((s, t) => s + n(t.lots), 0);
  return hero('Today’s P&amp;L · paper', n(M.total), D.curve.map(x => n(x.total))) +
    kpi([['Strategies running', new Set(o.map(t => t.desk + t.strat)).size], ['Lots running', lots], ['Closed today', n(M.n_closed)], ['Margin in use', M.margin == null ? '–' : '₹' + Math.round(M.margin).toLocaleString('en-IN')]]) +
    head('Running now', o.length ? S(o) : undefined) + (o.map(card).join('') || '<div class="c empty">No open trades right now.</div>') +
    (c.length ? head('Closed today', S(c)) + c.map(card).join('') : '');
}
function sel(){
  const d = D.meta.day || ''; if(per === 'all' || !d) return D.trades;
  const from = per === 'm' ? d.slice(0, 8) + '01' : new Date(new Date(d + 'T00:00:00Z') - 6 * 864e5).toISOString().slice(0, 10);
  return D.trades.filter(t => t.day >= from);
}
function daily(T){ const o = {}; T.forEach(t => o[t.day] = (o[t.day] || 0) + n(t.pnl)); return Object.keys(o).sort().map(d => [d, o[d]]); }
function donut(w, k){
  const p = k ? w / k : 0, L = 2 * Math.PI * 40;
  return `<div class="c don"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="11"/>` +
    (p ? `<circle class="sw" cx="50" cy="50" r="40" fill="none" stroke="#39c5ff" stroke-width="11" stroke-linecap="round" stroke-dasharray="${p * L} ${L}" transform="rotate(-90 50 50)"/>` : '') +
    `</svg><div><div class="m">Win rate</div><b>${k ? Math.round(p * 100) + '%' : '–'}</b><div class="m">${w} of ${pl(k, 'trade')}</div></div></div>`;
}
function stats(){
  const T = sel(), w = T.filter(t => n(t.pnl) > 0), l = T.filter(t => n(t.pnl) < 0), dy = daily(T); let cum = 0, pk = 0, dd = 0;
  const eq = [0].concat(dy.map(x => { cum += x[1]; pk = Math.max(pk, cum); dd = Math.min(dd, cum - pk); return cum; }));
  const by = {}; T.forEach(t => (by[t.strat] = by[t.strat] || []).push(t));
  const R = Object.keys(by).map(k => [k, by[k], S(by[k])]).sort((a, b) => b[2] - a[2]), mx = Math.max(1, ...R.map(r => Math.abs(r[2]))), dv = dy.map(x => x[1]);
  return '<div class="seg">' + [['all', 'All'], ['m', 'This month'], ['w', '7 days']].map(x => `<button data-p="${x[0]}" class="${per === x[0] ? 'on' : ''}">${x[1]}</button>`).join('') + '</div>' +
    hero('Booked P&amp;L · paper', S(T), eq) + donut(w.length, T.length) +
    kpi([['Profit factor', l.length ? (S(w) / -S(l)).toFixed(2) : '–'], ['Max drawdown (daily)', dd ? rs(dd) : '₹0', cl(dd)], ['Best day', dv.length ? rs(Math.max(...dv)) : '–', dv.length ? cl(Math.max(...dv)) : ''], ['Worst day', dv.length ? rs(Math.min(...dv)) : '–', dv.length ? cl(Math.min(...dv)) : '']]) +
    (T.length < 30 ? `<div class="note">${T.length ? 'Only ' + pl(T.length, 'trade') + ' so far' : 'No trades yet'}: too few to judge a strategy.</div>` : '') + head('By strategy') +
    (R.map(r => `<div class="c in"><div class="row"><span class="nm">${esc(r[0])}</span><span class="pn ${cl(r[2])}">${rs(r[2])}</span></div><div class="px">${pl(r[1].length, 'trade')}  ·  win ` +
      `${Math.round(r[1].filter(t => n(t.pnl) > 0).length / r[1].length * 100)}%  ·  avg ${rs(r[2] / r[1].length)}</div><div class="bar"><i style="width:${Math.max(2, Math.abs(r[2]) / mx * 100)}%;background:${r[2] < 0 ? 'linear-gradient(90deg,#ff6b81,#ff9d5c)' : 'linear-gradient(90deg,#39c5ff,#2ee6a6)'}"></i></div></div>`).join('') || '<div class="c empty">No closed trades.</div>');
}
function hist(){
  return daily(D.trades).reverse().slice(0, 60).map(x => head(day(x[0]), x[1]) + D.trades.filter(t => t.day === x[0]).map(card).join('')).join('') || '<div class="c empty">No history yet.</div>';
}
function open_(){ const p = new Date(Date.now() + 330 * 6e4), m = p.getUTCHours() * 60 + p.getUTCMinutes(), w = p.getUTCDay(); return w > 0 && w < 6 && m >= 542 && m <= 1415; }
function status(){
  const u = $('#up'), M = D ? D.meta : {}, age = M.ts ? Math.round(Date.now() / 1000 - M.ts) : 1e9, late = age > 180, at = M.ts ? `${M.day.slice(8)}/${M.day.slice(5, 7)} ${M.hm}` : '';
  u.className = 'st' + (!C || fail || (late && open_()) ? ' bad' : late ? ' off' : '');
  u.lastChild.textContent = !C ? 'Not connected' : fail ? 'No connection' + (at ? ' · last ' + at : '') : !M.ts ? 'No data yet' : !late ? `Live · ${M.hm}` : (open_() ? 'Not updating · last ' : 'Market closed · last ') + at;
}
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, seen = {};
function count(el, a, b){
  const t0 = performance.now(), ms = 900;
  (function step(t){ if(!el.isConnected) return; const p = Math.min(1, Math.max(0, (t - t0) / ms)), e = 1 - Math.pow(1 - p, 3), v = a + (b - a) * e;
    el.textContent = rs(p < 1 ? v : b); if(p < 1) requestAnimationFrame(step); })(t0);
  setTimeout(() => { if(el.isConnected) el.textContent = rs(b); }, ms + 150);
}
function motion(){
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k, b = n(el.dataset.v), first = !(k in seen), a = first ? (k.startsWith('hero') ? 0 : b) : seen[k]; seen[k] = b;
    if(calm || a === b) return; count(el, a, b); if(!first) el.classList.add(b > a ? 'up1' : 'dn1');
  });
}
function draw(fresh){
  status(); if(!D) return; document.body.classList.toggle('enter', !!fresh); $('#v').innerHTML = {live, stats, hist}[tab](); motion();
  document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { per = b.dataset.p; draw(true); });
}
let C = null, busy = false, msg = '';
try { const h = location.hash.slice(1); if(h){ const o = JSON.parse(atob(h.replace(/-/g, '+').replace(/_/g, '/')));
  if(/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(o.u) && o.k) localStorage.setItem('cfg', JSON.stringify({u: o.u, k: o.k})); history.replaceState(null, '', location.pathname); } } catch(e){}
try { C = JSON.parse(localStorage.getItem('cfg')); D = JSON.parse(localStorage.getItem('last')); } catch(e){}
function connect(t, m){ $('#v').innerHTML = `<div class="conn"><h2>${t}</h2><p class="m">${m}</p></div>`; }
async function pull(){
  if(!C){ status(); return connect('Connect this phone', 'Scan the QR code on your laptop with the phone camera and open it in Chrome.'); }
  if(busy) return; busy = true;
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 25000);
  try {
    const j = await (await fetch(C.u, {method: 'POST', body: JSON.stringify({view: C.k}), signal: ac.signal, credentials: 'omit', cache: 'no-store'})).json();
    if(j.error === 'key'){ try { localStorage.removeItem('cfg'); localStorage.removeItem('last'); } catch(e){} C = null; D = null; status(); connect('Not connected', 'This phone’s key is no longer valid. Scan the new QR code on your laptop.'); return; }
    if(!j.ok) throw 0;
    const f = !D, d = {meta: j.meta, live: j.live, curve: j.curve, trades: j.trades}, t = JSON.stringify(d), same = !f && JSON.stringify(D) === t; fail = false;
    if(same) status(); else { D = d; try { localStorage.setItem('last', t); } catch(e){} draw(f); }
  } catch(e){ fail = true; status(); } finally { clearTimeout(tm); busy = false; }
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => { tab = b.dataset.t; document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b)); draw(true); scrollTo(0, 0); });
if(D) draw(true); pull(); setInterval(() => { if(!document.hidden) pull(); }, 30000); document.addEventListener('visibilitychange', () => { if(!document.hidden) pull(); });
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
