# TOOLS.md - SAM

## Workspace Paths

```
/home/user/.openclaw/workspace/
├── team/sam/          # SAM's workspace
├── data/
│   ├── org-chart.json # Team structure
│   └── pm-board.json  # Task board
├── memory/            # Daily logs
├── docs/              # System documentation
├── skills/            # OpenClaw skills
└── projects/         # Project-specific AI work
```

---

## Key Files

| File | Purpose | Access |
|------|---------|--------|
| pm-board.json | All tasks and status | Read/Write |
| org-chart.json | Team structure | Read |
| MEMORY.md | AI memory and projects | Read/Write |
| BACKLOG.md | Pending technical tasks | Read/Write |
| architecture.json | System architecture | Read/Write |

---

## External Resources

- **OpenClaw Docs:** `/home/user/.nvm/versions/node/v24.14.1/lib/node_modules/openclaw/docs`
- **Skills Hub:** https://clawhub.ai
- **Community:** https://discord.com/invite/clawd
- **Model Providers:** OpenAI, Anthropic, Google, etc.

---

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| ai-eval.sh | Evaluate AI tools | Per request |
| automation-deploy.sh | Deploy automations | Scheduled |
| model-monitor.sh | Monitor AI performance | Daily |

---

## API References

**PM Board API:**
```
GET  /api/pm-board?assignee=sam        # SAM's tasks
GET  /api/pm-board?tag=automation      # Automation tasks
PATCH /api/pm-board/:id                # Update status
POST /api/pm-board                      # Create task
```

---

## AI Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Automations deployed | >10 | N |
| Automation efficiency | >80% | % |
| AI adoption | >70% | % |
| System uptime | >99% | % |

---

## OpenClaw Commands

```bash
# Check status
openclaw status

# View gateway
openclaw gateway status

# Health check
openclaw health

# List skills
openclaw skills list
```

---

_SAM turns AI potential into business reality. These tools are his toolkit._
