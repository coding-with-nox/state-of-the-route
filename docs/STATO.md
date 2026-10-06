# State of the Route — stato del progetto (passaggio a Claude Code, 2026-10-06)

App a pagina singola per il ciclista pendolare (Figline ↔ Montevarchi): scegli due punti
sulla mappa, partenza o arrivo entro un'ora, e vedi la pioggia lungo il percorso per decidere
quando partire. Solo open source / dati aperti.

## Stack e endpoint
| Cosa | Servizio | Note |
|---|---|---|
| Mappa | MapLibre GL JS 4.7.1 + OpenFreeMap (`liberty` chiaro, `fiord` scuro, `bright` riserva) | `dark` NON esiste |
| Percorso bici | OSRM FOSSGIS `routing.openstreetmap.de/routed-bike`, riserva `router.project-osrm.org` | `steps=true`; senza percorso → cerchio massimo |
| Indirizzi | Photon `photon.komoot.io/api/` (senza `lang`: con `it` risponde 400), riserva Nominatim OSM | corretto il 2026-10-06, MAI provato dal vivo |
| Meteo | Open-Meteo, 5 modelli (ecmwf_ifs025, gfs_seamless, icon_seamless, meteofrance_seamless, italia_meteo_arpae_icon_2i) | `minutely_15` solo se `forecast_days≤3`; CC BY 4.0 |
| Soste | Overpass (overpass-api.de, riserva kumi.systems), POST | |
| Radar | RainViewer | non open source: valutare se tenerlo |

## Come si lavora
- Sorgente unico: `src/index.html` (HTML + `<script type="module">` con top-level await).
- `npm install && npm run build` → `dist/index.html` autosufficiente (MapLibre inlined). Aprilo nel browser.
- Modalità demo (meteo sintetico, mappa a griglia): `window.__SOTR_DEMO=true` prima dello script. Serve dentro gli artifact Claude, dove la CSP blocca ogni chiamata esterna.

## Verificato
Solo con Playwright e rete simulata (`page.route`): desktop e mobile, CSP rigida, libreria assente o lenta, fallback geocoding.

## DA VERIFICARE SUBITO nel browser vero (mai provato con i server reali)
1. Nomi dei layer di OpenFreeMap: il layer `bike-lanes` e l'inserimento di route-casing/route-line prima del primo layer simbolo.
2. Photon senza `lang` (e fallback Nominatim) restituisce risultati per "Figline".
3. OSRM bici: geometria e `steps`.
4. Overpass: query soste, mirror.
5. Open-Meteo: forme di risposta con più punti e 5 modelli.
Aprire DevTools → Network e annotare status e errori.

## Da fare (priorità)
1. Layout mobile con sheet a 3 altezze (peek / metà / piena), verdetto sticky, form ripiegato dopo il calcolo (vedi `docs/ux-review.md`, punti 1, 2, 3, 8).
2. Barre "Quando partire" più usabili e target di tocco ≥44px (punti 4, 6).
3. Soste: bottone unico `Soste · N`, elenco ordinato lungo il tragitto con deviazione e attesa.
4. Copy italiano rivisto (punto 7), contrasto colori (punto 5, in parte fatto).
5. Pubblicazione live (GitHub Pages) per usarla dal telefono.

## Volontà permanenti di DevNox
- Solo open source.
- Mappa in stile Google Maps/Waze: il ciclista deve capire dove passare.
- Opzione "sosta" per ripararsi in caso di pioggia.
- Beta: due punti qualsiasi del globo.
- Usare gli agenti (team in `.claude/agents`), anche per la UX.
- Nome: "State of the Route". Ogni modifica andava ripubblicata anche come artifact Claude: in Claude Code non serve più, a meno che tu lo chieda.

## Aggiornamento 2026-10-07 — servizio mappa potenziato (solo frontend)
- `src/map-style.js`: stile vettoriale nostro (tipo Google Maps, ciclabili in evidenza) su tile OpenFreeMap + riserva raster OSM. Fallback a runtime: vettoriale → raster → solo tragitto (`window.__SOTR_FALLBACK_MS`, default 12000).
- `src/providers.js`: geocoding Photon→Nominatim; percorso OSRM bici→Valhalla (GET)→OSRM demo; hedging, timeout, circuit breaker, cache.
- Pannello "Stato servizi" (`#bHealth`, `?diag`) con "Copia diagnostica".
- Build: `//@include file.js`; `src/index.html` non gira più senza `npm run build`.
- Test: `node --test test/*.test.mjs` (21) e `node test/e2e/run.mjs` (16, desktop+mobile, rete simulata).
- UX: canvas Design "State of the Route UX" (mobile peek/dettaglio/servizi + desktop). NON ancora portata in `src/index.html`.
- Da verificare nel browser vero: tile OpenFreeMap reali, CORS (glifi, TileJSON, Overpass, Valhalla GET), forma risposte reali Photon/Nominatim/OSRM/Valhalla, tile OSM da file://.
- TODO: toggle ciclabili (`SOTR_LAYERS.bikeLane*`) non ancora in UI; applicare il Design.
