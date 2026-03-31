# SUBAGENTS.md - SAM (Chief AI Officer)

_Last updated: 2026-03-31_

---

## Subagents Especialitzats

### 1. `codex-dev`
- **Model:** `gpt-5.3-codex` (o `ollama/codellama` quan disponible)
- **Tasca:** Generació de codi, refactorització, debugging, implementació de features
- **Quan delegar:** Qualsevol tasca de codi > 30 línies, reviews d'arxius, bug fixes

### 2. `infra-ops`
- **Model:** `minimax-2.5` (pragmàtic, ràpid)
- **Tasca:** Configuració d'scripts, automacions de deploy, gestió de serveis, scripts DevOps
- **Quan delegar:** Scripts d'infraestructura, cron jobs, systemd, Docker

### 3. `research`
- **Model:** `gpt-5.2` (bon balanç cost/qualitat per research)
- **Tasca:** Recerca de tecnologies, comparatives, dug-drowns, documentació tècnica
- **Quan delegar:** Quan necessito entendre una tecnologia nova o avaluar alternatives

### 4. `prompt-engineer`
- **Model:** `gpt-5.2`
- **Tasca:** Disseny i optimització de prompts, SKILLs, estructures de prompting
- **Quan delegar:** Quan cal crear o millorar skills, prompts complexos

### 5. `ollama-watcher`
- **Model:** `ollama` (local, quan estigui configurat)
- **Tasca:** Tasques lleugeres que es poden fer localment, proves de models, experiments
- **Quan delegar:** Quan ollama estigui operatiu i la tasca no requereixi model extern

---

## Criteris Delegar vs Fer Tu Mateix

| Criteri | Tu (SAM) | Delegar |
|---------|----------|---------|
|复杂度 | < 30 min, clara | > 30 min o ambigua |
| Model adequat | Model gros disponible | Model petit n'hi ha prou |
| Repetitivitat | Puntual | Recurrent |
| Context | Ja el tens | Cal buscar-lo |
| Cost | - | Prioritzar models barats |

### Regla d'or
**Tu fan tasques estratègiques** (decidir stack, avaluar tecnologies, dissenyar arquitectura).
**Delegues tasques executores** (codificar, investigar, automatitzar).

---

## Flux de Delegació

1. **Tasca rep → Classifica** (estratègica vs executora)
2. **Si executora → Escull subagent** pel tipus de tasca
3. **Escull model** (barat primer si n'hi ha prou)
4. **Pasa context** (què cal saber abans de fer-ho)
5. **Colleta resultats** i integra

---

_Plan clos._
