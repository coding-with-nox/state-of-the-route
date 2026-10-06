// E2E con rete simulata (Playwright page.route): nessuna chiamata reale.
// Uso: npm run build && node test/e2e/run.mjs   (apre dist/index.html via file://)
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_MODULE || '/opt/npm-tools/node_modules/playwright');
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '../..');
const PAGE = pathToFileURL(resolve(ROOT, 'dist/index.html')).href;
if (!existsSync(resolve(ROOT, 'dist/index.html'))) { console.error('dist/index.html mancante: esegui npm run build'); process.exit(2); }

const CORS = { 'access-control-allow-origin': '*' };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const TILEJSON = { tilejson: '3.0.0', tiles: ['https://tiles.openfreemap.org/planet/20260101_000000_pt/{z}/{x}/{y}.pbf'], minzoom: 0, maxzoom: 14, vector_layers: [] };

const enc6 = (pts) => { let la = 0, lo = 0, out = ''; const e = (v) => { v = v < 0 ? ~(v << 1) : v << 1; let s = ''; while (v >= 32) { s += String.fromCharCode((32 | (v & 31)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); };
  for (const [x, y] of pts) { const a = Math.round(y * 1e6), b = Math.round(x * 1e6); out += e(a - la) + e(b - lo); la = a; lo = b; } return out; };
const line = (a, b, n = 20) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n + Math.sin(i / n * 6) * 0.004, a[1] + (b[1] - a[1]) * i / n]);

