# Navi OS

Personal operating system dashboard for Aleix — built with React + Vite + Express (API server).

## Quick Start

```bash
cd navi-os
npm install
npm run dev        # Vite dev server (port 5173)
npm run dev:server # Express API server (port 3001) — serves on :3001
npm start          # Both concurrently (or pm2)
```

**URL:** http://localhost:8100

## Architecture

- **Frontend:** React 19 + Vite, served from `/dist` (production) or proxied (dev)
- **Backend:** Express 5 API server (`server.js`) on port 3001
- **Routing:** React Router v7 — tabs via URL path (`/ops`, `/brain`, `/lab`, `/proposals`)

## Modules

| Route | Module | Description |
|-------|--------|-------------|
| `/ops` | Ops | Mission Control, Org Chart, PM Board, Files, Security, Cron health |
| `/brain` | Brain | Memory files, briefs, ideas, sessions |
| `/lab` | Lab | Experiments / prototypes |
| `/proposals` | ProposalsBoard | Kanban-style proposal tracker (5-column Scrum board) |

## Dock Navigation

Bottom dock with 4 tabs: Operacions, Cervell, Propostes, Laboratori.

## Proposals Board (`/proposals`)

Kanban board for tracking proposals/ideas with 5 status columns:

| Status | Label | Color |
|--------|-------|-------|
| `rejected` | Rebutjada | Red |
| `pending` | Pendent | Amber |
| `accepted` | Per fer | Sky blue |
| `processing` | En procés | Purple |
| `done` | Completada | Green |

### Data Model

```js
{
  id: string,          // e.g. "prop-1712345678900"
  title: string,
  description: string,
  author: string,      // chief ID: 'elom' | 'warren' | 'jeff' | 'sam'
  priority: string,    // 'alta' | 'media' | 'baixa'
  status: string,     // one of the 5 statuses above
  createdAt: string,  // ISO 8601
  updatedAt: string,  // ISO 8601
}
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/proposals` | List all proposals |
| POST | `/api/proposals` | Create new proposal |
| PATCH | `/api/proposals/:id` | Update proposal (status, fields) |
| DELETE | `/api/proposals/:id` | Delete proposal |
| GET | `/api/pm-board` | PM board tasks |
| POST | `/api/pm-board` | Create PM task |
| PATCH | `/api/pm-board/:id` | Update PM task |

### Persistence

Proposals are stored in `/home/user/.openclaw/workspace/data/proposals.json`.

## Tech Stack

- React 19 + Vite 8
- Express 5 (API server)
- Lucide React (icons)
- React Router v7
- CSS custom properties (glassmorphism + neon effects)
- `pm2` for production process management
