# TOOLS.md - WARREN

## Workspace Paths

```
/home/user/.openclaw/workspace/
├── team/warren/       # WARREN's workspace
├── data/
│   ├── org-chart.json # Team structure
│   └── pm-board.json  # Task board
├── memory/            # Daily logs
├── docs/              # System documentation
└── audits/            # Audit reports
```

---

## Key Files

| File | Purpose | Access |
|------|---------|--------|
| pm-board.json | All tasks and status | Read |
| org-chart.json | Team structure | Read |
| MEMORY.md | Quality memory and risks | Read/Write |
| BACKLOG.md | Pending quality tasks | Read/Write |
| risk-register.json | Active risks | Read/Write |

---

## External Resources

- **OpenClaw Docs:** `/home/user/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/docs`
- **Skills Hub:** https://clawhub.ai
- **Community:** https://discord.com/invite/clawd

---

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| audit-runner.sh | Execute quality audits | Scheduled |
| risk-calculator.sh | Risk scoring | Per request |

---

## API References

**PM Board API:**
```
GET  /api/pm-board?assignee=warren  # Warren's tasks
GET  /api/pm-board?quality_flag=true # Quality flagged tasks
PATCH /api/pm-board/:id              # Update status
```

---

## Quality Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Audit pass rate | >95% | % |
| Defect detection | <2% post-release | % |
| Risk coverage | 100% | % |
| Standards compliance | 100% | % |

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

_WARREN measures twice, cuts once. These tools help verify the cut._