/* cfg: host -> 'ok' | numero HTTP | 'abort'. Default tutto ok. */
async function installMocks(ctx, cfg, hits) {
  const mode = (k) => cfg[k] ?? 'ok';
  const gate = (k, r, okFn) => { hits[k] = (hits[k] || 0) + 1; const m = mode(k);
    if (m === 'abort') return r.abort();
    if (typeof m === 'number') return r.fulfill({ status: m, headers: CORS, body: 'err' });
    return okFn(); };
  const json = (r, o) => r.fulfill({ headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(o) });
  await ctx.route(/^https?:/, (r) => { hits.UNMOCKED = (hits.UNMOCKED || []).concat(new URL(r.request().url()).host); return r.abort(); });   /* rete reale mai raggiunta */
  return Promise.all([
    ctx.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|cdn\.jsdelivr|cdnjs/, (r) => r.abort()),
    ctx.route(/rainviewer/, (r) => r.abort()),
    ctx.route(/tiles\.openfreemap\.org/, (r) => gate('ofm', r, () => {
      const u = r.request().url();
      if (/\/planet$/.test(u)) return json(r, TILEJSON);
      return r.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/x-protobuf' }, body: '' }); })),
    ctx.route(/tile\.openstreetmap\.org/, (r) => gate('osmtile', r, () => r.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'image/png' }, body: PNG }))),
    ctx.route(/photon\.komoot\.io/, (r) => gate('photon', r, () => {
      if (/reverse/.test(r.request().url())) return json(r, { features: [{ geometry: { coordinates: [11.47, 43.62] }, properties: { name: 'Via Prova', city: 'Figline' } }] });
      return json(r, { features: [{ geometry: { coordinates: [11.4696, 43.6197] }, properties: { name: 'Figline Valdarno', country: 'Italia' } }] }); })),
    ctx.route(/nominatim\.openstreetmap\.org/, (r) => gate('nominatim', r, () => {
      if (/reverse/.test(r.request().url())) return json(r, { display_name: 'Via Nominatim, Figline, Toscana' });
      return json(r, [{ display_name: 'Figline Valdarno, Firenze, Toscana, Italia', lat: '43.6197', lon: '11.4696' }]); })),
    ctx.route(/routing\.openstreetmap\.de/, (r) => gate('osrm', r, () => {
      const m = decodeURIComponent(r.request().url()).match(/driving\/([^;]+);([^?]+)/); const a = m[1].split(',').map(Number), b = m[2].split(',').map(Number);
      const c = line(a, b);
      return json(r, { code: 'Ok', routes: [{ distance: 15000, duration: 3000, geometry: { type: 'LineString', coordinates: c }, legs: [{ steps: [
        { name: 'Via Roma', distance: 800, maneuver: { type: 'depart', location: c[0] } }, { name: 'Via Dante', distance: 1200, maneuver: { type: 'turn', modifier: 'left', location: c[5] } }, { name: '', distance: 0, maneuver: { type: 'arrive', location: c.at(-1) } }] }] }] }); })),
    ctx.route(/valhalla1\.openstreetmap\.de/, (r) => gate('valhalla', r, () => {
      const body = JSON.parse(new URL(r.request().url()).searchParams.get('json')); const [p, q] = body.locations;
      const c = line([p.lon, p.lat], [q.lon, q.lat]);
      return json(r, { trip: { summary: { length: 15, time: 3000 }, legs: [{ shape: enc6(c), maneuvers: [
        { type: 1, begin_shape_index: 0, length: 5, street_names: ['Via Valhalla'] }, { type: 15, begin_shape_index: 8, length: 10, street_names: ['Via Dante'] }, { type: 4, begin_shape_index: c.length - 1, length: 0 }] }] } }); })),
    ctx.route(/router\.project-osrm\.org/, (r) => gate('osrmdemo', r, () => json(r, { code: 'NoRoute' }))),
    ctx.route(/api\.open-meteo\.com/, (r) => gate('meteo', r, () => {
      const u = new URL(r.request().url()); const la = u.searchParams.get('latitude').split(','); const days = +u.searchParams.get('forecast_days') || 1; const ens = u.searchParams.get('models'); const mini = u.searchParams.has('minutely_15');
      const t0 = Math.floor(Date.now() / 86400000) * 86400, N = days * 24, time = Array.from({ length: N }, (_, i) => t0 + i * 3600);
      const mk = () => { const pr = time.map((t, k) => { const h = (t - t0) / 3600; return h >= 31 && h <= 33 ? 2.5 : (k % 29 === 0 ? 0.4 : 0); });
        const o = { timezone: 'Europe/Rome', utc_offset_seconds: 7200, hourly: { time } };
        if (ens) { for (const m of ens.split(',')) o.hourly['precipitation_' + m] = pr.map((v, k) => k >= 96 ? null : v); }
        else { Object.assign(o.hourly, { precipitation: pr, precipitation_probability: pr.map((v) => v > 0 ? 80 : 10), wind_speed_10m: pr.map(() => 14), wind_direction_10m: pr.map(() => 200), temperature_2m: pr.map(() => 15) });
          if (mini) { const mt = Array.from({ length: days * 96 }, (_, k) => t0 + k * 900); o.minutely_15 = { time: mt, precipitation: mt.map(() => 0) }; } }
        return o; };
      const out = la.map(mk); return json(r, out.length === 1 ? out[0] : out); })),
    ctx.route(/overpass/, (r) => gate('overpass', r, () => /status/.test(r.request().url())
      ? r.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'text/plain' }, body: 'Connected as: 1\nCurrent time: now\nRate limit: 2\n' })
      : json(r, { elements: [] })))
  ]);
}

const results = []; let failed = 0;
const pass = (n) => { results.push(n); console.log('PASS ' + n); };
const fail = (n, why) => { failed++; console.log('FAIL ' + n + ' -> ' + why); };
const SHOTS = '/tmp/claude-0/shots';   /* screenshot per la revisione visiva, fuori dal repo */
const VPS = { desktop: { viewport: { width: 1280, height: 800 } }, mobile: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } };

