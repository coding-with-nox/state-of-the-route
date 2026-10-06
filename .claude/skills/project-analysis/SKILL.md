---
name: project-analysis
description: >
  Usa questa skill per analizzare la struttura di un progetto esistente e produrre
  un file di analisi leggibile sia dagli agenti del team che dal product owner.
  Triggera quando: si avvia una nuova sessione su un progetto esistente, serve
  capire lo stato del progetto prima di pianificare, il software-architect viene
  chiamato per un'analisi, oppure mancano informazioni sulla struttura per
  pianificare una feature. Il file prodotto diventa il "contesto condiviso" del
  team per tutta la sessione.
---

# project-analysis — Skill di analisi struttura progetto

## 1. Scopo

Produce `docs/analysis/project-structure.md` che risponde a:
> **"Cosa fa questo progetto, com'è strutturato, e cosa manca per poter lavorarci?"**

Destinatari: gli agenti del team (che lo leggono a inizio sessione per
orientarsi senza rileggere tutto il codice) e il product owner (che vede lo
stato di salute del progetto e le lacune che richiedono una sua decisione).

## 2. Chi esegue e quando

Esecutore: `software-architect` (o `software-architect-py`) — è l'unico
agente con Read/Grep/Glob/Bash e il ruolo per un'analisi trasversale.

Quando: inizio sessione su progetto esistente; prima di pianificare una
feature complessa; dopo un ciclo di sviluppo significativo; on demand
("analizza il progetto").

Se emergono gap informativi, l'agente NON inventa e NON lascia TODO
silenziosi: li mette in sezione 7 e l'orchestratore li porta al product
owner prima di assegnare task di sviluppo.

## 3. Processo di analisi

### Step 1 — Rileva lo stack e scansiona

```bash
find . -maxdepth 2 -name "*.csproj" 2>/dev/null | grep -q . && STACK=dotnet
[ -f pyproject.toml ] || [ -f requirements.txt ] && STACK=python
[ -f pom.xml ] || [ -f build.gradle ] && STACK=java
[ -f package.json ] && STACK=node
