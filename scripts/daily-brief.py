#!/usr/bin/env python3
"""Daily Brief Generator - llegeix notícies i envia a Telegram (missatges separats, traduïts)"""

import json
import os
import sys
import subprocess
from datetime import datetime
from deep_translator import GoogleTranslator

TELEGRAM_CHAT_ID = "267107022"
DATE = datetime.now().strftime("%d/%m/%Y")

# Translator cache per no repetir traduccions
_translator_cache = {}

def translate(text, source="en", target="ca"):
    """Tradueix text amb cache per evitar repeticions"""
    if not text:
        return text
    
    cache_key = f"{source}|{target}|{text}"
    if cache_key in _translator_cache:
        return _translator_cache[cache_key]
    
    try:
        t = GoogleTranslator(source=source, target=target)
        result = t.translate(text)
        _translator_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"  ⚠️ Traducció fallida: {e}")
        return text

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
    
    lines = content.split("\n")
    current_item = None
    in_summary = False
    
    for line in lines:
        if line.startswith("### "):
            if current_item:
                items.append(current_item)
            current_item = {"title": line[4:].strip(), "link": "", "summary": ""}
            in_summary = False
        elif "**Source:**" in line or "**Link:**" in line:
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

def format_category_message(category_name, emoji, items, source_name):
    """Formata un missatge per una categoria (amb traduccions)"""
    message = f"*{emoji} {category_name}*\n"
    message += "━━━━━━━━━━━━━━━━━━━━\n\n"
    
    if not items:
        message += "▸ Sense notícies disponibles\n"
        return message
    
    for item in items:
        title_en = item.get("title", "")[:80]
        link = item.get("link", "")
        summary_en = item.get("summary", "")[:150]
        
        # Traduir al català
        title_ca = translate(title_en)
        summary_ca = translate(summary_en)
        
        message += f"▸ {title_ca}\n"
        if link:
            message += f"[{source_name}]({link})\n"
        if summary_ca:
            message += f"- {summary_ca}...\n"
        message += "\n"
    
    return message.strip()

def main():
    print(f"Generant Daily Brief per {DATE}...")
    
    category_configs = [
        ("AI-News", "INTEL·LIGÈNCIA ARTIFICIAL", "ai", "TechCrunch", "🤖"),
        ("World-News", "MON", "world", "BBC", "🌍"),
        ("Iran-War", "GUERRA D'IRÀ", "iran", "Al Jazeera", "⚔️"),
        ("Stock-Market", "BORSA", "stock", "Yahoo Finance", "📈"),
    ]
    
    total_sent = 0
    total_items = 0
    
    for category_id, category_name, key, source_name, emoji in category_configs:
        news = get_latest_news(category_id)
        print(f"  {key}: {'OK' if news else 'BUIT'}")
        
        items = []
        if news:
            items = parse_news_content(news, max_items=3)
        
        message = format_category_message(category_name, emoji, items, source_name)
        
        if send_telegram(message):
            total_sent += 1
            total_items += len(items) if items else 0
            print(f"  ✅ {category_name} enviat ({len(items)} items)")
        else:
            print(f"  ❌ Error enviant {category_name}")
    
    print(f"\n✅ {total_sent}/4 categories enviades ({total_items} notícies)")
    
    # Guardar resum per debug
    with open("/tmp/daily_brief_debug.txt", "w") as f:
        f.write(f"Data: {DATE}\n")
        f.write(f"Categories enviades: {total_sent}/4\n")
        f.write(f"Total notícies: {total_items}\n")
    
    return 0 if total_sent == 4 else 1

if __name__ == "__main__":
    sys.exit(main())