async function scenario(label, vp, cfg, fn, opts = {}) {
  const name = `${label} [${vp}]`; const hits = {}; const errors = [];
  const ctx = await browser.newContext({ ...VPS[vp], colorScheme: 'light', permissions: ['clipboard-read', 'clipboard-write'].filter(() => !!opts.clip) });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await installMocks(ctx, cfg, hits);
  if (opts.fallbackMs) await page.addInitScript((ms) => { window.__SOTR_FALLBACK_MS = ms; }, opts.fallbackMs);
  try {
    await page.goto(PAGE + (opts.query || ''));
    await fn(page, hits);
    if (hits.UNMOCKED) throw new Error('richieste non simulate: ' + [...new Set(hits.UNMOCKED)].join(','));
    if (errors.length) throw new Error(errors.join(' | '));   /* (g) nessun pageerror */
    pass(name);
  } catch (e) { fail(name, (e.message || String(e)).split('\n')[0] + (errors.length ? ' | ' + errors.join(' | ') : '')); }
  await ctx.close();
}
const text = (p, sel) => p.locator(sel).first().innerText();
const waitText = (p, sel, re, ms = 15000) => p.waitForFunction(([s, r]) => new RegExp(r).test(document.querySelector(s)?.textContent || ''), [sel, re.source], { timeout: ms }).catch(async () => { throw new Error(`${sel} non contiene ${re}: "${(await p.locator(sel).first().textContent()).slice(0, 160)}"`); });
const routeOk = async (p) => { await p.waitForSelector('#stats:not([hidden])', { state: 'attached', timeout: 20000 }); const d = await p.locator('#sDist').first().textContent();   /* su mobile le statistiche stanno nello sheet esteso: non visibili al peek */ if (!/\d/.test(d)) throw new Error('distanza assente'); const v = await text(p, '#vTitle'); if (/Imposta il tragitto/.test(v)) throw new Error('verdetto assente');
  const ov = await p.evaluate(() => { const m = window.__sotrMap; const ids = m.getStyle().layers.map((l) => l.id); const i = ids.indexOf('route-line'), f = ids.indexOf('sotr-first-label'); return { has: i >= 0, below: f < 0 || i < f, data: !!m.getSource('route') }; });
  if (!ov.has || !ov.below || !ov.data) throw new Error('overlay percorso assente o sopra le etichette: ' + JSON.stringify(ov)); };

