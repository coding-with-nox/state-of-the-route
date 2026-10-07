/* State of the Route - stile mappa proprio (schema OpenMapTiles su tile OpenFreeMap).
   File puro: nessun DOM/window, nessun import/export. Funziona inlined in <script type="module"> e in node. */

const SOTR_PALETTE_LIGHT = {
  bg: '#f2efe9', water: '#a8d3f0', waterLine: '#8fc4ea', wood: '#cfe6b8', grass: '#dcedc8', park: '#c5e3ad',
  sand: '#f1e8c8', ice: '#eef6fa', residential: '#ebe7df', industrial: '#e4e2dc', hospital: '#f6dcdc', school: '#efe6d2',
  building: '#dcd6cc', buildingLine: '#cbc4b8',
  roadFill: '#ffffff', roadCasing: '#b9b5ad', minorFill: '#ffffff', minorCasing: '#c9c5bd',
  secondaryFill: '#fff3c4', secondaryCasing: '#d9c37a', primaryFill: '#ffd983', primaryCasing: '#d9a441',
  motorwayFill: '#f9a95c', motorwayCasing: '#c9772a', pathFill: '#9a9488', rail: '#8a8f98', railTie: '#ffffff',
  aeroway: '#dcdad4', boundary: '#8e7f9f',
  bike: '#0b9a4f', bikeCasing: '#ffffff', bikeSoft: '#4cc27e',
  text: '#3c4043', textHalo: '#ffffff', textWater: '#3b78a8', textPark: '#3d7a3a', textMuted: '#6b6f73', textPoi: '#1a73a8'
};
const SOTR_PALETTE_DARK = {
  bg: '#1b2129', water: '#10263b', waterLine: '#17344f', wood: '#1d3a2b', grass: '#1f3a2e', park: '#1e4130',
  sand: '#2b2b27', ice: '#26303a', residential: '#202730', industrial: '#232a31', hospital: '#3a2528', school: '#2a2a26',
  building: '#2a323c', buildingLine: '#38424e',
  roadFill: '#46505c', roadCasing: '#12161b', minorFill: '#3b4550', minorCasing: '#12161b',
  secondaryFill: '#6b6140', secondaryCasing: '#14110a', primaryFill: '#8a6d34', primaryCasing: '#14110a',
  motorwayFill: '#b3703a', motorwayCasing: '#14110a', pathFill: '#7d8794', rail: '#6b7684', railTie: '#1b2129',
  aeroway: '#2a323c', boundary: '#9a8bb0',
  bike: '#2ee676', bikeCasing: '#06210f', bikeSoft: '#3fae6b',
  text: '#e3e8ee', textHalo: '#141a21', textWater: '#7fb4de', textPark: '#8fd19a', textMuted: '#9aa4af', textPoi: '#7fc4ee'
};

const SOTR_LAYERS = { firstLabel: 'sotr-first-label', bikeLane: 'sotr-bike-lane', bikeLaneCasing: 'sotr-bike-lane-casing' };

const SOTR_SOURCE_LAYERS = ['water', 'waterway', 'landcover', 'landuse', 'park', 'boundary', 'aeroway', 'transportation', 'transportation_name', 'place', 'poi', 'building', 'water_name'];

const SOTR_NAME = ['coalesce', ['get', 'name:it'], ['get', 'name']];
const SOTR_FONT = ['Noto Sans Regular'];
const SOTR_FONT_BOLD = ['Noto Sans Bold'];
const SOTR_FONT_ITALIC = ['Noto Sans Italic'];

function sotrZoomWidth(stops) { // [[z,w],...] -> interpolate esponenziale
  const e = ['interpolate', ['exponential', 1.4], ['zoom']];
  stops.forEach(function (s) { e.push(s[0], s[1]); });
  return e;
}

