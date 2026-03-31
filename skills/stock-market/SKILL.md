---
name: stock-market
description: Fetch 5 important stock market / finance news items from Yahoo Finance, Bloomberg, and CNBC RSS. Creates structured markdown in memory/Stock-Market/ and updates index.json + index.md.
---

# Stock Market News Skill

Recull 5 notícies importants de borsa i finances i les guarda a `memory/Stock-Market/`.

## Script
```bash
python3 /home/user/.openclaw/skills/stock-news/scripts/fetch_news.py
```

## Output
- Markdown: `memory/Stock-Market/YYYY-MM-DD-HH.00.md`
- JSON index: `memory/Stock-Market/index.json`
- Obsidian index: `memory/Stock-Market/index.md`

## Sources
- Yahoo Finance RSS
- Bloomberg Markets RSS
- CNBC Markets RSS

## Format
- Títol + source link
- Summary
- 3 key points
- Tags i regions
