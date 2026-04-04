# Chiefs Council — Navi OS Module

Espai col·laboratiu dins Navi OS on **Navi** proposa temes i els **4 Chiefs** responen des de la seva perspectiva.

---

## Estructura

```
src/modules/Ops/ChiefsCouncil/
  ChiefsCouncil.jsx   — Component principal
  ChiefsCouncil.css   — Estils
  README.md           — Aquest fitxer
```

---

## Funcionalitat

### Topic Composer (Navi)
Navi proposa un tema amb títol i descripció. Es mostra com un composer visual a dalt del modul.

### Chief Responses Grid
Quatre cards, una per chief. Cada card mostra:
- Nom, emoji i rol del chief
- Perspectiva activa (què aporta des del seu rol)
- Resposta escrita + timestamp
- Badge d'estat: `Esperant` / `Respondent` / `Completat`

### History
Llista de temes anteriors, clicables per navegar-hi. Es mostra el comptador de respostes i si està completat.

### Status Badges
- **Esperant** — El chief encara no ha respost
- **Respondent** — El chief està escrivint resposta
- **Completat** — Tots els 4 chiefs han respost

---

## Perspectives dels Chiefs

| Chief | Rol | Perspectiva |
|-------|-----|-------------|
| ELOM 🚀 | Chief Visionary Officer | Visió 10x, apostes gegants, disrupció |
| WARREN 📊 | Chief Quality Officer | Qualitat, risc, anàlisi profunda |
| JEFF ⚡ | Chief Operations Officer | Execució, escalabilitat, processos |
| SAM 🤖 | Chief AI Officer | IA, tecnologia, pragmatisme |

---

## API Endpoints

| Mètode | Endpoint | Descripció |
|--------|----------|-------------|
| GET | `/api/chiefs-council` | Llistat de tots els temes |
| GET | `/api/chiefs-council/:id` | Detall d'un tema |
| POST | `/api/chiefs-council` | Crear tema nou (Navi ho fa) |
| POST | `/api/chiefs-council/:id/responses` | Afegir resposta d'un chief |

### Crear tema
```json
POST /api/chiefs-council
{ "title": "Hauriem de...", "description": "Context..." }
```

### Respondre
```json
POST /api/chiefs-council/:id/responses
{ "chiefId": "elom", "text": "La meva resposta..." }
```

---

## Persistència

- **Arxiu:** `navi-os/src/data/chiefs-council.json`
- **S'adjuna** a la còpia de seguretat del workspace

---

## Integració

Afegit a **Ops** com a pestanya "Chiefs Council" (icona 💬), visible a la barra de navegació d'Ops.

Per activar-lo: `http://localhost:8100/#/ops` → pestanya "Chiefs Council"
