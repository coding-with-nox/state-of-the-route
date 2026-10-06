import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { sotrCreateProviders, sotrDecodePolyline, sotrStepText } = createRequire(import.meta.url)('../src/providers.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const A = { lat: 43.6188, lng: 11.4733 }, B = { lat: 43.5224, lng: 11.5667 };
const OSRM_OK = { code: 'Ok', routes: [{ distance: 1000, duration: 300, geometry: { coordinates: [[11.47, 43.61], [11.48, 43.6]] },
  legs: [{ steps: [{ name: 'Via Roma', distance: 500, maneuver: { type: 'depart', location: [11.47, 43.61] } },
    { name: '', distance: 500, maneuver: { type: 'turn', modifier: 'left', location: [11.48, 43.6] } }] }] }] };
const enc = (pts, prec = 6) => { let la = 0, lo = 0, s = ''; const f = 10 ** prec;
  const e = v => { v = v < 0 ? ~(v << 1) : v << 1; let o = ''; while (v >= 32) { o += String.fromCharCode((32 | (v & 31)) + 63); v >>= 5; } return o + String.fromCharCode(v + 63); };
  for (const [lng, lat] of pts) { const a = Math.round(lat * f), b = Math.round(lng * f); s += e(a - la) + e(b - lo); la = a; lo = b; } return s; };
const VH_OK = { trip: { summary: { length: 1.2, time: 400 }, legs: [{ shape: enc([[11.47, 43.61], [11.48, 43.6], [11.49, 43.59]]),
  maneuvers: [{ type: 1, begin_shape_index: 0, length: 0.6, street_names: ['Via Roma'], instruction: 'Vai' }, { type: 15, begin_shape_index: 1, length: 0.6, instruction: 'Gira' }, { type: 4, begin_shape_index: 2, length: 0 }] }] } };
const json = (b, status = 200) => ({ ok: status < 400, status, json: async () => b });

/* fetch simulato: handlers per sottostringa dell'URL; ogni handler (url, init) -> risposta | Promise; onora signal */
function mkFetch(handlers) {
  const calls = [];
  const f = (url, init = {}) => { calls.push(url);
    const h = handlers.find(([k]) => url.includes(k)); if (!h) return Promise.reject(new Error('unmocked ' + url));
    return new Promise((res, rej) => {
      const sig = init.signal; const ab = () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      if (sig) { if (sig.aborted) return ab(); sig.addEventListener('abort', ab); }
      Promise.resolve().then(() => h[1](url, init)).then(res, rej); }); };
  f.calls = calls; return f;
}
const slow = (ms, v) => async () => { await sleep(ms); return v; };
const FAST = { hedgeMs: 40, timeoutMs: 300 };
const ROUTES = (o = {}) => [
  ['routing.openstreetmap.de', o.fossgis || (() => json(OSRM_OK))],
  ['valhalla1', o.valhalla || (() => json(VH_OK))],
  ['router.project-osrm.org', o.demo || (() => json(OSRM_OK))]];

test('route: primo provider ok, forma dei dati', async () => {
  const f = mkFetch(ROUTES()); const P = sotrCreateProviders({ fetch: f, ...FAST });
  const r = await P.route(A, B);
  assert.equal(r.provider, 'OSRM FOSSGIS (bici)'); assert.equal(r.distance, 1000); assert.equal(r.duration, 300);
  assert.deepEqual(r.coords, OSRM_OK.routes[0].geometry.coordinates);
  assert.deepEqual(r.steps[0], { text: 'Parti su Via Roma', name: 'Via Roma', dist: 500, lng: 11.47, lat: 43.61, type: 'depart', modifier: '' });
  assert.deepEqual(Object.keys(r.steps[1]), ['text', 'name', 'dist', 'lng', 'lat', 'type', 'modifier']);
  assert.equal(r.steps[1].text, 'Gira a sinistra');
  assert.equal(f.calls.length, 1); assert.ok(f.calls[0].includes('11.4733,43.6188;11.5667,43.5224'));
});

test('route: primo 500 -> secondo (Valhalla), steps mappati in italiano', async () => {
  const f = mkFetch(ROUTES({ fossgis: () => json({}, 503) })); const P = sotrCreateProviders({ fetch: f, ...FAST });
  const r = await P.route(A, B);
  assert.equal(r.provider, 'Valhalla FOSSGIS (bici)');
  assert.equal(r.coords.length, 3); assert.equal(r.distance, 1200); assert.equal(r.duration, 400);
  const vu = f.calls.find(u => u.includes('valhalla1')); assert.ok(vu.startsWith('https://valhalla1.openstreetmap.de/route?json='));
  assert.deepEqual(JSON.parse(decodeURIComponent(vu.split('json=')[1])), { locations: [{ lat: A.lat, lon: A.lng }, { lat: B.lat, lon: B.lng }], costing: 'bicycle', directions_options: { language: 'it-IT' } });
  assert.deepEqual(r.steps.map(s => s.text), ['Parti su Via Roma', 'Gira a sinistra', 'Sei arrivato']);
  assert.deepEqual(r.steps[1], { text: 'Gira a sinistra', name: '', dist: 600, lng: 11.48, lat: 43.6, type: 'turn', modifier: 'left' });
});

test('route: primo lento -> hedging, vince il secondo e il primo viene abortito', async () => {
  let aborted = false;
  const f = mkFetch(ROUTES({ fossgis: slow(250, json(OSRM_OK)) }));
  const wrapped = (u, i) => { if (u.includes('openstreetmap.de/routed')) i.signal.addEventListener('abort', () => { aborted = true; }); return f(u, i); };
  wrapped.calls = f.calls;
  const P = sotrCreateProviders({ fetch: wrapped, ...FAST });
  const t0 = Date.now(); const r = await P.route(A, B);
  assert.equal(r.provider, 'Valhalla FOSSGIS (bici)'); assert.ok(Date.now() - t0 < 200);
  assert.ok(aborted);
});

test('route: tutti falliscono -> messaggio con tutti i motivi', async () => {
  const f = mkFetch(ROUTES({ fossgis: () => json({}, 503), valhalla: slow(1000, json({})), demo: () => json({ code: 'NoRoute' }) }));
  const P = sotrCreateProviders({ fetch: f, ...FAST });
  await assert.rejects(P.route(A, B), e => { assert.equal(e.message, 'route: osrm-fossgis HTTP 503; valhalla timeout; osrm-demo no route'); return true; });
});

test('route: osrm-demo segnala profilo auto; geometria invalida = fallimento', async () => {
  const bad = { code: 'Ok', routes: [{ geometry: { coordinates: [[1, 2]] }, legs: [] }] };
  const f = mkFetch(ROUTES({ fossgis: () => json(bad), valhalla: () => json({ error: 'x' }, 400) }));
  const r = await sotrCreateProviders({ fetch: f, ...FAST }).route(A, B);
  assert.equal(r.provider, 'osrm-demo (profilo auto)');
});

test('circuit breaker: 2 fallimenti -> salto 60 s -> ritorno', async () => {
  let t = 1000, fossFail = true; const f = mkFetch(ROUTES({ fossgis: () => fossFail ? json({}, 500) : json(OSRM_OK) }));
  const P = sotrCreateProviders({ fetch: f, now: () => t, ...FAST });
  await P.route(A, B); await P.route({ lat: 1, lng: 1 }, B);
  const n = () => f.calls.filter(u => u.includes('routed-bike')).length;
  assert.equal(n(), 2);
  await P.route({ lat: 2, lng: 2 }, B); assert.equal(n(), 2, 'saltato');
  t += 61000; fossFail = false;
  const r = await P.route({ lat: 3, lng: 3 }, B); assert.equal(n(), 3); assert.equal(r.provider, 'OSRM FOSSGIS (bici)');
});

test('circuit breaker: se tutti in pausa si riprova', async () => {
  let t = 0, fail = true; const bad = () => fail ? json({}, 500) : json(OSRM_OK);
  const f = mkFetch(ROUTES({ fossgis: bad, valhalla: bad, demo: bad }));
  const P = sotrCreateProviders({ fetch: f, now: () => t, ...FAST });
  await assert.rejects(P.route(A, B)); await assert.rejects(P.route(A, B));
  fail = false; const r = await P.route(A, B); assert.ok(r.coords.length >= 2);
});

test('cache: hit senza nuova fetch (memoria e storage, TTL)', async () => {
  let t = 0; const store = {}; const storage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  const f = mkFetch(ROUTES()); const P = sotrCreateProviders({ fetch: f, now: () => t, storage, ...FAST });
  await P.route(A, B); await P.route({ lat: A.lat + 1e-7, lng: A.lng }, B); assert.equal(f.calls.length, 1);
  const P2 = sotrCreateProviders({ fetch: f, now: () => t, storage, ...FAST });
  await P2.route(A, B); assert.equal(f.calls.length, 1, 'da storage');
  t += 31 * 60000; await P2.route(A, B); assert.equal(f.calls.length, 2, 'TTL scaduto');
});

test('storage che lancia non rompe nulla', async () => {
  const storage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('y'); } };
  const r = await sotrCreateProviders({ fetch: mkFetch(ROUTES()), storage, ...FAST }).route(A, B);
  assert.ok(r.coords.length === 2);
});

