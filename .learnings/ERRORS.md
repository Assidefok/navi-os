# ERRORS.md - Command Failures & Breakages

_Auto-logged mistakes. Check this before repeating past failures._

---

## Format
```
## [YYYY-MM-DD] Error description

**What happened:** 
**Impact:**
**Lesson:**
```

---

## Entries

<!-- Entries go here -->

## 2026-03-31: Never fabricate AI news sources

**What happened:** Generated fake AI news headlines ("OpenAI launches new model capabilities", "Anthropic releases Claude updates") without source links in the daily brief.

**Impact:** Daily brief showed false/generic news with no verifiable source.

**Lesson:** Rewrote `scripts/05-daily-news.sh` to fetch real feeds with real source URLs from Hacker News, TechCrunch, and The Verge. Aleix's rule is absolute: NEVER make up information. Always include source links.

