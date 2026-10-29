# Analisi di https://freccette.pro (Promotion Soft Darts, PSD)

Data rilevazione: 2026-10-29. Sola lettura (GET), analytics di terze parti bloccati (GTM, GA, Cloudflare Insights).
Screenshot in `screenshots/before/` (`<pagina>-desktop.png` 1440px, `<pagina>-mobile.png` 390px, tutti full-page).
Dati strutturati completi in `docs/dati-freccette.json`. Asset in `assets/originali/logo/`.

## 1. Sitemap

SPA React (Vite, shadcn/ui + Tailwind, Roboto). Titolo unico per tutte le pagine: "Promotion Soft Darts" (nessun titolo per pagina).

| Rotta | Contenuto | Screenshot |
|---|---|---|
| `/` Home | Benvenuto + logo PSD, sponsor Italian Darts, NEWS, "Prossimi tornei in zona" (5) | home |
| `/locali` | Elenco 192 locali della regione (scheda: nome, citta' - indirizzo, link "WWW", telefono, n. macchine, giorno di chiusura) | locali |
| `/locale/{id}` | Scheda locale: indirizzo, sito, tel, macchine, chiusura, "Squadre di questo locale", "Prossime partite", "Prossimi tornei", "Tornei recenti" (es. id 4 Rock Heat, 28 MCL Bucine) | locale-4, locale-28 |
| `/squadre/classificasquadre/{id}` | Classifica squadre, filtri Categorie (A/B/C/Mix) e Gironi (1/2, solo ids 3 e 11) | squadre-classificasquadre-3/11/25 |
| `/squadre/classificagiocatori/{id}` | Classifica giocatori (stessi filtri) | squadre-classificagiocatori-3/11/25 |
| `/squadre/calendario/{id}` | Calendario/risultati (stessi filtri) | squadre-calendario-3/11/25 |
| `/squadre/regolamento` | Solo un link a un .docx su psd-darts.it | squadre-regolamento |
| `/singolo/classifica` | Classifica nazionale singoli, tab A, B, C, Donne A/B, Donne C | singolo-classifica |
| `/singolo/partite` | "Prossimi tornei in zona" (tabella 100+ righe) | singolo-partite |
| `/singolo/regolamento` | Solo un link a un .docx | singolo-regolamento |
| `/accedi` | Login (email, password, Prosegui, Registrati, Password dimenticata?) | accedi |

Id campionati squadre: 3 = Campionato Nazionale a Squadre 2025 (terminato), 11 = COPPA ITALIA (terminato), 25 = Nazionale 2026/27 (in corso).
Rotte "Registrati" / "Password dimenticata" non visitate (flusso di autenticazione, nessun dato). Dal manifest: rotte previste `/tornei`, `/classifica` (non linkate nel menu).

### Menu
Barra sticky: selettore regione (Abruzzo, Emilia Romagna, Lazio, Liguria, Lombardia, Toscana, Umbria, Veneto; default Toscana) | Home | Locali | Campionati a Squadre (dropdown: per ognuno dei 3 campionati Classifica Squadre / Classifica Giocatori / Calendario, poi Regolamento) | Campionato Singoli (dropdown: Classifica, Prossime Partite, Regolamento) | Accedi / Registrati. Su mobile tutto collassa in un hamburger senza logo ne' titolo.

## 2. Contenuti reali (sintesi; dettaglio in dati-freccette.json)

### Home
- Titolo: "Benvenuti In PSD (Promotion Soft Darts)". Sponsor: Italian Darts (https://www.italiandarts.com/).
- NEWS: Campionato Nazionale 2026/2027: iscrizioni 20 Luglio - 13 Settembre 2026; inizio campionato 12 Ottobre; Finali 19-20-21 Marzo 2027, Arezzo Centro Affari e Convegni.
- Campionato Singolo: montepremi aggiornato al 26/10/2026 EUR 16.415 (in tempo reale dopo ogni torneo).
- Regola costi (dal 1 settembre): 2 EUR a giocatore a serata (recupero gratuito salvo chi arriva dopo); rimborso massimo al responsabile di serata 32 EUR; il surplus va ai primi di ogni tabellone (esempio: 2 tabelloni A/B e C/Donne, 32 giocatori -> 32 EUR al responsabile, 16 EUR al primo A/B, 16 EUR al primo C/Donne).
- Prossimi tornei: 30/10 20:00 Campionato Singolo @ Circolo MCL Bucine (15 iscritti); 30/10 20:00 @ Rock Heat, Arezzo (23); 31/10 14:00 @ Bersa Bar, Cecina (18); 31/10 20:00 "UN TORNEO DA PAURA" @ Fantechi Pub & Grill, Montevarchi (11); 01/11 14:00 "TORNEO DEI MORTI (seconda edizione)" @ Pub Camelot 3.0, Prato (2). Bottone "Iscriviti" su ognuno.

### Numeri
- 192 locali (Toscana), 336 macchine totali dichiarate, ~123 localita' distinte; 6 senza telefono. Rock Heat (Arezzo, Via Galvani 32) ha 11 macchine, chiusura domenica.
- Calendario singoli: 100+ tornei (ottobre - dicembre 2026 e oltre), prevalentemente "Campionato Singolo", ore 14:00 / 20:00; speciali: "UN TORNEO DA PAURA", "TORNEO DEI MORTI".
- Classifica singoli (righe): A 176, B 200, C 271, Donne A/B 54, Donne C 99. Leader: A Philip Neil Bowers (1361 pt, 100 partite, media 13.61), Carlo Frulio (1014), Francesco Cortesi (548); B Andrea Fagiolini (1123), Lorenzo Tedde (991); C Davide Manni (807); Donne A/B Cristina Del pace (824); Donne C Claudia Bartoli (274). Colonne: #, Tessera, Nome, Zona, Punti, Partite, Media. Zona include Toscana, Lazio, Lombardia.
- Squadre: Nazionale 2026/27 (id 25) categorie A 9 squadre (Jack team 9 pt, Lucky Strike 9, Penna 6, Eagles Dart 6, Cocker Dart, Dart Attack, Conca's Charlatans, Real Madrink, Ar-Tiro), B 6, C 11, Mix 8; calendario dal 12/10/2026, 19:30/20:30, partite ancora senza risultato dal 29/10. Campionato 2025 (id 3) cat. A: Eagles Dart 55 pt, Lucky Strike 51, Conca's Charlatans 33... Coppa Italia (id 11) cat. A: EAGLES DART 26, The Kings of dart 25. Colonne classifica: #, Squadra, Partite, Punti, Sets, Legs (emoji quadrato giallo accanto ad alcune squadre, senza legenda). Classifica giocatori: #, Giocatore, Partite, Punti, Sets, Legs, Media. Calendario: G(iornata), Data, Locale, PT, L, S, Casa, Ospiti, S, L, PT.
- Sedi di gara ricorrenti: Rock Heat, A.S.D. G.S. San Leo, Circolo La Penna, Circolo Ricreativo Perginese, Birrificio Calibro 22 sono sedi di gara.

### Regolamenti
Link a .docx su psd-darts.it (singolo: REGOLAMENTO-UFFICIALE-SINGOLO-2026.docx; squadre: Regolamento_PSD_2026-2027_Definitivo...docx). Il sito non ne mostra il testo.

### Brand e asset
- Logo PSD: bersaglio azzurro con tricolore e freccetta verde, scritta "PSD / Promotion Soft Dart" (`/logo250.jpeg`, 250x250 JPEG, sfondo bianco). Favicon e apple-touch-icon 16/32/180 px PNG. `/logo.png` (og:image) e le icone android del manifest restituiscono HTML (404 mascherato).
- Nessun altro immagine: niente foto, niente immagini dei locali o dei campionati.

## 3. Palette e font

Font: Roboto (fallback Helvetica, Arial) ovunque; corpo 14px/400 (5753 elementi), 16px, titoli card 16px/600, intestazioni 12px/500; massimo 20px/600. Nessuna gerarchia tipografica forte.

Token CSS (shadcn, tema chiaro): background `oklch(100% 0 0)` bianco; foreground `oklch(14.5% 0 0)` quasi nero; primary `oklch(55% .22 264)` blu (~#2563eb-simile) usato per tutti i link e per il bottone Iscriviti; muted/secondary/accent `oklch(97% 0 0)`; muted-foreground `oklch(55.6% 0 0)` grigio; border `oklch(92.2% 0 0)`; destructive `oklch(57.7% .245 27.3)` rosso; radius 0.625rem. Sfondo pagina effettivo grigio chiaro (~#e4e4e4) con card bianche a bordo nero sottile. Esiste un tema scuro (classe `.dark`) non esposto. Colori del logo (non usati nell'interfaccia): blu cielo, blu notte, verde, rosso.
theme-color: #fafafa; manifest: lang "en", nome "Freccette".

## 4. Problemi di aspetto e usabilita'

| # | Problema | Dove (screenshot) | Gravita' |
|---|---|---|---|
| 1 | Nessuna identita' visiva: tema shadcn grigio/bianco/blu generico, il logo (azzurro/verde/rosso) e il mondo freccette non compaiono; sfondo grigio piatto | tutte, es. home-desktop | alta |
| 2 | Header senza logo ne' nome: su desktop solo selettore regione e menu; su mobile solo un hamburger isolato a destra, barra vuota | home-mobile, squadre-classificasquadre-3-mobile | alta |
| 3 | Home senza gerarchia: logo grande in card semivuota (meta' della card vuota a destra), nessun hero, nessun call-to-action principale, sponsor ridotto a un link blu "Italian Darts" | home-desktop | alta |
| 4 | NEWS come testo non strutturato: date iscrizioni/finali, montepremi e regola 2 EUR sono paragrafi lunghi con una puntatura rotta (riga spezzata "in caso di tabellone di / recupero"), nessuna evidenza di date e cifra (montepremi 16.415 EUR) | home-desktop/mobile | alta |
| 5 | Bottoni "Iscriviti" sbiaditi (azzurro chiaro, aspetto disabilitato), contrasto basso, senza spiegazione se serve il login | home-desktop | media |
| 6 | Tabelle su mobile tagliate senza indicazione di scroll: calendario squadre mostra solo G, Data, Casa, parte di Ospiti (mancano punti, legs, sets, locale); classifica squadre mancano Partite e Legs; classifica singoli mancano Zona, Partite, Media | squadre-calendario-3-mobile, squadre-classificasquadre-3-mobile, singolo-classifica-mobile | alta |
| 7 | Tabelle dense e senza stile: bordi neri pieni su tutte le celle, nessuna zebra, nessun podio/evidenza dei primi, colonne numeriche non allineate in modo coerente, header non sticky su liste da 100-270 righe | singolo-classifica-desktop, squadre-calendario-3-desktop | alta |
| 8 | Calendario squadre: lunghissimo (decine di righe in elenco continuo), nessuna separazione per giornata, nessun filtro per squadra/locale/data, risultati non leggibili a colpo d'occhio (colonne PT/L/S/S/L/PT ambigue, intestazioni non spiegate); nel 2026/27 le partite future hanno celle vuote | squadre-calendario-25-desktop | alta |
| 9 | Classifica squadre: nomi con punto finale ("Eagles Dart.", "Penna.") e emoji quadrato giallo senza legenda; classifica e calendario non collegano alla scheda squadra in modo evidente | squadre-classificasquadre-3-desktop | media |
| 10 | Pagina Locali: 192 schede in una colonna da 26.000px, nessuna ricerca, filtro per citta'/provincia, mappa o ordinamento; ordine alfabetico mescolato (iniziale non uniforme, "Gorilla" per primo) | locali-desktop/mobile | alta |
| 11 | Etichetta "WWW" usata anche per indirizzi email e Facebook (il link e' `mailto:` o pagina social); scheda locale dice "Sito web": incoerenza e fraintendimento; telefono come numero nudo senza icona ne' bottone di chiamata evidente | locali-mobile, locale-4-desktop | media |
| 12 | "Chiusura:" vuota su molte schede; "1 macchine" (plurale errato) | locali-desktop | bassa |
| 13 | Scheda locale: elenco squadre con duplicati e varianti dello stesso nome (es. "Dustbugs/DustBugs/TheDustBugs" ripetuti 7+ volte, Cocker Dart x4), una riga per campionato senza raggruppamento; nomi anomali ("Colpo Grosso ( SQUALIFICATI )") | locale-4-desktop | media |
| 14 | Regolamenti: pagine che contengono solo un titolo grezzo ("regolamento-campionati-singoli") e un URL lungo a un .docx esterno su altro dominio (psd-darts.it); nessuna anteprima, niente PDF, nessun testo leggibile | singolo-regolamento-desktop, squadre-regolamento-desktop | alta |
| 15 | Selettore categoria/girone (A/B/C/Mix, 1/2) piatto, non indica il campionato corrente; nel menu i tre campionati sono differenziati solo da un titolo e dal badge "Terminato / In corso" nel dropdown, mai nelle pagine; lo stato e il nome del campionato non compaiono nelle pagine di classifica/calendario | squadre-classificagiocatori-3-mobile | alta |
| 16 | Menu dropdown ripetitivo: tre blocchi identici da 3 voci per i campionati a squadre; emoji come icone (trofeo, medaglia, tazza) incoerenti ("Classifica" ha la stessa medaglia di "Campionato Singoli"); tazzina per "Locali" | home-desktop | media |
| 17 | Pagine quasi vuote (login, regolamenti, classifiche corte) con grande vuoto grigio sotto; login senza branding ne' contesto | accedi-desktop, squadre-classificasquadre-3-mobile | bassa |
| 18 | Testi piccoli: 14px dominante, 12px per metadati con grigio medio (#737373 su bianco: contrasto circa 4.7:1, al limite); link tutti blu sottolineati nelle card, difficile distinguere azioni da dati | home-mobile | media |
| 19 | SEO/condivisione: stesso titolo e description su tutte le pagine, og:image `/logo.png` rotta (restituisce HTML), manifest con icone android mancanti e lang "en", nome "Freccette" diverso da "PSD" | tutte (head HTML) | media |
| 20 | Classifica singoli: 270+ righe senza ricerca giocatore ne' paginazione, colonna "Zona" quasi sempre "Toscana" (ridondante); tab A/B/C/Donne non evidenziano quello attivo con forza | singolo-classifica-desktop | media |
| 21 | Calendario singoli (Prossime Partite): 100+ tornei in tabella piatta, senza raggruppamento per data/mese, filtro per locale o zona, senza numero iscritti e senza azione di iscrizione (presenti solo in home) | singolo-partite-desktop | media |

## 5. Note per il prototipo
- Dati reali pronti: `docs/dati-freccette.json` (home, tornei, locali, classifiche singolo, classifiche squadre per campionato/categoria; classifica giocatori e calendario solo nella vista di default A/girone 1).
- Contenuti da preservare: sponsor, date/finali nazionali, regola costi 2 EUR, montepremi in tempo reale, 3 campionati a squadre con 4 categorie, 5 categorie singolo.
- Informazioni mancanti nel sito: nessun contatto della federazione/organizzatori, nessun indirizzo email o social PSD, nessun testo dei regolamenti, nessuna foto, nessun testo "chi siamo".
- Dati personali: elenchi di nomi di giocatori e telefoni dei locali sono pubblici sul sito; nel JSON non sono state copiate le email dei locali.
