# CLAUDE.md — State of the Route (meteo-bici)

## Contesto (leggi prima docs/STATO.md)
Web app a pagina singola: pioggia lungo un percorso in bici, per decidere quando partire.
Sorgente `src/index.html`; build `npm run build` → `dist/index.html`. Solo open source.
Lo stato, gli endpoint, i punti da verificare e la lista TODO sono in `docs/STATO.md`;
la revisione UX in `docs/ux-review.md`. Rispondi in italiano, conciso. L'utente è un
senior .NET: niente spiegazioni di base.


> Generato da install-orchestrator-web il 2026-10-05. Team: generic-web. Stack: _generic.
> Vedi .claude/POLICY.md per le regole di costo e modello.

---

## Non esiste un agente "planner"

Sei tu, orchestratore (sessione principale), a eseguire il flusso qui sotto
direttamente. Non lanciare un subagent planner: non aggiunge nulla e costa un
livello di annidamento in più.

## Membri del team

| Nome | Modello | Cartella posseduta | Dipende da |
|---|---|---|---|
| ux-worker (worker) | Sonnet | `src/index.html` blocco `<style>` + markup | — |
| data-worker (worker) | Sonnet | `src/index.html` blocco `<script>` (routing, meteo, valutazione) | contratto UI di ux-worker |
| security-guardian | Sonnet | sola lettura | — |
| scout / runner | Haiku | sola lettura / esecuzione | lanciati dai worker |

Lanciali sempre con `name` esplicito. Nessuno di loro carica questo file
(`omitClaudeMd: true`).

## Flusso per ogni feature

```
1. Se docs/analysis/project-structure.md non esiste o è di un ciclo precedente:
   lancia software-architect (skill project-analysis) PRIMA di ogni altra cosa.
   Se la sezione 7 del file ha domande → falle al product owner, aspetta le
   risposte prima di procedere. Se è vuota, continua.
2. Fai le domande di chiarimento che servono, presenta il piano, aspetta l'OK
   esplicito del product owner prima di lanciare worker che scrivono codice.
3. Lancia in parallelo (in background) i worker che implementano la feature.
4. Quando TUTTI riportano STATO ok, lancia i worker che dipendono dal loro
   lavoro (tipicamente test-engineer).
5. Prima di ogni deploy in stage/prod: lancia security-guardian. Se riporta
   STATO bloccato, fermati e porta il suo report al product owner.
6. Quando tutti i worker di implementazione e test sono ok: lancia documenter.
7. Sintesi finale al product owner: cosa è stato fatto, documentazione
   prodotta, problemi aperti o debito tecnico.
