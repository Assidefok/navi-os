# BACKLOG.md - SAM

## Action Items

### Alta Prioritat (立即)

| ID | Tasca | Estat | Data Creació | AI Impacte |
|----|-------|-------|--------------|------------|
| S-001 | [Tasca] | [TODO/IN-PROGRESS/REVIEW/DONE] | YYYY-MM-DD | [%] |
| S-002 | [Tasca] | [TODO/IN-PROGRESS/REVIEW/DONE] | YYYY-MM-DD | [%] |

### Mitjana Prioritat

| ID | Tasca | Estat | Data Creació | AI Impacte |
|----|-------|-------|--------------|------------|
| S-003 | [Tasca] | [TODO/IN-PROGRESS/REVIEW/DONE] | YYYY-MM-DD | [%] |

### Baixa Prioritat

| ID | Tasca | Estat | Data Creació | AI Impacte |
|----|-------|-------|--------------|------------|
| S-004 | [Tasca] | [TODO/IN-PROGRESS/REVIEW/DONE] | YYYY-MM-DD | [%] |

---

## Automatitzacions

| ID | Automatitzacio | Estat | tasques/Mes | Eficiencia |
|----|----------------|-------|--------------|------------|
| A-001 | [Nom] | [Activa/Desenvolupant] | N | [%] |
| A-002 | [Nom] | [Activa/Desenvolupant] | N | [%] |

---

## Revisió de Backlog

- **Darrera revisió:** YYYY-MM-DD
- **Tasques completades:** N
- **Tasques pendents:** N
- **Automatitzacions actives:** N

---

## Episode 4 - Automate Agents

**Objectiu:** Automatitzar els agents per treballar de forma autònoma 24/7 amb self-healing i retry logic.

### Tasques concretes

| ID | Tasca | Estat | AI Impacte | Descripcio |
|----|-------|-------|------------|------------|
| S-005 | AI Routing Engine | TODO | 95% | Sistema de routing automatic que analitzi el contingut del missatge i el derivi al chief correcte (Strategic→ELOM, Quality→WARREN, Operations→JEFF, AI/Tech→SAM). Basat en keyword matching + LLM classification com a fallback. |
| S-006 | Model Selection Automation | TODO | 90% | Lògica automàtica de selecció de model segons complexitat de la tasca. Tasques simples (cerques, resums) → model ràpid/barat. Tasques complexes (anàlisi, codi) → model powerful. Configurable per chief. |
| S-007 | Prompt Templating System | TODO | 85% | Biblioteca de templates reutilitzables per a tasques recurrents (standups, reports daily, cron summaries, incident reports). Cada chief té els seus templates optimitzats pel seu estil. |

### Self-Healing Spec

- **Retry logic:** 3 intents amb backoff exponencial (1s, 4s, 16s)
- **Circuit breaker:** Si 5 errors seguits → marcar agent com a "degraded" i notificar Aleix
- **Health ping:** Cada heartbeat inclou health score (errors/últimes 24h)
- **Auto-recovery:** Si un agent falla, el sistema deriva tasques temporalment

---

## Notes

[Tancat per a notes tecniques]

---

_SAM's backlog is organized by AI impact, highest first._
