# Trump Jr. Stock Tracker — Projecte Futur

_Data: 31 març 2026_
_Estat: PROPOSAT — Pendent d'iniciar_

---

## Objectiu

Construir un sistema de vigilància i anàlisi dels moviments bursàtils de Donald Trump Jr. per detectar possibles patrons d'operació amb informació privilegiada (insider trading).

## Per què

- Trump Jr. opera en small-caps i SPACs amb alta volatilitat
- S'han detectat patrons sospitosos: pujades del +200-290% abans d'anuncis oficials
- Les dades són 100% públiques via SEC EDGAR
- És un cas d'estudi interessant per a OpenClaw com a agent d'intel·ligència financera

---

## Recerca Realitzada (31/03/2026)

### On opera Trump Jr.

| Empresa | Ticker | Tipus | Posició |
|---------|--------|-------|---------|
| Dominari Holdings | DOMH | Accions Nasdaq | 966K accions (6.7%) + warrants |
| Unusual Machines | UM | Accions Nasdaq | 200K RSU + 131K accions |
| New America Acquisition I | NWAX | SPAC NYSE | Advisory board |
| Trump Media & Technology | DJT | Accions Nasdaq | 11,552 RSUs |
| GrabAGun | — | Accions NYSE | Board member |

### Patrons Detectats

1. **DOMH (+290% en 2 dies)** — Private placement 10 febrer $3.47, anunci 11 febrer → $13.58. Volum va sorgir 6 setmanes abans.
2. **UM (+220% en 4 setmanes)** — Anunci 26 novembre 2024, volum va créixer de 93K a 290K/da setmanes abans.
3. **NWAX SPAC ($300M)** — Anunciat agost 2025, IPO desembre 2025.
4. **Contractes federals** — $735M en contractes federals per companyies del seu portafoli (2025).

### Mecanisme Detectat

- Private placements just abans d'anuncis positius
- Advisory board roles en empreses de baixa liquiditat
- SPACs per obtenir capital sense les limitacions d'un board director clàssic

---

## Anàlisi Legal

**Risc del tracker:** BAIX (dades públiques)
**Risc si es publica acusació sense proves:** ALT (difamació, SLAPP lawsuit)

### Fonts Legals
- SEC EDGAR — Tots els filings
- WHalewisdom — 13F de "whales"
- OpenSecrets — Donacions, lobby
- Congress.gov — Calendari de hearings

### Regla Important
- Anàlisi com "investigació/periodisme financer" MAI com "acusació"
- "S'observa correlació" MAI no "fa insider trading"
- Consultar advocat de securities law abans de publicar

---

## Arquitectura Proposada

```
┌─────────────────────────────────────────────────────────┐
│              TRUMP JR. TRACKER v1                        │
├─────────────────────────────────────────────────────────┤
│  [1] Data Sources          [2] Processing Engine         │
│  • SEC EDGAR API           • Detecció volum anomalies   │
│  • News / Twitter RSS      • Pattern matching (IEP)     │
│  • Polygon.io / Yahoo      • Correlació filings vs preu │
│  • Congress.gov            • Risk scoring               │
├─────────────────────────────────────────────────────────┤
│  [3] Alerting Layer         [4] Dashboard                │
│  • Telegram push            • Holdings breakdown         │
│  • Email (optional)         • Timeline viz              │
│  • Signal log               • Anomaly indicators        │
└─────────────────────────────────────────────────────────┘
```

### Components

| Component | Eina | Cost |
|-----------|------|------|
| SEC EDGAR | sec-api o scraping | $0-$50/mes |
| Preus/volu m | Polygon.io o Yahoo Finance | $0-$200/mes |
| RSS noticies | NewsAPI + scraping | $0 |
| Base dades | SQLite local | $0 |
| Alerting | Telegram Bot API | $0 |
| Dashboard | Streamlit o React | $0 |

---

## Fases Proposades

### Fase 1: Dashboard Privat (Risc BAIX)
- [ ] Configurar pipeline SEC EDGAR
- [ ] Monitoritzar: DOMH, UM, NWAX, DJT, GrabAGun
- [ ] Integrar API de preus (Polygon.io/Yahoo)
- [ ] Dashboard Streamlit local
- [ ] Alerts Telegram

### Fase 2: Anàlisi Històrica (6-12 mesos)
- [ ] Omplir base de dades històrica
- [ ] Calibrar benchmarks de volum normal
- [ ] Detectar anomalies temporals

### Fase 3: Publicació (Risc MITJÀ)
- [ ] Consultar advocat securities law
- [ ] Publicar com "investigació financera"
- [ ] Afegir disclaimers legals

### Fase 4: SEC Whistleblower (si evidència sòlida)
- [ ] Documentar irregularitats
- [ ] Reportar a SEC (recompensa 10-30%)

---

## Responsabilitat Legal

_Aquest projecte és recerca financera i periodística. NO constitueix assessorament d'inversió. Qualsevol decisió d'inversió basada en aquesta informació és responsabilitat exclusiva de l'usuari. Consultar un advocat especialitzat en dret de valors dels Estats Units abans de qualsevol publicació._

---

## Referències

- SEC EDGAR: https://www.sec.gov/cgi-bin/browse-edgar
- WHalewisdom: https://whalewisdom.com
- OpenSecrets: https://www.opensecrets.org
- Congress.gov: https://www.congress.gov

---

## Equip que va participar

- **ELOM** (Chief Visionary) — Anàlisi tècnica i arquitectura
- **WARREN** (Chief Quality) — Anàlisi legal i de riscos

_Data creació: 2026-03-31_
_Ultima actualització: 2026-03-31_
