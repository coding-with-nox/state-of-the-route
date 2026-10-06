/* providers.js - geocoding / reverse / routing resilienti per "State of the Route".
   File puro (niente DOM/window), senza import/export: inlinabile in <script type="module"> e usabile da node.
   Solo servizi open source: Photon, Nominatim, OSRM (FOSSGIS + demo), Valhalla (FOSSGIS). */

const SOTR_PV_PREFIX = 'sotr.pv.';

/* ---- label indirizzi (copiata da index.html: fmtFeat) ---- */
const sotrFmtFeat = f => { const p = f.properties || {};
  return [p.name, p.street && (p.street + (p.housenumber ? ' ' + p.housenumber : '')), p.city || p.town || p.village, p.country && p.country !== 'Italia' ? p.country : null]
    .filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(', '); };

/* ---- testo passi (copiata da index.html: stepText) ---- */
function sotrStepText(s) {
  const m = s.modifier || '', n = s.name ? ` su ${s.name}` : '', side = /left/.test(m) ? 'sinistra' : 'destra';
  const TURN = { left: 'Gira a sinistra', right: 'Gira a destra', 'slight left': 'Svolta leggermente a sinistra', 'slight right': 'Svolta leggermente a destra', 'sharp left': 'Svolta decisamente a sinistra', 'sharp right': 'Svolta decisamente a destra', straight: 'Prosegui dritto', uturn: 'Fai inversione' };
  switch (s.type) {
    case 'depart': return s.name ? `Parti su ${s.name}` : 'Parti';
    case 'arrive': return 'Sei arrivato';
    case 'turn': return (TURN[m] || 'Prosegui') + n;
    case 'new name': case 'continue': return (TURN[m] && m !== 'straight' ? TURN[m] : 'Prosegui') + n;
    case 'merge': return 'Immettiti' + n;
    case 'fork': return (/left|right/.test(m) ? `Al bivio tieni la ${side}` : 'Al bivio prosegui') + n;
    case 'end of road': return `Alla fine della strada gira a ${side}` + n;
    case 'roundabout': case 'rotary': case 'roundabout turn': return (s.exit ? `Alla rotonda prendi la ${s.exit}ª uscita` : 'Alla rotonda prosegui') + n;
    case 'on ramp': return 'Imbocca la rampa' + n;
    case 'off ramp': return 'Prendi l\'uscita' + n;
    default: return 'Prosegui' + n; }
}

/* ---- decoder polyline (Google/Valhalla); ritorna [[lng,lat],...] ---- */
function sotrDecodePolyline(str, precision) {
  const f = Math.pow(10, precision == null ? 6 : precision), out = [];
  let i = 0, lat = 0, lng = 0;
  const next = () => { let r = 0, sh = 0, b;
    do { if (i >= str.length) throw new Error('polyline troncata'); b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32);
    return (r & 1) ? ~(r >> 1) : (r >> 1); };
  while (i < str.length) { lat += next(); lng += next(); out.push([lng / f, lat / f]); }
  return out;
}

/* ---- mappa tipi manovra Valhalla -> {type, modifier} stile OSRM (poi sotrStepText) ---- */
const SOTR_VH = {
  1: ['depart', ''], 2: ['depart', ''], 3: ['depart', ''],
  4: ['arrive', ''], 5: ['arrive', ''], 6: ['arrive', ''],
  7: ['continue', 'straight'], 8: ['continue', 'straight'], 22: ['continue', 'straight'],
  9: ['turn', 'slight right'], 10: ['turn', 'right'], 11: ['turn', 'sharp right'],
  12: ['turn', 'uturn'], 13: ['turn', 'uturn'],
  14: ['turn', 'sharp left'], 15: ['turn', 'left'], 16: ['turn', 'slight left'],
  17: ['on ramp', 'straight'], 18: ['on ramp', 'right'], 19: ['on ramp', 'left'],
  20: ['off ramp', 'right'], 21: ['off ramp', 'left'],
  23: ['fork', 'right'], 24: ['fork', 'left'],
  25: ['merge', ''], 37: ['merge', 'right'], 38: ['merge', 'left'],
  26: ['roundabout', ''], 27: ['continue', 'straight']
};

