# Fase 2 - Due direzioni visive per PSD (Promotion Soft Darts)

Colori ricavati dal logo originale solo come riferimento di tonalita (azzurro, blu notte, verde, rosso, tricolore). Il prototipo non usa il logo: marchio provvisorio in SVG inline (bersaglio + freccetta), nome "PSD - Promotion Soft Darts". Dei principi ODF si usano solo questi: scheletro costante, ruoli colore fissi, menu corto + "Varie", selettore regione/campionato a portata, "aggiornato il", contatti per ruolo nel footer, stati vuoti espliciti. Nessun colore, testo o layout di ODF e copiato.

Tutti i rapporti sono calcolati con la formula WCAG 2.1 (luminanza relativa). Soglie: testo normale 4.5:1, testo grande 3:1, componenti UI 3:1.

## Direzione A - "Tabellone" (chiara, struttura blu notte)

Idea: un tabellone di punteggi da locale, leggibile sotto luce cattiva e da telefono. Pagina chiara, barra e footer blu notte, un solo rosso per l'azione (Iscriviti), azzurro per i link, verde solo per stato "In corso". Il tricolore compare una volta, come filo sottile sotto l'header.

Palette (ruoli fissi)

| Ruolo | Token | Hex |
|---|---|---|
| Struttura (header, tabelle head, footer) | navy | #14215A |
| Sfondo pagina | bg | #F3F6FB |
| Superficie card/tabelle | surface | #FFFFFF |
| Riga zebrata | zebra | #EAF0F8 |
| Testo | ink | #101938 |
| Testo secondario | muted | #47516F |
| Link e voce attiva | link | #0B5CAD |
| Decorazione su navy (filo, tab attivo su scuro) | sky | #3AA7E8 |
| Azione primaria (Iscriviti) | cta | #B91C28 |
| Stato "In corso" | green | #17703A |
| Bordi controlli | line | #74819F |
| Podio 1 / 2 / 3 | - | #FFF0B8 / #E3E9F3 / #F8DCC4 |

Contrasti verificati

| Coppia | Rapporto | Esito |
|---|---|---|
| ink su surface #FFF | 17.24 | AA/AAA |
| ink su bg | 15.91 | AA/AAA |
| ink su zebra | 15.04 | AA/AAA |
| muted su surface | 7.85 | AA/AAA |
| muted su zebra | 6.85 | AA/AAA |
| bianco su navy | 15.05 | AA/AAA |
| sky su navy | 5.64 | AA |
| link su surface | 6.67 | AA |
| link su bg | 6.16 | AA |
| bianco su cta (bottone) | 6.44 | AA |
| bianco su green (badge) | 6.15 | AA |
| ink su podio 1 / 2 / 3 | 15.11 / 14.13 / 13.16 | AA/AAA |
| line su surface (bordo input, non testo) | 3.90 | AA UI (>=3) |
| line su bg | 3.60 | AA UI |

Tipografia: titoli in stack condensato di sistema (Bahnschrift, DIN Alternate, Arial Narrow, Roboto Condensed, poi system-ui) in maiuscolo con spaziatura, evocano il segnapunti; corpo system-ui 16px; numeri con tabular-nums. Zero font scaricati.

Griglia: mobile-first, una colonna, gutter 16px; da 720px contenuto max 1120px; card a 2 colonne da 720px, 3 da 1000px. Spaziatura su scala 4/8/16/24/40.

Componenti: header sticky con marchio + menu corto (Home, Campionato, Eventi, Locali, Contatti, Varie) che su mobile diventa pannello con bottone testuale "Menu" (non icona isolata); selettore campionato a chip con badge stato; tab con indicatore; tabelle con intestazione navy sticky, zebra, numeri a destra, ombra di scroll su mobile; podio con tinta e numero in cerchio; card news con dato in evidenza (data, cifra); bottone Iscriviti rosso pieno; stati vuoti con riquadro tratteggiato.

## Direzione B - "Serata" (scura, atmosfera da locale)

Idea: lo schermo come la sala di sera, sfondo blu notte profondo, numeri luminosi stile segnapunti. Piu scenografica, meno neutra per tabelle lunghe.

Palette

| Ruolo | Token | Hex |
|---|---|---|
| Sfondo | bg | #0A1030 |
| Superficie | surface | #121B4A |
| Riga zebrata | zebra | #0F1740 |
| Testo | ink | #E9EEFF |
| Testo secondario | muted | #AAB5DA |
| Link / attivo | link | #7CC4FF |
| Azione primaria (testo scuro su corallo) | cta | #FF7A7F su testo #0A1030 |
| Stato "In corso" | green | #5FD98B |
| Bordi controlli | line | #6573A3 |

Contrasti verificati

| Coppia | Rapporto | Esito |
|---|---|---|
| ink su bg / surface | 16.06 / 14.16 | AA/AAA |
| muted su bg / surface / zebra | 9.15 / 8.06 / 8.49 | AA/AAA |
| link su surface / bg | 8.74 / 9.91 | AA/AAA |
| testo #0A1030 su cta | 7.38 | AA/AAA |
| green su surface | 9.20 | AA/AAA |
| line su surface / bg | 3.54 / 4.01 | AA UI |

Tipografia: titoli system-ui peso 800 con numeri monospace (ui-monospace) per punteggi; corpo system-ui 16px. Griglia e componenti come A, con card a rilievo luminoso e tab a pillola.

Limiti: tabelle da 270 righe su fondo scuro affaticano di piu in luce ambiente; il rosso corallo si discosta dal rosso del logo; l'impressione "gaming" e meno istituzionale per un campionato nazionale.

## Scelta: Direzione A, con la palette di B come tema scuro automatico

1. Le classifiche (fino a 270 righe) e i calendari sono il contenuto principale: su fondo chiaro con zebra e testo ink hanno il rapporto piu alto (15-17:1) e restano leggibili al sole o in locale.
2. I ruoli colore sono pochi e fissi (navy struttura, azzurro link, rosso solo azione, verde solo "In corso"), quindi l'utente impara subito cosa e cliccabile.
3. Il rosso e l'azzurro del logo restano riconoscibili e il bianco/navy da' un tono istituzionale adatto a un campionato nazionale.
4. Solo font di sistema: nessun peso extra, caricamento immediato su rete mobile dei locali.
5. La palette di B diventa il tema scuro via prefers-color-scheme, quindi chi preferisce la sera ottiene B senza una seconda versione del sito.

## Contenuti non disponibili (segnaposto nel prototipo)

Contatti per ruolo, "chi siamo", email e social PSD, testi dei regolamenti (solo link ai .docx originali), foto, logo definitivo, app: tutti marcati [DA CONFERMARE]. "Iscriviti" non ha un URL di destinazione noto: nel prototipo e un link a [DA CONFERMARE]. Il numero di iscritti per torneo non e nei dati estratti e non e mostrato. Classifica giocatori e calendario esistono solo per cat. A girone 1 (vista di default): le altre combinazioni mostrano stato vuoto [DA CONFERMARE].
