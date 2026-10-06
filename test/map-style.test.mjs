import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
const require = createRequire(import.meta.url);
const { sotrBuildStyle, sotrRasterStyle, SOTR_LAYERS, sotrStyleInfo } = require('../src/map-style.js');

const OMT = ['water', 'waterway', 'landcover', 'landuse', 'mountain_peak', 'park', 'boundary', 'aeroway', 'transportation',
  'transportation_name', 'place', 'poi', 'housenumber', 'building', 'water_name', 'aerodrome_label'];
const vec = ['light', 'dark'].map(t => [t, sotrBuildStyle({ theme: t })]);
const all = [...vec, ['raster-light', sotrRasterStyle({ theme: 'light' })], ['raster-dark', sotrRasterStyle({ theme: 'dark' })]];

test('validazione spec', () => {
  for (const [n, s] of all) assert.deepEqual(validateStyleMin(s), [], n);
});

test('sotr-first-label e ordine layer', () => {
  for (const [n, s] of all) assert.ok(s.layers.some(l => l.id === SOTR_LAYERS.firstLabel), n);
  for (const [n, s] of vec) {
    const i = s.layers.findIndex(l => l.type === 'symbol');
    assert.equal(s.layers[i].id, SOTR_LAYERS.firstLabel, n);
    s.layers.slice(i).forEach(l => assert.equal(l.type, 'symbol', n + ' ' + l.id + ' dopo le etichette'));
    assert.ok(s.layers.slice(0, i).some(l => l.id === SOTR_LAYERS.bikeLane), n);
  }
});

test('ciclabili presenti e sopra al casing', () => {
  for (const [n, s] of vec) {
    const a = s.layers.findIndex(l => l.id === SOTR_LAYERS.bikeLaneCasing), b = s.layers.findIndex(l => l.id === SOTR_LAYERS.bikeLane);
    assert.ok(a >= 0 && b > a, n);
  }
});

test('source-layer ammessi', () => {
  const used = new Set(vec.flatMap(([, s]) => s.layers.map(l => l['source-layer']).filter(Boolean)));
  for (const u of used) assert.ok(OMT.includes(u), u);
  for (const u of sotrStyleInfo().sourceLayers) assert.ok(OMT.includes(u), u);
  for (const u of used) assert.ok(sotrStyleInfo().sourceLayers.includes(u), 'info incompleta: ' + u);
});

test('glyphs, niente sprite/icon-image', () => {
  for (const [n, s] of all.filter(([n]) => !n.startsWith('raster'))) {
    assert.match(s.glyphs, /\{fontstack\}/); assert.match(s.glyphs, /\{range\}/);
    assert.equal(s.sprite, undefined, n);
  }
  for (const [n, s] of all) assert.ok(!JSON.stringify(s).includes('icon-image'), n);
});