function sotrValhallaToRoute(j) {
  if (!j || !j.trip || !Array.isArray(j.trip.legs) || !j.trip.legs.length) throw new Error('no route');
  const coords = [], steps = [];
  for (const lg of j.trip.legs) {
    const pts = sotrDecodePolyline(lg.shape || '', 6);
    /* il primo punto della tratta successiva coincide con l'ultimo della precedente */
    for (let k = coords.length ? 1 : 0; k < pts.length; k++) coords.push(pts[k]);
    for (const mv of lg.maneuvers || []) {
      const idx = (mv.begin_shape_index | 0), pt = pts[idx] || pts[0]; if (!pt) continue;
      const map = SOTR_VH[mv.type], name = (mv.street_names && mv.street_names[0]) || '';
      let type, modifier, text;
      if (map) { type = map[0]; modifier = map[1];
        text = sotrStepText({ type, modifier, name, exit: mv.roundabout_exit_count });
      } else { type = 'notification'; modifier = ''; text = mv.instruction || 'Prosegui'; }
      steps.push({ text, name, dist: (+mv.length || 0) * 1000, lng: pt[0], lat: pt[1], type, modifier });
    }
  }
  const sm = j.trip.summary || {};
  return { coords, steps, distance: (+sm.length || 0) * 1000, duration: +sm.time || 0 };
}

function sotrOsrmToRoute(j) {
  if (j && j.code && j.code !== 'Ok') throw new Error(j.code === 'NoRoute' ? 'no route' : String(j.code));
  const rt = j && j.routes && j.routes[0];
  if (!rt) throw new Error('no route');
  const steps = [];
  for (const lg of rt.legs || []) for (const t of lg.steps || []) {
    const mv = t.maneuver || {}, loc = mv.location || []; if (loc.length < 2) continue;
    steps.push({ text: sotrStepText({ type: mv.type, modifier: mv.modifier, name: t.name, exit: mv.exit }), name: t.name || '', dist: t.distance || 0, lng: loc[0], lat: loc[1], type: mv.type, modifier: mv.modifier || '' });
  }
  return { coords: rt.geometry && rt.geometry.coordinates, steps, distance: +rt.distance || 0, duration: +rt.duration || 0 };
}

function sotrCheckRoute(r) {
  const c = r.coords;
  if (!Array.isArray(c) || c.length < 2) throw new Error('no route');
  for (const p of c) if (!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) throw new Error('geometria non valida');
  return r;
}

