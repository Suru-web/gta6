# 👾 Reddit Keyword Scout for GTA 6 Help

Monitors subreddits (`r/IndianGaming`, `r/developersIndia`, `r/GTA6`, `r/IndiaTech`, etc.) for posts talking about GTA 6, PS5, side projects, etc., and sends an instant ping to your Telegram or Discord with direct links!

## ⚡ Zero Dependencies
Runs on Python 3 out of the box using built-in libraries (no `pip install` required).

## 🚀 How to Run

1. **Set your environment variables**:
```bash
export REDDIT_CLIENT_ID="your_reddit_client_id"
export REDDIT_CLIENT_SECRET="your_reddit_client_secret"

# Optional: Alerts to your phone/server
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
# or
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

2. **Run the script**:
```bash
python3 scripts/reddit-scanner/scanner.py
```
