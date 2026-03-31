# TOOLS.md - JEFF

## Workspace Paths

```
/home/user/.openclaw/workspace/
├── team/jeff/         # JEFF's workspace
├── data/
│   ├── org-chart.json # Team structure
│   └── pm-board.json  # Task board
├── memory/            # Daily logs
├── docs/             # System documentation
└── scripts/          # Operational scripts
```

---

## Key Files

| File | Purpose | Access |
|------|---------|--------|
| pm-board.json | All tasks and status | Read/Write |
| org-chart.json | Team structure | Read |
| MEMORY.md | Operations memory | Read/Write |
| BACKLOG.md | Pending operational tasks | Read/Write |
| processes.json | Process definitions | Read/Write |

---

## External Resources

- **OpenClaw Docs:** `/home/user/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/docs`
- **Skills Hub:** https://clawhub.ai
- **Community:** https://discord.com/invite/clawd

---

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| ops-automation.sh | Operational automations | Scheduled |
| efficiency-metrics.sh | Generate efficiency reports | Daily |
| process-checker.sh | Verify process health | Hourly |

---

## API References

**PM Board API:**
```
GET  /api/pm-board?assignee=jeff     # JEFF's tasks
GET  /api/pm-board?status=in-progress # Active execution
PATCH /api/pm-board/:id              # Update status
POST /api/pm-board                   # Create task
```

---

## Efficiency Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Process efficiency | >85% | % |
| Automation coverage | >60% | % |
| On-time delivery | >95% | % |
| Resource utilization | >80% | % |

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

_JEFF turns chaos into process. These tools make that possible._
