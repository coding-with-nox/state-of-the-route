// Costruisce dist/index.html autosufficiente: MapLibre (JS+CSS) inlined nel sorgente.
// Uso: npm install && npm run build
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync('src/index.html', 'utf8');
const lib = readFileSync('node_modules/maplibre-gl/dist/maplibre-gl.js', 'utf8');
const css = readFileSync('node_modules/maplibre-gl/dist/maplibre-gl.css', 'utf8');
if (lib.toLowerCase().includes('</script')) throw new Error('la libreria contiene </script');

const LINK = '<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">';
const MOD = '<script type="module">';
if (src.split(LINK).length !== 2 || src.split(MOD).length !== 2) throw new Error('marcatori non trovati in src/index.html');

const out = src.replace(LINK, () => `<style>${css}</style>`).replace(MOD, () => `<script>${lib}</script>\n${MOD}`);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', out);
console.log('dist/index.html', (out.length / 1024).toFixed(0) + ' KB');