test('decoder polyline: vettore noto (precisione 5) e round-trip precisione 6', () => {
  assert.deepEqual(sotrDecodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5), [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]);
  const pts = [[11.4733, 43.6188], [11.5667, 43.5224], [-0.1278, 51.5074]];
  assert.deepEqual(sotrDecodePolyline(enc(pts), 6), pts);
});

const PH = { features: [{ geometry: { coordinates: [11.25, 43.77] }, properties: { name: 'Firenze', city: 'Firenze', country: 'Italia' } }, { geometry: { coordinates: [11.3, 43.8] }, properties: { name: 'Via X', street: 'Via X', housenumber: '3', city: 'Fiesole', country: 'Italia' } }] };
const NOM = [{ display_name: 'Firenze, Toscana, Italia, Europa', lat: '43.77', lon: '11.25' }];

test('geocode: Photon ok, label fmtFeat, bias, niente lang', async () => {
  const f = mkFetch([['photon', () => json(PH)], ['nominatim', () => json(NOM)]]);
  const g = await sotrCreateProviders({ fetch: f, ...FAST }).geocode('Firenze', { lat: 43.7, lng: 11.2 });
  assert.equal(g.provider, 'Photon'); assert.deepEqual(g.results, [{ label: 'Firenze', lat: 43.77, lng: 11.25 }, { label: 'Via X 3, Fiesole', lat: 43.8, lng: 11.3 }].map((r, i) => i ? { ...r, label: 'Via X, Via X 3, Fiesole' } : r));
  assert.ok(f.calls[0].includes('&limit=6&lat=43.7&lon=11.2')); assert.ok(!f.calls[0].includes('lang'));
});

