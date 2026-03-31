# TOOLS.md - ELOM

## Workspace Paths

```
/home/user/.openclaw/workspace/
├── team/elom/          # ELOM's workspace
├── data/
│   ├── org-chart.json  # Team structure
│   └── pm-board.json   # Task board
├── memory/             # Daily logs
├── docs/              # System documentation
└── projects/          # Project-specific research
```

---

## Key Files

| File | Purpose | Access |
|------|---------|--------|
| pm-board.json | All tasks and status | Read/Write |
| org-chart.json | Team structure | Read |
| MEMORY.md | ELOM's memory | Read/Write |
| BACKLOG.md | Pending initiatives | Read/Write |

---

## External Resources

- **OpenClaw Docs:** `/home/user/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/docs`
- **Skills Hub:** https://clawhub.ai
- **Community:** https://discord.com/invite/clawd

---

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| [TBD] | Strategic analysis | Per request |
| [TBD] | Vision doc generator | Per request |

---

## API References

**PM Board API:**
```
GET  /api/pm-board           # All tasks
PATCH /api/pm-board/:id      # Update task
POST /api/pm-board           # Create task
```

**Filtering:**
- `?assignee=elom` - Tasks for ELOM
- `?status=in-progress` - Active tasks
- `?priority=high` - High priority

---

## Models Available

- **minimax-m2.7** - Default (good for strategic thinking)
- **minimax-m2.7-highspeed** - Fast responses

---

## OpenClaw Commands

```bash
# Check status
openclaw status

# View gateway
openclaw gateway status

# Health check
openclaw health
```

---

_ELOM knows where we're going. These tools help communicate that vision._