function sotrCreateProviders(opts) {
  opts = opts || {};
  const doFetch = opts.fetch || globalThis.fetch;
  const storage = opts.storage || null;
  const now = opts.now || (() => Date.now());
  const TIMEOUT = opts.timeoutMs || 8000, HEDGE = opts.hedgeMs || 2500;
  const BREAK_N = 2, BREAK_MS = 60000, TTL_GEO = 10 * 60000, TTL_ROUTE = 30 * 60000;
  const mem = new Map(), brk = new Map();

  /* ---- cache ---- */
  const clone = v => JSON.parse(JSON.stringify(v));
  const cget = k => { const t = now(), m = mem.get(k);
    if (m && m.exp > t) return clone(m.v);
    if (storage) { try { const raw = storage.getItem(SOTR_PV_PREFIX + k);
      if (raw) { const o = JSON.parse(raw); if (o && o.exp > t) { mem.set(k, o); return clone(o.v); } } } catch (e) { /* storage mai bloccante */ } }
    return undefined; };
  const cset = (k, v, ttl) => { const o = { v: clone(v), exp: now() + ttl }; mem.set(k, o);
    if (storage) { try { storage.setItem(SOTR_PV_PREFIX + k, JSON.stringify(o)); } catch (e) { /* idem */ } } };
  const r5 = x => Number(x).toFixed(5);

  /* ---- circuit breaker ---- */
  const paused = id => { const b = brk.get(id); return !!(b && b.until > now()); };
  const bad = id => { const b = brk.get(id) || { n: 0, until: 0 }; b.n++; if (b.n >= BREAK_N) { b.until = now() + BREAK_MS; b.n = 0; } brk.set(id, b); };
  const good = id => brk.delete(id);

  /* ---- fetch con segnale ---- */
  async function getJson(url, init, signal) {
    const r = await doFetch(url, Object.assign({}, init || {}, { signal }));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    try { return await r.json(); } catch (e) { throw new Error('risposta non valida'); }
  }
  const emptyErr = () => { const e = new Error('no results'); e.empty = true; return e; };

  /* ---- esecuzione "hedged" su una lista di provider ---- */
  function race(list, call, label, allowEmpty) {
    return new Promise((resolve, reject) => {
      let cand = list.filter(p => !paused(p.id)); if (!cand.length) cand = list.slice();
      let next = 0, inflight = 0, done = false, hedgeT = null, empty = null;
      const rsn = {}, ctls = new Set();
      const launch = () => {
        if (done || next >= cand.length) return;
        const p = cand[next++]; inflight++;
        clearTimeout(hedgeT); hedgeT = next < cand.length ? setTimeout(launch, HEDGE) : null;
        const ctl = new AbortController(); ctls.add(ctl); let timedOut = false;
        const tt = setTimeout(() => { timedOut = true; ctl.abort(); }, TIMEOUT);
        Promise.resolve().then(() => call(p, ctl.signal)).then(value => {
          clearTimeout(tt); ctls.delete(ctl); inflight--;
          if (done) return;
          done = true; clearTimeout(hedgeT); good(p.id);
          for (const c of ctls) { try { c.abort(); } catch (e) { /* noop */ } }
          resolve({ p, value });
        }, err => {
          clearTimeout(tt); ctls.delete(ctl); inflight--;
          if (done) return;
          if (err && err.empty) { empty = p; rsn[p.id] = p.id + ' no results'; }
          else { bad(p.id); rsn[p.id] = p.id + ' ' + (timedOut ? 'timeout' : ((err && err.message) || String(err))); }
          if (inflight === 0) {
            if (next < cand.length) launch();
            else { done = true; clearTimeout(hedgeT);
              if (empty && allowEmpty) resolve({ p: empty, value: null });
              else reject(new Error(label + ': ' + cand.map(c => rsn[c.id]).filter(Boolean).join('; '))); }
          }
        });
      };
      launch();
    });
  }

  /* ---- definizione provider ---- */
  const geoOk = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng);
  const GEO = [
    { id: 'photon', label: 'Photon',
      async search(q, bias, sig) {
        const b = bias && geoOk(+bias.lat, +bias.lng) ? `&lat=${bias.lat}&lon=${bias.lng}` : '';
        const j = await getJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6${b}`, null, sig);
        const out = ((j && j.features) || []).map(f => ({ label: sotrFmtFeat(f), lat: +(f.geometry && f.geometry.coordinates[1]), lng: +(f.geometry && f.geometry.coordinates[0]) })).filter(r => geoOk(r.lat, r.lng) && r.label);
        if (!out.length) throw emptyErr(); return out; },
      async rev(lat, lng, sig) {
        const j = await getJson(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, null, sig);
        const f = j && j.features && j.features[0]; const l = f && sotrFmtFeat(f);
        if (!l) throw emptyErr(); return l; } },
    { id: 'nominatim', label: 'Nominatim',
      async search(q, bias, sig) {
        const j = await getJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=it&q=${encodeURIComponent(q)}`, null, sig);
        if (!Array.isArray(j)) throw new Error('risposta non valida');
        const out = j.map(r => ({ label: String(r.display_name || '').split(', ').slice(0, 3).join(', '), lat: +r.lat, lng: +r.lon })).filter(r => geoOk(r.lat, r.lng) && r.label);
        if (!out.length) throw emptyErr(); return out; },
      async rev(lat, lng, sig) {
        const j = await getJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=it&lat=${lat}&lon=${lng}`, null, sig);
        if (!j || !j.display_name) throw emptyErr();
        return String(j.display_name).split(', ').slice(0, 3).join(', '); } }
  ];

  const osrm = (id, label, base, tag) => ({ id, label, tag,
    async route(a, b, sig) {
      const q = `${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=true`;
      return sotrCheckRoute(sotrOsrmToRoute(await getJson(base + q, null, sig))); } });
  const ROUTE = [
    osrm('osrm-fossgis', 'OSRM FOSSGIS (bici)', 'https://routing.openstreetmap.de/routed-bike/route/v1/driving/'),
    { id: 'valhalla', label: 'Valhalla FOSSGIS (bici)',
      async route(a, b, sig) {
        const body = JSON.stringify({ locations: [{ lat: a.lat, lon: a.lng }, { lat: b.lat, lon: b.lng }], costing: 'bicycle', directions_options: { language: 'it-IT' } });
        const j = await getJson('https://valhalla1.openstreetmap.de/route?json=' + encodeURIComponent(body), null, sig);   /* GET: niente preflight CORS */
        return sotrCheckRoute(sotrValhallaToRoute(j)); } },
    osrm('osrm-demo', 'osrm-demo (profilo auto)', 'https://router.project-osrm.org/route/v1/bike/')
  ];

  /* ---- API ---- */
  async function geocode(q, bias) {
    q = String(q || '').trim();
    const bk = bias && geoOk(+bias.lat, +bias.lng) ? r5(bias.lat) + ',' + r5(bias.lng) : '-';
    const key = 'g|' + q.toLowerCase() + '|' + bk, hit = cget(key); if (hit) return hit;
    const { p, value } = await race(GEO, (pr, sig) => pr.search(q, bias, sig), 'geocode', true);
    const res = { provider: p.label, results: value || [] };
    if (res.results.length) cset(key, res, TTL_GEO);
    return res;
  }
  async function reverse(lat, lng) {
    try {
      const key = 'r|' + r5(lat) + '|' + r5(lng), hit = cget(key); if (hit) return hit;
      const { p, value } = await race(GEO, (pr, sig) => pr.rev(lat, lng, sig), 'reverse', true);
      if (!value) return null;
      const res = { provider: p.label, label: value }; cset(key, res, TTL_GEO); return res;
    } catch (e) { return null; }
  }
  async function route(a, b) {
    const key = 'p|' + r5(a.lat) + ',' + r5(a.lng) + '|' + r5(b.lat) + ',' + r5(b.lng), hit = cget(key); if (hit) return hit;
    const { p, value } = await race(ROUTE, (pr, sig) => pr.route(a, b, sig), 'route', false);
    const res = Object.assign({ provider: p.label }, value); cset(key, res, TTL_ROUTE); return res;
  }
  async function health() {
    const A = { lat: 43.6188, lng: 11.4733 }, B = { lat: 43.5224, lng: 11.5667 };
    const probe = async (id, kind, fn) => {
      const t0 = now(), ctl = new AbortController(); let timedOut = false;
      const tt = setTimeout(() => { timedOut = true; ctl.abort(); }, TIMEOUT);
      try { await fn(ctl.signal); return { name: id, kind, ok: true, ms: now() - t0 }; }
      catch (e) { return { name: id, kind, ok: false, ms: now() - t0, error: timedOut ? 'timeout' : ((e && e.message) || String(e)) }; }
      finally { clearTimeout(tt); }
    };
    try {
      return await Promise.all([
        ...GEO.map(p => probe(p.id, 'geocode', s => p.search('Firenze', null, s))),
        ...ROUTE.map(p => probe(p.id, 'route', s => p.route(A, B, s)))
      ]);
    } catch (e) { return []; }
  }
  return { geocode, reverse, route, health };
}

if (typeof module !== 'undefined') module.exports = { sotrCreateProviders, sotrDecodePolyline, sotrStepText, sotrFmtFeat, sotrValhallaToRoute, sotrOsrmToRoute };
