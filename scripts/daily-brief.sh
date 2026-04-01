#!/bin/bash
# Daily Brief Generator - genera el missatge i l'envia a Telegram
# Uso: ./daily-brief.sh

TELEGRAM_CHAT_ID="267107022"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
DATE=$(date +%d/%m/%Y)
TODAY=$(date +%Y-%m-%d)

# Funció per llegir últim fitxer d'una categoria
get_latest_news() {
    local index_file="$1"
    local category_dir="$2"
    
    if [[ ! -f "$index_file" ]]; then
        echo "[]"
        return
    fi
    
    # Agafar el darrer fitxer de avui
    local latest_file=$(grep -o '"path":"[^"]*"' "$index_file" 2>/dev/null | head -1 | cut -d'"' -f4)
    if [[ -n "$latest_file" && -f "$category_dir/$latest_file" ]]; then
        cat "$category_dir/$latest_file"
    else
        # Intentem agafar el darrer fitxer independentment de la data
        local last_file=$(ls -t "$category_dir"/*.md 2>/dev/null | head -1)
        if [[ -n "$last_file" && -f "$last_file" ]]; then
            cat "$last_file"
        else
            echo ""
        fi
    fi
}

# LLegir news (amb fallback si no existeixen)
AI_NEWS=$(get_latest_news "/home/user/.openclaw/workspace/memory/AI-News/index.json" "/home/user/.openclaw/workspace/memory/AI-News")
WORLD_NEWS=$(get_latest_news "/home/user/.openclaw/workspace/memory/World-News/index.json" "/home/user/.openclaw/workspace/memory/World-News")
IRAN_NEWS=$(get_latest_news "/home/user/.openclaw/workspace/memory/Iran-War/index.json" "/home/user/.openclaw/workspace/memory/Iran-War")
STOCK_NEWS=$(get_latest_news "/home/user/.openclaw/workspace/memory/Stock-Market/index.json" "/home/user/.openclaw/workspace/memory/Stock-Market")

# Compilar missatge
MESSAGE="*🧚 Bon dia, Aleix! | $DATE*

━━━━━━━━━━━━━━━━━━━━

*🤖 INTEL·LIGÈNCIA ARTIFICIAL*
"

# Afegir AI News (最多3 items)
if [[ -n "$AI_NEWS" ]]; then
    echo "$AI_NEWS" | head -20 >> /tmp/brief_ai.txt
    AI_CONTENT=$(cat /tmp/brief_ai.txt 2>/dev/null | tr '\n' ' ' | cut -c1-800)
    MESSAGE="${MESSAGE}
${AI_CONTENT}
"
else
    MESSAGE="${MESSAGE}
▸ Sense notícies disponibles
"
fi

MESSAGE="${MESSAGE}

*🌍 MON*
"

if [[ -n "$WORLD_NEWS" ]]; then
    echo "$WORLD_NEWS" | head -20 >> /tmp/brief_world.txt
    WORLD_CONTENT=$(cat /tmp/brief_world.txt 2>/dev/null | tr '\n' ' ' | cut -c1-1000)
    MESSAGE="${MESSAGE}
${WORLD_CONTENT}
"
else
    MESSAGE="${MESSAGE}
▸ Sense notícies disponibles
"
fi

MESSAGE="${MESSAGE}

*⚔️ GUERRA D'IRÀ*
"

if [[ -n "$IRAN_NEWS" ]]; then
    echo "$IRAN_NEWS" | head -20 >> /tmp/brief_iran.txt
    IRAN_CONTENT=$(cat /tmp/brief_iran.txt 2>/dev/null | tr '\n' ' ' | cut -c1-800)
    MESSAGE="${MESSAGE}
${IRAN_CONTENT}
"
else
    MESSAGE="${MESSAGE}
▸ Sense notícies disponibles
"
fi

MESSAGE="${MESSAGE}

*📈 BORSA*
"

if [[ -n "$STOCK_NEWS" ]]; then
    echo "$STOCK_NEWS" | head -20 >> /tmp/brief_stock.txt
    STOCK_CONTENT=$(cat /tmp/brief_stock.txt 2>/dev/null | tr '\n' ' ' | cut -c1-800)
    MESSAGE="${MESSAGE}
${STOCK_CONTENT}
"
else
    MESSAGE="${MESSAGE}
▸ Sense notícies disponibles
"
fi

MESSAGE="${MESSAGE}

━━━━━━━━━━━━━━━━━━━━

*Fonts: TechCrunch, BBC, Al Jazeera, Yahoo Finance | Navi OS · $DATE*"

# Enviar a Telegram
if [[ -z "$BOT_TOKEN" ]]; then
    echo "ERROR: TELEGRAM_BOT_TOKEN no configurat"
    echo "$MESSAGE"
    exit 1
fi

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${MESSAGE}" \
    -d "parse_mode=Markdown" \
    -d "disable_web_page_preview=true" > /dev/null

if [[ $? -eq 0 ]]; then
    echo "OK: Brief enviat a Telegram"
    exit 0
else
    echo "ERROR: Failed to send to Telegram"
    exit 1
fi
