# 01 — Matematica e Calcolo Stocastico

**Obiettivo:** basi teoriche per modellare la dinamica dei prezzi. Serve a capire *cosa assumono* i modelli, non a derivare formule a mano.

## Mappa dei concetti

```mermaid
flowchart LR
    A[Random walk] --> B[Moto Browniano W_t]
    B --> C[SDE: dS = μS dt + σS dW]
    C --> D[Lemma di Itô]
    D --> E[GBM: S_t = S_0·exp((μ-σ²/2)t + σW_t)]
    E --> F[Simulazione Monte Carlo / pricing / VaR]
```

## Concetti chiave

| Concetto | Definizione breve | Perché serve |
|---|---|---|
| Moto Browniano `W_t` | Processo con incrementi indipendenti, `W_t - W_s ~ N(0, t-s)`, traiettorie continue | Mattone base del "rumore" |
| SDE | `dX = a(X,t)dt + b(X,t)dW` | Descrive drift + shock casuale |
| Lemma di Itô | `df = (f_t + a f_x + ½b² f_xx)dt + b f_x dW` | Regola della catena stocastica: il termine `½b² f_xx` è la differenza chiave dal calcolo classico |
| GBM | `dS = μS dt + σS dW` | Modello standard dei prezzi: rendimenti log-normali, prezzi > 0 |
| Log-prezzo | Itô su `ln S` → `d ln S = (μ - σ²/2)dt + σ dW` | Spiega perché si lavora sui **log-return** |
| Processo di Ornstein-Uhlenbeck | `dX = θ(m - X)dt + σ dW` | Modello di mean reversion (base del pairs trading, vedi modulo 04) |

## Lemma di Itô applicato ai prezzi

Con `f(S) = ln S`: `f_S = 1/S`, `f_SS = -1/S²`.

```
d ln S = (1/S)(μS)dt + ½(-1/S²)(σS)²dt + (1/S)(σS)dW
       = (μ - σ²/2) dt + σ dW
```

Il termine `-σ²/2` (correzione di Itô) è la ragione per cui il rendimento atteso del log-prezzo è inferiore a `μ`.

## Limiti del GBM (da tenere a mente)

| Assunzione GBM | Realtà di mercato |
|---|---|
| Volatilità costante | Volatilità variabile e clusterizzata (→ GARCH, modulo 02) |
| Rendimenti normali | Code grasse, skewness |
| Continuità | Salti (gap overnight, earnings) |
| Nessun costo | Spread, slippage, commissioni |

## Esercizi minimi

1. Simulare 10k traiettorie GBM (NumPy) e verificare `E[S_T] = S_0·e^{μT}`.
2. Verificare empiricamente la distribuzione dei log-return di un titolo reale vs normale (QQ-plot, Jarque-Bera).
3. Stimare `μ`, `σ` da dati storici e confrontare l'errore di stima di `μ` (alto) vs `σ` (basso).

## Risorse suggerite

- Shreve, *Stochastic Calculus for Finance II* (riferimento rigoroso).
- Hull, *Options, Futures and Other Derivatives* (applicazioni).
- Øksendal, *Stochastic Differential Equations* (opzionale, teoria).
