# Analisi layout ODF (Open Dart) - solo principi

Fonte: odf.cc/campionato e odf.cc/campionato/lazio, GET only, analisi del 2026-10-29. Nessun testo, codice, logo o immagine di ODF e stato copiato. Gli screenshot di riferimento sono in `screenshots/reference-odf/` e sono solo per uso interno (non da mostrare al cliente).

Limite: la pagina regionale del Lazio, al momento dell'analisi, mostra solo titolo stagione e breadcrumb. Calendari e classifiche non erano renderizzati (stagione chiusa o dati non pubblicati). Tabelle e calendari quindi NON sono stati osservati direttamente: le indicazioni su di essi sono raccomandazioni nostre, non osservazioni su ODF.

## Cosa rende ODF "professionale"

1. **Struttura prevedibile e identica su ogni pagina**: barra di menu scura in alto, fascia hero con titolo del brand, titolo pagina + breadcrumb, colonna contenuto + colonna laterale, footer scuro. L'utente sa sempre dove si trova.
2. **Pochi colori con ruoli fissi**: blu notte (struttura: menu, intestazioni, footer), rosso (titoli, link, accenti), blu elettrico (solo voce di menu attiva e filo sotto l'hero), grigio chiaro (colonna laterale), bianco (contenuto).
3. **Navigazione a due livelli chiari**: menu orizzontale in minuscolo con una voce "varie" che raccoglie il materiale secondario (regolamento, nazionale, tornei). Le voci principali restano poche e dirette.
4. **Selettore regioni sempre visibile**: lista verticale, una riga per regione, con freccia. Compare sia nel corpo della pagina indice sia come colonna laterale fissa su tutte le pagine campionato. Passare da una regione all'altra e a 1 click.
5. **Segnale di freschezza**: "aggiornato il gg/mm/aa" in una linguetta ben visibile sotto il menu. Dice all'utente se i dati sono affidabili.
6. **Blocco app e contatti con posto fisso**: app in fondo alla colonna laterale (con badge store), contatti divisi per ruolo (referti, organizzatori, segreteria) in 3 colonne nel footer.
7. **Intestazioni di sezione con icona** in una barra scura: separano i blocchi della colonna laterale senza bisogno di bordi.
8. **Mobile coerente**: stessa gerarchia, colonna laterale che scende sotto il contenuto, menu a hamburger, linguetta "aggiornato" a tutta larghezza.

## Punti deboli da non ereditare

- Titolo di pagina enorme e rosso: pesante, poca differenza tra livelli.
- Hero fotografica alta senza funzione informativa (occupa 200 px prima del contenuto).
- Pagina regionale vuota fuori stagione senza messaggio ("prossima stagione da ...", "ultimi risultati" mancano).
- Selettore regioni in lista lunga: su mobile occupa uno schermo intero prima del footer; meglio un menu a tendina o chip.
- Stile generale datato (framework di tipo Bootstrap 3, angoli e ombre di default), contrasto basso nelle voci di lista piccole.
- Link rossi su footer blu notte con contrasto limitato.

## Palette (descrittiva)

| Ruolo | Valore approssimato |
|---|---|
| Struttura, menu, footer | blu notte `#28394A` |
| Titoli, link, accenti | rosso `#D93A42` |
| Voce attiva, filo hero | blu elettrico (circa `#3355F0`) |
| Colonna laterale | grigio chiaro `#E3E4E6` |
| Bordi lista | grigio `#DDD` |
| Contenuto | bianco |

## Tipografia (descrittiva)

- Titoli e intestazioni: sans condensata, squadrata, maiuscola per il titolo pagina, spaziatura larga.
- Corpo: sans umanista tipo Open Sans, 15-17 px, grigio scuro su bianco.
- Menu: minuscolo, corpo medio, leggero.

## Principi riutilizzabili

| # | Principio | Come applicarlo a freccette (versione migliorata) |
|---|---|---|
| 1 | Scheletro identico su tutte le pagine | Header + titolo/breadcrumb + contenuto + laterale + footer, un solo template |
| 2 | 3-4 colori con ruolo fisso | Un colore scuro struttura, un accento per link/CTA, un secondo accento solo per "attivo", neutro chiaro per sfondi |
| 3 | Menu corto + voce "Varie" | 7-8 voci principali, raccogliere regolamento, statuto, nazionale in "Varie" |
| 4 | Selettore regioni sempre a portata | Tendina/chip in alto sulle pagine campionato + lista completa nella pagina indice; ricordare l'ultima regione scelta |
| 5 | Data "aggiornato il" visibile | Badge sotto l'header su ogni pagina con dati; per tabelle, anche data per singola classifica |
| 6 | Blocco app in posizione fissa | Card in fondo alla colonna laterale con badge store; su mobile prima del footer |
| 7 | Contatti per ruolo in footer | 3 colonne: referti/segreteria/organizzazione, sede, social; link mailto e tel |
| 8 | Intestazioni sezione con icona | Barra o titoletto con icona per separare i blocchi laterali |
| 9 | Colonna laterale su desktop, impilata su mobile | Contenuto prima, laterale sotto; ordine invertito solo se il selettore e critico |
| 10 | Stato vuoto esplicito (miglioria) | Se una regione non ha dati: messaggio con ultima stagione disponibile e link archivio |
| 11 | Tabelle classifiche (raccomandazione nostra) | Righe zebrate, intestazione scura fissa, numeri allineati a destra, scroll orizzontale su mobile, prime posizioni evidenziate |
| 12 | Calendari (raccomandazione nostra) | Raggruppati per giornata, data in evidenza, risultato affiancato alle squadre |
| 13 | Gerarchia titoli piu sobria (miglioria) | Titolo pagina medio, niente hero alto; contenuto visibile senza scroll |
