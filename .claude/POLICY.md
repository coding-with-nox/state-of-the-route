# POLICY.md — modello di costo e di ruolo, vale per OGNI team in questo progetto

## Livelli e modelli — non negoziabile

| Livello | Chi | Modello | Come si lancia |
|---|---|---|---|
| Orchestratore | La sessione principale (tu che parli col product owner) | Opus | È già la sessione: non lanciarlo mai come subagent |
| Membri del team | backend/frontend/test/doc/architect/ecc. | Sonnet | Sempre con `name` esplicito passato al tool Agent |
| Subagent di supporto (ricerca, esecuzione comandi) | `scout`/`runner`, lanciati DAI membri del team | Haiku | Solo se il membro del team ne ha bisogno per isolare output verboso |

**Niente `agents/planner.md`.** Il coordinamento (sequenza, dipendenze,
escalation al product owner) è scritto in `CLAUDE.md` ed è la sessione
principale a eseguirlo direttamente.

## Ogni agente di team DEVE avere nel frontmatter

```yaml
tools: Read, Write, Edit, Bash, PowerShell, Grep, Glob, Agent, SendMessage, Skill
maxTurns: 60
omitClaudeMd: true
```

`Agent` + `SendMessage` mancanti è il bug più comune: un agente che nel prompt
dice "manda un messaggio a..." ma non ha il tool per farlo resta muto.

`omitClaudeMd: true` perché ogni agente ha già, nel proprio corpo, tutto ciò
che gli serve. Caricare il CLAUDE.md di progetto ad ogni subagent è puro
costo ripetuto.

## Skill: precaricare solo su chi la usa davvero

```yaml
skills:
  - <nome-skill>
```

Mai a livello dell'intero team se solo un ruolo la applica (es. `sky_doc` solo
sul documenter, `project-analysis` solo sul software-architect).

## Quality gate: hook Stop, non una task list

Il gate di qualità è un hook `Stop` per ogni agente che scrive codice, che
punta a `$CLAUDE_TEAM_CONFIG/hooks/quality-gate-<stack>.ps1`. Se build/test
falliscono, lo script esce con codice 2: l'agente non si considera finito e
continua a correggere da solo, senza intervento del product owner.

## Report finale — stesso formato per ogni agente

```
RPT
STATO: ok|parziale|bloccato
FATTO: <max 3 righe>
FILE: <path:righe>
TEST: <passati/falliti, oppure ->
PROBLEMA: <solo se non ok>
```

Un agente che non scrive test (software-architect, security-guardian) può
sostituire `TEST` con un campo più pertinente (`CRITICI`/`MEDI` per
security-guardian) — la struttura STATO/FATTO/PROBLEMA resta fissa.

## Sicurezza: un solo agente globale, non uno per stack

`agents/security-guardian.md` rileva da solo lo stack presente nel progetto
e lancia lo scanner giusto. Non duplicarlo per team.

## Delega interna standard

Un worker, prima di leggere un file intero o lanciare un comando lungo lui
stesso, valuta se delegare: ricerche nel codice → subagent `scout` (Haiku,
restituisce solo `path:riga`); comandi di build/test/lint lunghi → subagent
`runner` (Haiku, restituisce solo l'esito). Se questi tipi non sono
disponibili, procede da solo con i propri tool.

## Preferenze personali: mai in questo repository

Skill di stile, scelte estetiche o personalizzazioni di un singolo sviluppatore
NON vanno in `.claude/agents/` del progetto: è condiviso da tutto il team. Le
preferenze personali vanno nel proprio `~/.claude/` locale.

## Automiglioramento: governance

L'orchestratore può proporre modifiche a `.claude` quando trova un miglioramento
necessario, con evidenza concreta. Regole non negoziabili:

1. **Nessuna modifica senza approvazione esplicita dell'utente**, data dopo una
   proposta con COSA / PERCHÉ / COME / IMPATTO / AMBITO.
2. **Chi propone non applica da solo senza conferma.**
3. Non si cambiano da soli i livelli di modello di questa policy, i permessi,
   gli hook di sicurezza: serve eccezione esplicita e motivata dell'utente.
4. Ogni modifica va registrata in `.claude/orchestra/CHANGELOG.md`, con
   istruzioni per annullarla.