let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const vp of ['desktop', 'mobile']) {
    await scenario('a) tutto ok: mappa vettoriale, percorso e verdetto', vp, {}, async (p) => {
      await waitText(p, '#mapStatus', /vettoriale OpenFreeMap/); await routeOk(p); await waitText(p, '#status', /Percorso: OSRM/);
    });
    await scenario('b) tile vettoriali 500 -> raster OSM', vp, { ofm: 500 }, async (p) => {
      await waitText(p, '#mapStatus', /raster OSM/, 20000); await routeOk(p);
    }, { fallbackMs: 1500 });
    await scenario('c) vettoriale e raster 500 -> solo tragitto, percorso ok', vp, { ofm: 500, osmtile: 500 }, async (p) => {
      await waitText(p, '#mapStatus', /solo tragitto/, 25000); await routeOk(p);
      if (!(await p.evaluate(() => !!document.querySelector('#map canvas')))) throw new Error('canvas assente');
    }, { fallbackMs: 1500 });
    await scenario('d) Photon 400 -> Nominatim: suggerimenti', vp, { photon: 400 }, async (p) => {
      if (vp === 'mobile') await p.click('#tbEdit');   /* mobile: il form sta nello sheet; il pulsante Modifica lo apre */
      await p.fill('#inA', 'Figline'); await p.waitForSelector('#sgA button', { timeout: 15000 }); await waitText(p, '#status', /Nominatim/);
    });
    await scenario('e) OSRM 503 -> Valhalla', vp, { osrm: 503 }, async (p, h) => {
      await routeOk(p); await waitText(p, '#status', /Percorso: Valhalla/); if (!h.valhalla) throw new Error('Valhalla non chiamato');
    });
    await scenario('f) Stato servizi: righe ok/ko coerenti', vp, { photon: 400, overpass: 500 }, async (p) => {
      await p.click('#bHealth'); await p.waitForSelector('#hlList .hl-row', { timeout: 20000 }); await waitText(p, '#hlNote', /non raggiungibil|tutto/, 20000);
      const rows = await p.$$eval('#hlList .hl-row', (els) => els.map((e) => ({ t: e.textContent, ok: e.dataset.ok })));
      const find = (re) => rows.find((r) => re.test(r.t)); const need = (re, ok) => { const r = find(re); if (!r) throw new Error('riga mancante ' + re); if (String(ok) !== r.ok || !new RegExp(ok ? 'OK' : 'KO').test(r.t)) throw new Error(`riga ${re} atteso ${ok}: ${r.t}`); };
      need(/Photon/, false); need(/Nominatim/, true); need(/OSRM FOSSGIS/, true); need(/Valhalla/, true); need(/TileJSON/, true); need(/glifi/, true); need(/raster OSM/, true); need(/Open-Meteo/, true); need(/Overpass/, false);
      await p.click('#hlCopy'); const clip = await p.evaluate(() => navigator.clipboard.readText()); const j = JSON.parse(clip); if (!j.date || !j.userAgent || !Array.isArray(j.rows) || j.rows.length < 9) throw new Error('diagnostica copiata incompleta');
    }, { clip: true });
    await scenario('f2) ?diag apre il pannello al caricamento', vp, {}, async (p) => {
      await p.waitForSelector('#healthBox:not([hidden]) #hlList .hl-row', { timeout: 20000 });
    }, { query: '?diag' });
    await scenario('h) tema scuro: setStyle e mappa ancora vettoriale', vp, {}, async (p) => {
      await waitText(p, '#mapStatus', /vettoriale OpenFreeMap/); await routeOk(p); await p.click('#bDark');
      await waitText(p, '#mapStatus', /vettoriale OpenFreeMap/); await p.waitForFunction(() => !!document.querySelector('#bDark[aria-pressed="true"]'));
      const ok = await p.evaluate(() => { const m = window.__sotrMap; return m ? !!m.getLayer('route-line') : true; }); if (!ok) throw new Error('overlay persi dopo cambio tema');
    });

    await scenario('i) sheet mobile: peek -> metà -> pieno (tap, tastiera, trascinamento)', vp, {}, async (p) => {
      await routeOk(p);
      if (vp !== 'mobile') {   /* desktop: pannello laterale 400px, niente sheet */
        const r = await p.evaluate(() => { const b = document.getElementById('panel').getBoundingClientRect(); return { l: b.left, w: b.width, h: b.height, vh: innerHeight, grab: getComputedStyle(document.getElementById('grab')).display }; });
        if (Math.abs(r.w - 400) > 1 || r.l !== 0 || Math.abs(r.h - r.vh) > 1 || r.grab !== 'none') throw new Error('pannello desktop non 400px a sinistra: ' + JSON.stringify(r));
        return; }
      const H = () => p.evaluate(() => ({ s: document.body.dataset.sheet, h: Math.round(document.getElementById('panel').getBoundingClientRect().height), vh: innerHeight }));
      const settle = async (want) => { await p.waitForFunction((w) => document.body.dataset.sheet === w, want); await p.waitForTimeout(450); return H(); };
      const near = (a, b) => Math.abs(a - b) <= 4;
      let r = await H(); if (r.s !== 'peek' || !near(r.h, 140)) throw new Error('peek atteso 140px: ' + JSON.stringify(r));
      const vis = await p.evaluate(() => { const t = document.getElementById('vTitle').getBoundingClientRect(), pn = document.getElementById('panel').getBoundingClientRect(); const mb = document.querySelectorAll('#miniBars span').length; return { top: t.top >= pn.top, bottom: t.bottom <= pn.bottom, mini: mb }; });
      if (!vis.top || !vis.bottom || vis.mini < 3) throw new Error('verdetto/mini-barre non visibili nel peek: ' + JSON.stringify(vis));
      await p.click('#grab'); r = await settle('mid'); if (!near(r.h, r.vh * 0.5)) throw new Error('metà atteso 50vh: ' + JSON.stringify(r));
      if (!(await p.locator('#bars .bar').first().isVisible())) throw new Error('barre orarie non visibili a metà');
      await p.click('#grab'); r = await settle('full'); if (!near(r.h, r.vh * 0.88)) throw new Error('pieno atteso 88vh: ' + JSON.stringify(r));
      if (!(await p.locator('#inA').isVisible())) throw new Error('form non visibile a sheet pieno');
      await p.click('#grab'); r = await settle('peek'); if (!near(r.h, 140)) throw new Error('ritorno al peek fallito: ' + JSON.stringify(r));
      await p.focus('#grab'); await p.keyboard.press('Enter'); r = await settle('mid');   /* tastiera */
      await p.keyboard.press('Enter'); await settle('full'); await p.keyboard.press('Enter'); await settle('peek');
      const box = await p.locator('#grab').boundingBox(); const x = box.x + box.width / 2, y = box.y + box.height / 2;   /* trascinamento verso l'alto: snap a metà o pieno */
      await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x, y - 120, { steps: 6 }); await p.mouse.move(x, y - 300, { steps: 6 }); await p.mouse.up();
      await p.waitForTimeout(500); r = await H(); if (r.s === 'peek' || r.h < 300) throw new Error('trascinamento verso l\'alto senza effetto: ' + JSON.stringify(r));
      const down = r.s; const b2 = await p.locator('#grab').boundingBox(); const x2 = b2.x + b2.width / 2, y2 = b2.y + b2.height / 2;   /* e verso il basso */
      await p.mouse.move(x2, y2); await p.mouse.down(); await p.mouse.move(x2, y2 + 200, { steps: 6 }); await p.mouse.move(x2, y2 + 500, { steps: 6 }); await p.mouse.up();
      await p.waitForTimeout(500); r = await H(); if (r.s !== 'peek' && !(down === 'full' && r.s === 'mid')) throw new Error('trascinamento verso il basso senza effetto: ' + JSON.stringify(r));
    });
    await scenario('j) bottone ciclabili: visibilità layer e persistenza al cambio tema', vp, {}, async (p) => {
      await waitText(p, '#mapStatus', /vettoriale OpenFreeMap/); await routeOk(p);
      const vis = () => p.evaluate(() => { const m = window.__sotrMap, ids = ['sotr-bike-lane', 'sotr-bike-lane-casing', 'sotr-bike-soft']; return ids.map((i) => (m.getLayer(i) ? (m.getLayoutProperty(i, 'visibility') || 'visible') : 'assente')); });
      const want = async (v, why) => { const t0 = Date.now(); let got; while (Date.now() - t0 < 8000) { got = await vis(); if (got.every((x) => x === v)) return; await p.waitForTimeout(150); } throw new Error(why + ': atteso ' + v + ' ottenuto ' + JSON.stringify(got)); };
      await want('visible', 'stato iniziale');
      if ((await p.getAttribute('#bBike', 'aria-pressed')) !== 'true') throw new Error('aria-pressed iniziale');
      await p.click('#bBike'); await want('none', 'dopo il click'); if ((await p.getAttribute('#bBike', 'aria-pressed')) !== 'false') throw new Error('aria-pressed dopo il click');
      await p.click('#bDark'); await p.waitForFunction(() => document.documentElement.dataset.theme === 'dark'); await waitText(p, '#mapStatus', /vettoriale OpenFreeMap/);
      await want('none', 'dopo il cambio tema (stato perso)');
      await p.click('#bDark'); await p.waitForFunction(() => document.documentElement.dataset.theme === 'light'); await want('none', 'dopo il ritorno al tema chiaro');
      await p.click('#bBike'); await want('visible', 'riattivazione');
    });
    await scenario('k) niente scroll orizzontale, target >=44px, nessun pageerror', vp, {}, async (p) => {
      await routeOk(p);
      const check = async (tag) => { const r = await p.evaluate(() => { const W = innerWidth, bad = [];
          const over = (el) => { if (el.closest('.bars,.chips,.when-chips')) return; const b = el.getBoundingClientRect(); if (b.width && getComputedStyle(el).visibility !== 'hidden' && (b.right > W + 0.5 || b.left < -0.5)) bad.push((el.id || el.className || el.tagName) + ' x=' + Math.round(b.left) + '..' + Math.round(b.right)); };
          document.querySelectorAll('#panel *, #topbar *, .mapctl *, #mapStatus, #trip, #trip *').forEach(over);
          const sw = [document.documentElement, document.body, document.getElementById('panel'), document.getElementById('sheetBody')].map((e) => e.scrollWidth - e.clientWidth);
          const small = [...document.querySelectorAll('.tb-ib,.wchip,.mc,.btn,.chip,.sh-chip,.seg button,.bar')].filter((b) => { const q = b.getBoundingClientRect(); return q.width && getComputedStyle(b).visibility !== 'hidden' && getComputedStyle(b).display !== 'none' && (q.height < 43.5 || (q.width < 43.5)); }).map((b) => (b.id || b.className) + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height));
          return { bad, sw, small, W }; });
        if (r.bad.length) throw new Error(tag + ': elementi fuori schermo ' + r.bad.slice(0, 4).join('; '));
        if (r.sw.some((x) => x > 1)) throw new Error(tag + ': scroll orizzontale ' + JSON.stringify(r.sw));
        if (r.small.length) throw new Error(tag + ': target < 44px: ' + r.small.slice(0, 4).join('; ')); };
      await check('peek');
      if (vp === 'mobile') { for (const st of ['mid', 'full']) { await p.click('#grab'); await p.waitForFunction((w) => document.body.dataset.sheet === w, st); await p.waitForTimeout(450); await check(st); }
        const w = await p.evaluate(() => innerWidth); if (w !== 390) throw new Error('viewport mobile non 390: ' + w); }
    });
    await scenario('l) screenshot (mobile peek/metà/pieno/servizi/scuro, desktop)', vp, {}, async (p) => {
      mkdirSync(SHOTS, { recursive: true }); await waitText(p, '#mapStatus', /vettoriale OpenFreeMap/); await routeOk(p); await p.waitForTimeout(1200);
      await p.screenshot({ path: `${SHOTS}/${vp}-1-chiaro${vp === 'mobile' ? '-peek' : ''}.png` });
      if (vp === 'mobile') { for (const st of ['mid', 'full']) { await p.click('#grab'); await p.waitForFunction((w) => document.body.dataset.sheet === w, st); await p.waitForTimeout(500); await p.screenshot({ path: `${SHOTS}/mobile-2-${st}.png` }); }
        await p.click('#grab'); await p.waitForTimeout(500); }
      await p.click('#bHealth'); await p.waitForSelector('#hlList .hl-row', { timeout: 20000 }); await waitText(p, '#hlNote', /tutto|non raggiungibil/); await p.screenshot({ path: `${SHOTS}/${vp}-3-servizi.png` }); await p.click('#hlBack');
      await p.click('#bDark'); await p.waitForFunction(() => document.documentElement.dataset.theme === 'dark'); await p.waitForTimeout(800); await p.screenshot({ path: `${SHOTS}/${vp}-4-scuro.png` });
    });
  }
} catch (e) { failed++; console.log('FAIL harness -> ' + e.message); }
finally { await browser?.close(); }
console.log(`\n${results.length} PASS, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
