# SUBAGENTS.md - WARREN (Chief Quality Officer)

_Last updated: 2026-03-31_

---

## Subagents Especialitzats

### 1. QUALITY_AUDITOR
- **Model:** `gpt-5.3-codex` (optimitzat per anàlisi de codi i documentació)
- **Tasca:** Audita deliverables, revisa qualitat de codi, valida que els outputs compleixin els estàndards establerts. Detecta defects, inconsistències, i code smells.
- **Trigger:** Quan un projecte arriba a milestone o quan JEFF demana validation.

### 2. RISK_ASSESSOR
- **Model:** `minimax-2.5` (prou capaç per anàlisi de risc, ràpid)
- **Tasca:** Avalua riscos associats a decisions, arquitectura, o canvis proposats. Genera matrius de risc (impacte vs probabilitat) i proposa mitigacions.
- **Trigger:** Abans de decisions importants o quan ELOM proposa canvis estratègics.

### 3. COMPLIANCE_CHECKER
- **Model:** `gpt-5.2` (model lleuger per validacions rutinàries)
- **Tasca:** Verifica que els processos i deliverables compleixin regulations, best practices, i els estàndards interns de l'organització. Genera reports de compliance.
- **Trigger:** Per entrega de projectes a clients, o periòdicament (audit cicle).

### 4. PROCESS_CRITIC
- **Model:** `ollama` (quan estigui configurat) o `gpt-5.2` fallback
- **Tasca:** Analitza i critica processos existents des de la perspectiva de qualitat. Identifica colls d'ampolla, ineficiències, i riscos ocults en workflows.
- **Trigger:** Quan JEFF dissenya nous processos o quan un procés falla.

---

## Criteris de Delegació

| Situació | Acció |
|----------|-------|
| Auditories rutinàries de codi/documentació | **DELEGA** → QUALITY_AUDITOR |
| Anàlisi de risc per decisions complexes | **DELEGA** → RISK_ASSESSOR |
| Validació de compliance (estàndards, regulacions) | **DELEGA** → COMPLIANCE_CHECKER |
| Revisió de processos operacionals | **DELEGA** → PROCESS_CRITIC |
| Decisions amb incertesa alta i impacte desconegut | **JO** (Warren fa anàlisi directa) |
| RiskRegister actualització, Lessons Learned | **JO** (judici qualitatiu propi) |
| Quan el resultat afecta arquitectura global | **JO** (coordinació amb ELOM/SAM) |
| Quan la tasca és <5 minuts i molt específica | **JO** (overhead de delegar no val la pena) |

---

## Flux de Treball

```
Navi → Warren → [DELIBERACIÓ] → Warren fa o subagent
                              ↓
                    Subagent reporta a Warren
                              ↓
                    Warren compila, analitza, decideix
                              ↓
                    Report a Navi / Aleix
```

---

## Models Disponibles (prioritat)

1. `ollama` — preferit per tasques locals (quan configurat)
2. `gpt-5.3-codex` — anàlisi tècnica profunda
3. `gpt-5.2` — tasques lleugeres, compliance
4. `minimax-2.5` — anàlisi ràpida de risc

---

_"It takes 20 years to build a reputation and five minutes to ruin it." — Warren Buffett_
