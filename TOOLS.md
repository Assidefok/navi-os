# TOOLS.md - Local Notes

_Your personal cheat sheet for this environment._

---

## Navi OS (React + Vite)

- **Port fix:** 8100 (NUNCA canviar - és el port oficial de Navi OS)
- **Directori:** /home/user/.openclaw/workspace/navi-os (React)
- **URL:** http://localhost:8100
- **Run dev:** `cd /home/user/.openclaw/workspace/navi-os && npm run dev`
- **Old vanilla version:** /home/user/.openclaw/workspace/Navi-OS (depreciated)

---

## OpenClaw

- **Docs:** /home/user/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/docs
- **Community:** https://discord.com/invite/clawd
- **Skills Hub:** https://clawhub.ai

---

## Voice / Speech

_(not configured yet)_

---

## API Keys & Services

_(to be filled in as Aleix configures)_

| Service | Key | Notes |
|---------|-----|-------|
| _(placeholder)_ | _(placeholder)_ | _(fill in as needed)_ |

---

## Skills Installed

| Skill | Purpose |
|-------|---------|
| clawhub | Search/install/update skills |
| github | GitHub operations via `gh` CLI |
| gog | Google Workspace (Gmail, Calendar, Drive) |
| weather | Weather forecasts |
| video-frames | Extract frames/clips from video |
| tmux | Remote-control tmux sessions |
| healthcheck | Host security hardening |
| node-connect | Diagnose node connection issues |

---

## Local Environment

- **OS:** Linux 6.8.0-106-generic (x64)
- **Node:** v24.14.1
- **Shell:** zsh
- **Working directory:** /home/user/.openclaw/workspace

---

## Constraints

- Catalan only for responses to Aleix (he writes in Spanish via Windows dictation)
- NO Chinese characters ever
- No markdown tables in Discord/WhatsApp
- Use `exec` for running servers, builds, etc.

---

## Quick Commands

```bash
# Start Navi OS preview
cd /home/user/.openclaw/workspace/Navi-OS && npx -y serve -l 8100

# Check OpenClaw status
openclaw status

# Restart gateway
openclaw gateway restart
```

---

_Add your own notes as you discover them._
