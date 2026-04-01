#!/usr/bin/env python3
"""Daily Brief Generator - llegeix notícies i envia a Telegram"""

import json
import os
import sys
import subprocess
from datetime import datetime

TELEGRAM_CHAT_ID = "267107022"
DATE = datetime.now().strftime("%d/%m/%Y")

def get_bot_token():
    """Llegeix el token de OpenClaw config"""
    config_path = os.path.expanduser("~/.openclaw/openclaw.json")
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config.get("channels", {}).get("telegram", {}).get("botToken", "")
    except:
        return os.environ.get("TELEGRAM_BOT_TOKEN", "")

BOT_TOKEN = get_bot_token()
MEMORY_BASE = "/home/user/.openclaw/workspace/memory"

def get_latest_news(category):
    """Llegeix l'últim fitxer de notícies per una categoria"""
    index_path = f"{MEMORY_BASE}/{category}/index.json"
    
    if not os.path.exists(index_path):
        return None
    
    with open(index_path, 'r') as f:
        index = json.load(f)
    
    entries = index.get("entries", [])
    if not entries:
        return None
    
    # Agafar el més recent
    latest = entries[0]
    filename = latest.get("filename")
    if not filename:
        return None
    
    news_path = f"{MEMORY_BASE}/{category}/{filename}"
    if not os.path.exists(news_path):
        return None
    
    with open(news_path, 'r') as f:
        content = f.read()
    
    return {
        "headlines": latest.get("headlines", []),
        "content": content,
        "date": latest.get("date", ""),
        "source": latest.get("source", category)
    }

def parse_news_content(news_data, max_items=3):
    """Parseja el contingut markdown i extreu els items"""
    if not news_data:
        return []
    
    items = []
    content = news_data.get("content", "")
    headlines = news_data.get("headlines", [])
    
    # Processar cada item del fitxer
    lines = content.split("\n")
    current_item = None
    current_lines = []
    in_summary = False
    
    for line in lines:
        if line.startswith("### "):
            if current_item:
                items.append(current_item)
            current_item = {"title": line[4:].strip(), "link": "", "summary": ""}
            in_summary = False
        elif "**Source:**" in line or "**Link:**" in line:
            # Extreure URL
            if "**Link:**" in line:
                url = line.split("**Link:**")[-1].strip()
                if current_item:
                    current_item["link"] = url
            elif "**Source:**" in line:
                source = line.split("**Source:**")[-1].strip()
                source_url = ""
                if "[" in source and "]" in source:
                    source_url = source.split("(")[-1].split(")")[0]
                if current_item:
                    current_item["source"] = source.split("[")[0].strip() if "[" in source else source
                    if not current_item.get("source_url"):
                        current_item["source_url"] = source_url
        elif line.startswith("**Summary:**"):
            in_summary = True
            current_item["summary"] = line.replace("**Summary:**", "").strip()
        elif in_summary and line.strip() and not line.startswith("**") and not line.startswith("---"):
            current_item["summary"] += " " + line.strip()
    
    if current_item:
        items.append(current_item)
    
    return items[:max_items]

def format_telegram_message(news_categories):
    """Formata el missatge complet per Telegram"""
    message = f"*🧚 Bon dia, Aleix! | {DATE}*\n"
    message += "━━━━━━━━━━━━━━━━━━━━\n"
    
    category_configs = [
        ("AI-News", "🤖 INTEL·LIGÈNCIA ARTIFICIAL", "ai"),
        ("World-News", "🌍 MON", "world"),
        ("Iran-War", "⚔️ GUERRA D'IRÀ", "iran"),
        ("Stock-Market", "📈 BORSA", "stock"),
    ]
    
    for category_id, category_name, key in category_configs:
        message += f"\n*{category_name}*\n"
        
        news_data = news_categories.get(key)
        if not news_data or not news_data.get("content"):
            message += "▸ Sense notícies disponibles\n"
            continue
        
        items = parse_news_content(news_data, max_items=3)
        if not items:
            message += "▸ Sense notícies disponibles\n"
            continue
        
        for item in items:
            title = item.get("title", "")[:80]
            link = item.get("link", "")
            summary = item.get("summary", "")[:150]
            
            message += f"▸ {title}\n"
            if link:
                message += f"[Font]({link})\n"
            if summary:
                message += f"- {summary}...\n"
            message += "\n"
    
    message += "━━━━━━━━━━━━━━━━━━━━\n"
    message += f"*Fonts: TechCrunch, BBC, Al Jazeera, Yahoo Finance | Navi OS · {DATE}*"
    
    # Limitar a ~4000 caràcters
    if len(message) > 4000:
        message = message[:3990] + "[...]"
    
    return message

def send_telegram(message):
    """Envia el missatge a Telegram"""
    if not BOT_TOKEN:
        print("ERROR: TELEGRAM_BOT_TOKEN no configurat")
        print(message)
        return False
    
    cmd = [
        "curl", "-s", "-X", "POST",
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
        "-d", f"chat_id={TELEGRAM_CHAT_ID}",
        "-d", f"text={message}",
        "-d", "parse_mode=Markdown",
        "-d", "disable_web_page_preview=true"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0

def main():
    print(f"Generant Daily Brief per {DATE}...")
    
    # Carregar totes les categories
    categories = {}
    for key in ["ai", "world", "iran", "stock"]:
        category_map = {
            "ai": "AI-News",
            "world": "World-News", 
            "iran": "Iran-War",
            "stock": "Stock-Market"
        }
        news = get_latest_news(category_map[key])
        categories[key] = news
        print(f"  {key}: {'OK' if news else 'BUIT'}")
    
    # Generar missatge
    message = format_telegram_message(categories)
    
    # Guardar per debug
    with open("/tmp/daily_brief_debug.txt", "w") as f:
        f.write(message)
    print(f"\nMissatge generat ({len(message)} chars)")
    
    # Enviar
    if send_telegram(message):
        print("✅ Brief enviat a Telegram")
        return 0
    else:
        print("❌ Error enviant a Telegram")
        return 1

if __name__ == "__main__":
    sys.exit(main())