function sotrBuildStyle(opts) {
  opts = opts || {};
  const dark = opts.theme === 'dark';
  const P = dark ? SOTR_PALETTE_DARK : SOTR_PALETTE_LIGHT;
  const tilejson = opts.tilejson || 'https://tiles.openfreemap.org/planet';
  const glyphs = opts.glyphs || 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
  const SRC = 'openmaptiles';
  const cls = function (/* ...v */) { return ['in', ['get', 'class'], ['literal', [].slice.call(arguments)]]; };
  const isCls = function (v) { return ['==', ['get', 'class'], v]; };
  const noTunnelBridge = ['!', ['in', ['get', 'brunnel'], ['literal', ['tunnel']]]];
  const layers = [];
  const add = function (l) { layers.push(l); };

  add({ id: 'background', type: 'background', paint: { 'background-color': P.bg } });

  // --- Terreno
  add({ id: 'landcover-grass', type: 'fill', source: SRC, 'source-layer': 'landcover', maxzoom: 14,
    filter: cls('grass', 'farmland'), paint: { 'fill-color': P.grass, 'fill-opacity': 0.7 } });
  add({ id: 'landcover-wood', type: 'fill', source: SRC, 'source-layer': 'landcover', maxzoom: 14,
    filter: isCls('wood'), paint: { 'fill-color': P.wood, 'fill-opacity': 0.8 } });
  add({ id: 'landcover-sand', type: 'fill', source: SRC, 'source-layer': 'landcover',
    filter: isCls('sand'), paint: { 'fill-color': P.sand } });
  add({ id: 'landcover-ice', type: 'fill', source: SRC, 'source-layer': 'landcover',
    filter: cls('ice', 'glacier'), paint: { 'fill-color': P.ice } });
  add({ id: 'landuse-residential', type: 'fill', source: SRC, 'source-layer': 'landuse', maxzoom: 13,
    filter: cls('residential', 'suburb', 'neighbourhood'), paint: { 'fill-color': P.residential, 'fill-opacity': 0.8 } });
  add({ id: 'landuse-industrial', type: 'fill', source: SRC, 'source-layer': 'landuse', minzoom: 10,
    filter: cls('industrial', 'commercial', 'retail', 'railway'), paint: { 'fill-color': P.industrial } });
  add({ id: 'landuse-green', type: 'fill', source: SRC, 'source-layer': 'landuse', minzoom: 8,
    filter: cls('cemetery', 'playground', 'pitch', 'stadium', 'garden'), paint: { 'fill-color': P.grass } });
  add({ id: 'landuse-school', type: 'fill', source: SRC, 'source-layer': 'landuse', minzoom: 12,
    filter: cls('school', 'university', 'kindergarten', 'college'), paint: { 'fill-color': P.school } });
  add({ id: 'landuse-hospital', type: 'fill', source: SRC, 'source-layer': 'landuse', minzoom: 12,
    filter: isCls('hospital'), paint: { 'fill-color': P.hospital } });
  add({ id: 'park', type: 'fill', source: SRC, 'source-layer': 'park', minzoom: 5,
    paint: { 'fill-color': P.park, 'fill-opacity': 0.85 } });

  // --- Acqua
  add({ id: 'water', type: 'fill', source: SRC, 'source-layer': 'water', paint: { 'fill-color': P.water } });
  add({ id: 'waterway', type: 'line', source: SRC, 'source-layer': 'waterway', minzoom: 8,
    paint: { 'line-color': P.waterLine, 'line-width': sotrZoomWidth([[8, 0.5], [14, 1.5], [18, 4]]) } });
  add({ id: 'aeroway', type: 'fill', source: SRC, 'source-layer': 'aeroway', minzoom: 10,
    filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': P.aeroway } });

  // --- Edifici sottili, sfumati a zoom alto
  add({ id: 'building', type: 'fill', source: SRC, 'source-layer': 'building', minzoom: 14,
    paint: { 'fill-color': P.building, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, 0.7],
      'fill-outline-color': P.buildingLine } });

  // --- Strade: casing (sotto) poi riempimento
  const roadGroups = [
    { id: 'minor', filter: cls('minor', 'service', 'track'), minzoom: 13, fill: P.minorFill, casing: P.minorCasing,
      w: [[13, 0.6], [15, 2.5], [18, 9]], cw: [[13, 1.4], [15, 4], [18, 12]] },
    { id: 'tertiary', filter: cls('tertiary'), minzoom: 11, fill: P.roadFill, casing: P.roadCasing,
      w: [[11, 0.8], [14, 3], [18, 14]], cw: [[11, 1.8], [14, 5], [18, 17]] },
    { id: 'secondary', filter: cls('secondary'), minzoom: 8, fill: P.secondaryFill, casing: P.secondaryCasing,
      w: [[8, 0.8], [12, 2], [14, 4], [18, 16]], cw: [[8, 1.6], [12, 3.4], [14, 6], [18, 19]] },
    { id: 'primary', filter: cls('primary', 'trunk'), minzoom: 6, fill: P.primaryFill, casing: P.primaryCasing,
      w: [[6, 0.6], [10, 1.6], [14, 5], [18, 18]], cw: [[6, 1.4], [10, 3], [14, 7.5], [18, 21]] },
    { id: 'motorway', filter: isCls('motorway'), minzoom: 5, fill: P.motorwayFill, casing: P.motorwayCasing,
      w: [[5, 0.6], [10, 1.8], [14, 5.5], [18, 19]], cw: [[5, 1.4], [10, 3.4], [14, 8], [18, 22]] }
  ];
  const roadFilter = function (g) { return ['all', g.filter, noTunnelBridge]; };
  roadGroups.forEach(function (g) {
    add({ id: 'road-' + g.id + '-casing', type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: g.minzoom,
      filter: roadFilter(g), layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': g.casing, 'line-width': sotrZoomWidth(g.cw) } });
  });
  roadGroups.forEach(function (g) {
    add({ id: 'road-' + g.id, type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: g.minzoom,
      filter: roadFilter(g), layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': g.fill, 'line-width': sotrZoomWidth(g.w) } });
  });
  // Tunnel: tratteggiati, sottili
  add({ id: 'road-tunnel', type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: 12,
    filter: ['all', ['==', ['get', 'brunnel'], 'tunnel'], cls('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service')],
    paint: { 'line-color': P.roadCasing, 'line-opacity': 0.6, 'line-dasharray': [2, 2], 'line-width': sotrZoomWidth([[12, 0.8], [18, 6]]) } });

  // Sentieri pedonali (grigi, tratteggiati): meno evidenti delle ciclabili
  add({ id: 'path-foot', type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: 14,
    filter: ['all', isCls('path'), ['!=', ['get', 'subclass'], 'cycleway']],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': P.pathFill, 'line-dasharray': [1, 1.6], 'line-opacity': 0.8, 'line-width': sotrZoomWidth([[14, 0.6], [18, 2]]) } });

  // Ferrovie: linea + tratteggio bianco
  const railFilter = ['all', isCls('rail'), ['!=', ['get', 'subclass'], 'abandoned']];
  add({ id: 'rail', type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: 9, filter: railFilter,
    paint: { 'line-color': P.rail, 'line-width': sotrZoomWidth([[9, 0.6], [14, 1.6], [18, 3]]) } });
  add({ id: 'rail-dash', type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: 13, filter: railFilter,
    paint: { 'line-color': P.railTie, 'line-dasharray': [3, 3], 'line-width': sotrZoomWidth([[13, 0.6], [18, 1.6]]) } });

  // Ponti: sopra le strade normali
  add({ id: 'road-bridge', type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: 12,
    filter: ['all', ['==', ['get', 'brunnel'], 'bridge'], cls('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service')],
    layout: { 'line-cap': 'butt' },
    paint: { 'line-color': P.roadFill, 'line-gap-width': sotrZoomWidth([[12, 0.8], [18, 14]]), 'line-width': sotrZoomWidth([[12, 1], [18, 2]]) } });

  // --- CICLABILI in evidenza
  // class path+subclass cycleway; fallback: path/track con bicycle != no (se l'attributo manca coalesce -> 'unknown' -> visibile solo se subclass cycleway)
  const bikeFilter = ['all', isCls('path'), ['==', ['get', 'subclass'], 'cycleway']];
  add({ id: SOTR_LAYERS.bikeLaneCasing, type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: 9, filter: bikeFilter,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': P.bikeCasing, 'line-width': sotrZoomWidth([[9, 1.6], [13, 4], [16, 8], [19, 16]]) } });
  add({ id: 'sotr-bike-soft', type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: 13,
    filter: ['all', cls('path', 'track'), ['==', ['coalesce', ['get', 'bicycle'], 'unknown'], 'yes'], ['!=', ['get', 'subclass'], 'cycleway']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': P.bikeSoft, 'line-dasharray': [2, 1.2], 'line-width': sotrZoomWidth([[13, 1.2], [16, 3], [19, 7]]) } });
  add({ id: SOTR_LAYERS.bikeLane, type: 'line', source: SRC, 'source-layer': 'transportation', minzoom: 9, filter: bikeFilter,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': P.bike, 'line-width': sotrZoomWidth([[9, 0.8], [13, 2.4], [16, 5], [19, 10]]) } });

  // --- Confini
  add({ id: 'boundary-country', type: 'line', source: SRC, 'source-layer': 'boundary', filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
    layout: { 'line-join': 'round' },
    paint: { 'line-color': P.boundary, 'line-width': sotrZoomWidth([[2, 0.6], [8, 1.4], [14, 2.4]]) } });
  add({ id: 'boundary-state', type: 'line', source: SRC, 'source-layer': 'boundary', minzoom: 4, filter: ['all', ['in', ['get', 'admin_level'], ['literal', [3, 4]]], ['!=', ['get', 'maritime'], 1]],
    paint: { 'line-color': P.boundary, 'line-dasharray': [3, 2], 'line-opacity': 0.8, 'line-width': sotrZoomWidth([[4, 0.4], [10, 1.2]]) } });

  // --- ETICHETTE (da qui in poi solo symbol). Il primo symbol e' l'ancora per l'app.
  const halo = { 'text-color': P.text, 'text-halo-color': P.textHalo, 'text-halo-width': 1.6, 'text-halo-blur': 0.4 };
  const mk = function (id, sl, extra) { return Object.assign({ id: id, type: 'symbol', source: SRC, 'source-layer': sl }, extra); };

  // Nomi strada lungo la linea (primo symbol)
  add(mk(SOTR_LAYERS.firstLabel, 'transportation_name', {
    minzoom: 13,
    filter: ['!=', ['get', 'class'], 'path'],
    layout: { 'symbol-placement': 'line', 'text-field': SOTR_NAME, 'text-font': SOTR_FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 18, 14],
      'symbol-spacing': 280, 'text-rotation-alignment': 'map', 'text-pitch-alignment': 'viewport' },
    paint: halo }));
  // Nomi percorsi ciclabili (verde)
  add(mk('label-bike-name', 'transportation_name', {
    minzoom: 14,
    filter: ['all', isCls('path'), ['==', ['get', 'subclass'], 'cycleway']],
    layout: { 'symbol-placement': 'line', 'text-field': SOTR_NAME, 'text-font': SOTR_FONT_ITALIC, 'text-size': 11, 'symbol-spacing': 320 },
    paint: { 'text-color': dark ? P.bike : '#067a3c', 'text-halo-color': P.textHalo, 'text-halo-width': 1.6 } }));
  add(mk('label-water', 'water_name', {
    minzoom: 4,
    layout: { 'symbol-placement': 'point', 'text-field': SOTR_NAME, 'text-font': SOTR_FONT_ITALIC, 'text-size': 12, 'text-max-width': 6 },
    paint: { 'text-color': P.textWater, 'text-halo-color': P.textHalo, 'text-halo-width': 1.2 } }));
  add(mk('label-poi', 'poi', {
    minzoom: 14,
    filter: ['in', ['get', 'class'], ['literal', ['park', 'railway', 'hospital', 'bus', 'cemetery', 'stadium', 'school']]],
    layout: { 'text-field': SOTR_NAME, 'text-font': SOTR_FONT, 'text-size': 11, 'text-max-width': 7, 'text-anchor': 'top', 'text-offset': [0, 0.4],
      'symbol-sort-key': ['coalesce', ['get', 'rank'], 100] },
    paint: { 'text-color': P.textPoi, 'text-halo-color': P.textHalo, 'text-halo-width': 1.4 } }));
  const placeLayout = function (size, font, extra) {
    return Object.assign({ 'text-field': SOTR_NAME, 'text-font': font, 'text-size': size, 'text-max-width': 8 }, extra || {});
  };
  add(mk('place-suburb', 'place', { minzoom: 12, maxzoom: 17, filter: cls('suburb', 'quarter', 'neighbourhood'),
    layout: placeLayout(['interpolate', ['linear'], ['zoom'], 12, 10, 16, 13], SOTR_FONT, { 'text-transform': 'uppercase', 'text-letter-spacing': 0.08 }),
    paint: { 'text-color': P.textMuted, 'text-halo-color': P.textHalo, 'text-halo-width': 1.4 } }));
  add(mk('place-village', 'place', { minzoom: 9, maxzoom: 16, filter: cls('village', 'hamlet', 'isolated_dwelling'),
    layout: placeLayout(['interpolate', ['linear'], ['zoom'], 9, 10, 15, 14], SOTR_FONT), paint: halo }));
  add(mk('place-town', 'place', { minzoom: 7, maxzoom: 15, filter: isCls('town'),
    layout: placeLayout(['interpolate', ['linear'], ['zoom'], 7, 11, 14, 17], SOTR_FONT_BOLD), paint: halo }));
  add(mk('place-city', 'place', { minzoom: 4, maxzoom: 14, filter: isCls('city'),
    layout: placeLayout(['interpolate', ['linear'], ['zoom'], 4, 11, 12, 20], SOTR_FONT_BOLD), paint: halo }));
  add(mk('place-state', 'place', { minzoom: 4, maxzoom: 9, filter: cls('state', 'province'),
    layout: placeLayout(11, SOTR_FONT, { 'text-transform': 'uppercase', 'text-letter-spacing': 0.1 }),
    paint: { 'text-color': P.textMuted, 'text-halo-color': P.textHalo, 'text-halo-width': 1.4 } }));
  add(mk('place-country', 'place', { minzoom: 1, maxzoom: 7, filter: isCls('country'),
    layout: placeLayout(['interpolate', ['linear'], ['zoom'], 1, 10, 6, 17], SOTR_FONT_BOLD, { 'text-transform': 'uppercase' }), paint: halo }));

  return {
    version: 8,
    name: 'State of the Route ' + (dark ? 'dark' : 'light'),
    glyphs: glyphs,
    sources: { openmaptiles: { type: 'vector', url: tilejson,
      attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' } },
    layers: layers
  };
}

function sotrRasterStyle(opts) {
  opts = opts || {};
  const dark = opts.theme === 'dark';
  const rasterPaint = dark
    ? { 'raster-brightness-max': 0.45, 'raster-contrast': 0.15, 'raster-saturation': -0.4, 'raster-hue-rotate': 190 }
    : {};
  return {
    version: 8,
    name: 'State of the Route raster ' + (dark ? 'dark' : 'light'),
    sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 19,
      attribution: '© OpenStreetMap contributors' } },
    layers: [
      { id: 'osm', type: 'raster', source: 'osm', paint: rasterPaint },
      // Un symbol senza sorgente vettoriale non e' valido, quindi nel raster l'ancora e' un layer
      // `background` completamente trasparente con lo stesso id: valido per la spec e utilizzabile come beforeId.
      { id: SOTR_LAYERS.firstLabel, type: 'background', paint: { 'background-color': '#000000', 'background-opacity': 0 } }
    ]
  };
}

function sotrStyleInfo() { return { sourceLayers: SOTR_SOURCE_LAYERS.slice() }; }

if (typeof module !== 'undefined') module.exports = { sotrBuildStyle, sotrRasterStyle, SOTR_LAYERS, sotrStyleInfo };
