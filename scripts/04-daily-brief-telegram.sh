#!/bin/bash
# Daily Brief Telegram Sender
# Reads today's compiled brief and sends it to Telegram
# Called after morning-brief skill compiles the message

set -e

WORKSPACE="/home/user/.openclaw/workspace"
TELEGRAM_TOKEN="${TELEGRAM_BOT_TOKEN}"
CHAT_ID="${TELEGRAM_CHAT_ID}"
TODAY=$(date +%Y-%m-%d)
BRIEF_FILE="$WORKSPACE/memory/daily-${TODAY}.md"

# Fallback chat ID from known config
if [ -z "$CHAT_ID" ]; then
    CHAT_ID=$(cat "$WORKSPACE/.telegram_chat_id" 2>/dev/null || echo "")
fi

if [ -z "$TELEGRAM_TOKEN" ] || [ -z "$CHAT_ID" ]; then
    echo "Telegram config missing (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)"
    exit 1
fi

if [ ! -f "$BRIEF_FILE" ]; then
    echo "Brief file not found: $BRIEF_FILE"
    exit 1
fi

# Read brief content
BRIEF_CONTENT=$(cat "$BRIEF_FILE")

# Strip Obsidian frontmatter if present
BRIEF_CONTENT=$(echo "$BRIEF_CONTENT" | sed '1s/^---\n.*\n---\n//')

# Truncate to 4096 (Telegram limit)
if [ ${#BRIEF_CONTENT} -gt 4000 ]; then
    BRIEF_CONTENT="${BRIEF_CONTENT:0:3990}..."
fi

# Send to Telegram
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=${BRIEF_CONTENT}" \
    -d "parse_mode=Markdown" \
    -d "disable_web_page_preview=true")

echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok'):
        print('Telegram: OK')
    else:
        print('Telegram error:', data.get('description', 'unknown'))
except:
    print('Telegram response:', sys.stdin.read()[:200])
" 2>/dev/null || echo "Telegram send attempted"
