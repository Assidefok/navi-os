#!/bin/bash
# send-daily-brief-telegram.sh
# 1 missatge: header + seccions separades per Telegram si cal

WORKSPACE="/home/user/.openclaw/workspace"
OPENCLAW_JSON="$WORKSPACE/../openclaw.json"
TODAY=$(date +%Y-%m-%d)
DATE_DISPLAY=$(date +%d\/%m\/%Y)

get_token() {
    python3 -c "
import json, sys
try:
    with open('$OPENCLAW_JSON') as f:
        d = json.load(f)
    print(d.get('channels', {}).get('telegram', {}).get('botToken', ''))
except:
    sys.exit(1)
" 2>/dev/null
}

TELEGRAM_TOKEN=$(get_token)
CHAT_ID="267107022"

[ -z "$TELEGRAM_TOKEN" ] && echo "Error: No token" && exit 1

send() {
    local text="$1"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\": \"${CHAT_ID}\", \"text\": \"${text}\", \"parse_mode\": \"Markdown\", \"disable_web_page_preview\": true}" \
        | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('ok') else 'FAIL: '+str(d.get('description','')))" 2>/dev/null
}

# Fitxers del dia
AI_FILE=$(find "$WORKSPACE/memory/AI-News" -name "${TODAY}-*.md" 2>/dev/null | sort | tail -1)
WORLD_FILE=$(find "$WORKSPACE/memory/World-News" -name "${TODAY}-*.md" 2>/dev/null | sort | tail -1)
IRAN_FILE=$(find "$WORKSPACE/memory/Iran-War" -name "${TODAY}-*.md" 2>/dev/null | sort | tail -1)
STOCK_FILE=$(find "$WORKSPACE/memory/Stock-Market" -name "${TODAY}-*.md" 2>/dev/null | sort | tail -1)
TRUMP_FILE=$(find "$WORKSPACE/memory/Trump-Stocks" -name "${TODAY}-*.md" 2>/dev/null | sort | tail -1)

[ -z "$AI_FILE" ] && AI_FILE=$(find "$WORKSPACE/memory/AI-News" -name "*.md" 2>/dev/null | sort | tail -1)
[ -z "$WORLD_FILE" ] && WORLD_FILE=$(find "$WORKSPACE/memory/World-News" -name "*.md" 2>/dev/null | sort | tail -1)
[ -z "$IRAN_FILE" ] && IRAN_FILE=$(find "$WORKSPACE/memory/Iran-War" -name "*.md" 2>/dev/null | sort | tail -1)
[ -z "$STOCK_FILE" ] && STOCK_FILE=$(find "$WORKSPACE/memory/Stock-Market" -name "*.md" 2>/dev/null | sort | tail -1)
[ -z "$TRUMP_FILE" ] && TRUMP_FILE=$(find "$WORKSPACE/memory/Trump-Stocks" -name "*.md" 2>/dev/null | sort | tail -1)

get_djt_price() {
    local file="$1"
    local price=""
    local change=""
    if [ -f "$file" ]; then
        price=$(grep -m1 "Preu actual" "$file" 2>/dev/null | grep -oE '[0-9]+[.,][0-9]+' | head -1)
        change=$(grep -m1 "Canvi" "$file" 2>/dev/null | grep -oE '[+-][0-9]+[.,][0-9]+%?' | head -1)
    fi
    if [ -n "$price" ]; then
        echo "DJT: \$${price} (${change:-?})"
    else
        echo ""
    fi
}

extract() {
    local file="$1"
    local count="${2:-3}"
    local result=""
    local item=0
    local title=""
    local url=""
    local source=""
    local desc=""
    
    [ ! -f "$file" ] && return
    
    while IFS= read -r line || [ -n "$line" ]; do
        if echo "$line" | grep -qE "^### [0-9]+\."; then
            if [ $item -gt 0 ] && [ -n "$title" ] && [ -n "$url" ]; then
                result="${result}▸ ${title}"$'\n'"   ${source} · ${desc:0:120}"$'\n'"   [Llegir →](${url})"$'\n\n'
            fi
            item=$((item + 1))
            [ $item -gt $count ] && break
            title=$(echo "$line" | sed 's/^### [0-9]\+\. //' | sed 's/\*/\\\*/g' | tr '\n' ' ')
            url=""
            source=""
            desc=""
            continue
        fi
        if echo "$line" | grep -qE "\*\*Source\*\*:"; then
            source=$(echo "$line" | sed -E 's/.*\*\*Source\*\*:[[:space:]]*\[([^]]+)\].*/\1/' | tr -d '\n')
        elif echo "$line" | grep -qE "\*\*Link\*\*:"; then
            url=$(echo "$line" | sed -E 's/.*\*\*Link\*\*:[[:space:]]*(https?:\/\/[^)]+).*/\1/' | awk '{print $1}')
        elif echo "$line" | grep -q "^-\ " && [ -z "$desc" ]; then
            desc=$(echo "$line" | sed 's/^- //' | sed 's/\*/\\\*/g' | tr '\n' ' ' | sed 's/  */ /g' | cut -c1-120)
        fi
    done < "$file"
    
    if [ $item -gt 0 ] && [ -n "$title" ] && [ -n "$url" ]; then
        result="${result}▸ ${title}"$'\n'"   ${source} · ${desc:0:120}"$'\n'"   [Llegir →](${url})"$'\n\n'
    fi
    
    echo "$result"
}

# ── MISSATGES ──
HEADER="🧚 *Bon dia, Aleix!* | ${DATE_DISPLAY}

Un resum del mati per tu."

AI_CONTENT=$(extract "$AI_FILE" 3)
AI_BLOCK="🤖 *INTEL·LIGÈNCIA ARTIFICIAL*

${AI_CONTENT}"

WORLD_CONTENT=$(extract "$WORLD_FILE" 3)
WORLD_BLOCK="🌍 *MON*

${WORLD_CONTENT}"

IRAN_CONTENT=$(extract "$IRAN_FILE" 3)
IRAN_BLOCK="⚔️ *GUERRA D'IRÀ*

${IRAN_CONTENT}"

DJT=$(get_djt_price "$TRUMP_FILE")
STOCK_CONTENT=$(extract "$STOCK_FILE" 3)
if [ -n "$DJT" ]; then
    STOCK_BLOCK="📈 *BORSA*

${DJT}

${STOCK_CONTENT}"
else
    STOCK_BLOCK="📈 *BORSA*

${STOCK_CONTENT}"
fi

FOOTER="_Fonts: TechCrunch · BBC Mundo · Al Jazeera · Yahoo Finance | Navi OS · ${DATE_DISPLAY}_"

# ── ENVIAR ──
send "$HEADER"
sleep 1

SEND_CONTENT=""
for block in "$AI_BLOCK" "$WORLD_BLOCK" "$IRAN_BLOCK" "$STOCK_BLOCK"; do
    test_content="${SEND_CONTENT}${block}"
    if [ $(echo -n "$test_content" | wc -c) -gt 3800 ]; then
        # Enviar acumulat i reset
        send "$SEND_CONTENT"
        sleep 1
        SEND_CONTENT="$block"
    else
        SEND_CONTENT="$test_content"
    fi
done
# Darrer tros
[ -n "$SEND_CONTENT" ] && send "$SEND_CONTENT"
sleep 1
send "$FOOTER"

echo "=== Enviat: $TODAY ==="