test('geocode: Photon vuoto -> Nominatim; entrambi vuoti -> results []', async () => {
  let f = mkFetch([['photon', () => json({ features: [] })], ['nominatim', () => json(NOM)]]);
  const g = await sotrCreateProviders({ fetch: f, ...FAST }).geocode('Firenze', null);
  assert.equal(g.provider, 'Nominatim'); assert.deepEqual(g.results, [{ label: 'Firenze, Toscana, Italia', lat: 43.77, lng: 11.25 }]);
  assert.ok(f.calls[1].includes('accept-language=it'));
  f = mkFetch([['photon', () => json({ features: [] })], ['nominatim', () => json([])]]);
  assert.deepEqual((await sotrCreateProviders({ fetch: f, ...FAST }).geocode('zzz')).results, []);
});

test('geocode: tutti ko -> errore con motivi; cache hit', async () => {
  const f = mkFetch([['photon', () => json({}, 400)], ['nominatim', () => json({}, 429)]]);
  await assert.rejects(sotrCreateProviders({ fetch: f, ...FAST }).geocode('x'), /geocode: photon HTTP 400; nominatim HTTP 429/);
  const f2 = mkFetch([['photon', () => json(PH)]]); const P = sotrCreateProviders({ fetch: f2, ...FAST });
  await P.geocode('Firenze'); await P.geocode(' firenze '); assert.equal(f2.calls.length, 1);
});

test('reverse: Photon poi Nominatim, null se tutto fallisce', async () => {
  let f = mkFetch([['photon', () => json({}, 500)], ['nominatim', () => json({ display_name: 'Via A, Figline, Firenze, Italia' })]]);
  assert.deepEqual(await sotrCreateProviders({ fetch: f, ...FAST }).reverse(43.6, 11.4), { provider: 'Nominatim', label: 'Via A, Figline, Firenze' });
  f = mkFetch([['photon', () => json({}, 500)], ['nominatim', () => json({}, 500)]]);
  assert.equal(await sotrCreateProviders({ fetch: f, ...FAST }).reverse(43.6, 11.4), null);
});

test('health: non lancia mai, ok/ko per provider', async () => {
  const f = mkFetch([['photon', () => json(PH)], ['nominatim', () => { throw new Error('boom'); }],
    ['routing.openstreetmap.de', () => json(OSRM_OK)], ['valhalla1', slow(1000, json(VH_OK))], ['router.project-osrm.org', () => json({}, 502)]]);
  const h = await sotrCreateProviders({ fetch: f, ...FAST }).health();
  const by = Object.fromEntries(h.map(x => [x.name, x]));
  assert.equal(h.length, 5); assert.equal(by.photon.kind, 'geocode'); assert.equal(by['osrm-fossgis'].kind, 'route');
  assert.ok(by.photon.ok && by['osrm-fossgis'].ok && typeof by.photon.ms === 'number');
  assert.deepEqual([by.nominatim.ok, by.nominatim.error], [false, 'boom']);
  assert.deepEqual([by.valhalla.ok, by.valhalla.error], [false, 'timeout']);
  assert.equal(by['osrm-demo'].error, 'HTTP 502');
  const P = sotrCreateProviders({ fetch: () => { throw new Error('no net'); }, ...FAST });
  assert.equal((await P.health()).every(x => !x.ok), true);
});

test('stepText: identico a quello esistente su casi chiave', () => {
  assert.equal(sotrStepText({ type: 'roundabout', exit: 2, name: 'Via A' }), 'Alla rotonda prendi la 2ª uscita su Via A');
  assert.equal(sotrStepText({ type: 'fork', modifier: 'slight left' }), 'Al bivio tieni la sinistra');
});
