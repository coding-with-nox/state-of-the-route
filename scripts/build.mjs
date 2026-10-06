// Costruisce dist/index.html autosufficiente: MapLibre (JS+CSS) inlined nel sorgente.
// Uso: npm install && npm run build
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// Moduli puri in src/*.js inclusi con una riga `//@include nome.js` dentro lo <script type="module">.
const raw = readFileSync('src/index.html', 'utf8');
const lib = readFileSync('node_modules/maplibre-gl/dist/maplibre-gl.js', 'utf8');
const css = readFileSync('node_modules/maplibre-gl/dist/maplibre-gl.css', 'utf8');
if (lib.toLowerCase().includes('</script')) throw new Error('la libreria contiene </script');

const LINK = '<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">';
const MOD = '<script type="module">';
if (raw.split(LINK).length !== 2 || raw.split(MOD).length !== 2) throw new Error('marcatori non trovati in src/index.html');

// Prima i marcatori (i moduli inclusi possono nominare <script type="module"> nei commenti), poi gli include.
const out = raw.replace(LINK, () => `<style>${css}</style>`).replace(MOD, () => `<script>${lib}</script>\n${MOD}`)
  .replace(/^[ \t]*\/\/@include (\S+)[ \t]*$/gm, (_, f) => readFileSync(`src/${f}`, 'utf8'));
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', out);
console.log('dist/index.html', (out.length / 1024).toFixed(0) + ' KB');
