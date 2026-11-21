#!/usr/bin/env python3
"""
GTA 6 & Tech Reddit Keyword Scout
Monitors relevant subreddits for high-relevance posts and alerts via Telegram / Discord.
Zero external pip dependencies: runs directly with standard library python3.
"""

import os
import sys
import json
import time
import base64
import urllib.request
import urllib.parse
from datetime import datetime

# ==============================================================================
# CONFIGURATION
# ==============================================================================
# Subreddits to track
TARGET_SUBREDDITS = [
    "IndianGaming",
    "developersIndia",
    "GTA6",
    "IndiaTech",
    "gaming",
]

# Keywords to trigger alerts (case-insensitive)
KEYWORDS = [
    "gta 6",
    "gta vi",
    "gta6",
    "vice city",
    "ps5",
    "playstation 5",
    "side project",
    "showcase saturday",
    "rockstar games",
    "crowdfund",
    "donation site",
]

# Minimum upvotes to consider (0 alerts immediately for every new post)
MIN_SCORE = 0

# Check frequency in seconds (e.g., 180 = 3 minutes)
POLL_INTERVAL_SECONDS = 180

# State file to avoid duplicate alerts across restarts
SEEN_POSTS_FILE = os.path.join(os.path.dirname(__file__), "seen_posts.json")


# ==============================================================================
# REDDIT AUTH & API HELPERS
# ==============================================================================
def get_reddit_token(client_id: str, client_secret: str, user_agent: str) -> str:
    """Fetch read-only OAuth token from Reddit using Client Credentials flow."""
    auth_str = f"{client_id}:{client_secret}"
    b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

    data = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode("utf-8")
    req = urllib.request.Request(
        "https://www.reddit.com/api/v1/access_token",
        data=data,
        headers={
            "User-Agent": user_agent,
            "Authorization": f"Basic {b64_auth}",
        },
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res["access_token"]


def fetch_subreddit_posts(subreddit: str, token: str, user_agent: str) -> list:
    """Fetch latest 25 posts from a subreddit using the OAuth token."""
    url = f"https://oauth.reddit.com/r/{subreddit}/new?limit=25"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": user_agent,
            "Authorization": f"Bearer {token}",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return [child["data"] for child in data.get("data", {}).get("children", [])]
    except Exception as e:
        print(f"[!] Error fetching r/{subreddit}: {e}")
        return []


# ==============================================================================
# NOTIFICATION DISPATCHERS
# ==============================================================================
def send_telegram_alert(bot_token: str, chat_id: str, text: str):
    """Send alert via Telegram Bot API."""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    urllib.request.urlopen(req, timeout=10)


def send_discord_alert(webhook_url: str, post: dict, matched_keywords: list):
    """Send rich embed alert to Discord Webhook."""
    payload = json.dumps({
        "username": "Reddit GTA 6 Scout",
        "embeds": [
            {
                "title": f"🚨 [r/{post['subreddit']}] {post['title'][:200]}",
                "url": f"https://reddit.com{post['permalink']}",
                "color": 0x00f0ff,  # Neon Cyan
                "fields": [
                    {"name": "Subreddit", "value": f"r/{post['subreddit']}", "inline": True},
                    {"name": "Upvotes", "value": str(post.get("score", 0)), "inline": True},
                    {"name": "Matched Keywords", "value": ", ".join(matched_keywords), "inline": False},
                ],
                "footer": {"text": "Click title to open Reddit thread & drop a comment!"},
                "timestamp": datetime.utcnow().isoformat(),
            }
        ],
    }).encode("utf-8")

    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    urllib.request.urlopen(req, timeout=10)


# ==============================================================================
# MAIN SCAN LOOP
# ==============================================================================
def load_seen_posts() -> set:
    if os.path.exists(SEEN_POSTS_FILE):
        try:
            with open(SEEN_POSTS_FILE, "r") as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()


def save_seen_posts(seen_ids: set):
    # Keep only the last 500 IDs to keep file size tiny
    trimmed = list(seen_ids)[-500:]
    with open(SEEN_POSTS_FILE, "w") as f:
        json.dump(trimmed, f)


def check_keywords(text: str) -> list:
    lower_text = text.lower()
    return [kw for kw in KEYWORDS if kw in lower_text]


def main():
    print("=" * 60)
    print("🚀 GTA 6 & TECH REDDIT KEYWORD SCOUT STARTED")
    print(f"Tracking Subreddits: {', '.join(TARGET_SUBREDDITS)}")
    print(f"Keywords: {', '.join(KEYWORDS)}")
    print("=" * 60)

    # Load environment variables
    client_id = os.environ.get("REDDIT_CLIENT_ID")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
    user_agent = os.environ.get("REDDIT_USER_AGENT", "gta6-help-scout:v1.0 (by /u/anonymous)")

    telegram_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    telegram_chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    discord_webhook = os.environ.get("DISCORD_WEBHOOK_URL")

    if not client_id or not client_secret:
        print("\n❌ MISSING CONFIGURATION:")
        print("Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in your environment.")
        print("Example: export REDDIT_CLIENT_ID='...' REDDIT_CLIENT_SECRET='...'")
        sys.exit(1)

    if not discord_webhook and not (telegram_token and telegram_chat_id):
        print("\n⚠️ WARNING: Neither Telegram nor Discord credentials found.")
        print("Alerts will only be printed to console.\n")

    seen_posts = load_seen_posts()
    token = None
    token_expiry = 0

    while True:
        try:
            # Refresh token if needed
            now = time.time()
            if not token or now >= token_expiry:
                print("[*] Authenticating with Reddit API...")
                token = get_reddit_token(client_id, client_secret, user_agent)
                token_expiry = now + 3500  # Token valid for 1 hour

            new_seen_count = 0

            for sub in TARGET_SUBREDDITS:
                posts = fetch_subreddit_posts(sub, token, user_agent)
                for post in posts:
                    post_id = post.get("id")
                    if not post_id or post_id in seen_posts:
                        continue

                    seen_posts.add(post_id)
                    new_seen_count += 1

                    title = post.get("title", "")
                    selftext = post.get("selftext", "")
                    score = post.get("score", 0)

                    matched = check_keywords(f"{title} {selftext}")
                    if matched and score >= MIN_SCORE:
                        post_url = f"https://reddit.com{post.get('permalink')}"
                        print(f"\n🎯 [MATCH] r/{sub}: {title}")
                        print(f"   Keywords: {matched} | Upvotes: {score}")
                        print(f"   Link: {post_url}")

                        # 1. Telegram
                        if telegram_token and telegram_chat_id:
                            msg = (
                                f"👾 *REDDIT OPPORTUNITY DETECTED!*\n"
                                f"━━━━━━━━━━━━━━━━━━━━\n"
                                f"📍 *Subreddit:* r/{sub}\n"
                                f"📝 *Title:* {title}\n"
                                f"🏷️ *Keywords:* `{', '.join(matched)}`\n"
                                f"👍 *Upvotes:* {score}\n"
                                f"🔗 [Open Thread on Reddit]({post_url})\n\n"
                                f"_Tip: Jump in and share your funny GTA 6 crowdfunding project!_"
                            )
                            try:
                                send_telegram_alert(telegram_token, telegram_chat_id, msg)
                            except Exception as te:
                                print(f"[!] Telegram alert failed: {te}")

                        # 2. Discord
                        if discord_webhook:
                            try:
                                send_discord_alert(discord_webhook, post, matched)
                            except Exception as de:
                                print(f"[!] Discord alert failed: {de}")

                time.sleep(1)  # Brief pause between subreddits to be polite to Reddit rate limits

            if new_seen_count > 0:
                save_seen_posts(seen_posts)

            print(f"[{datetime.now().strftime('%H:%M:%S')}] Scanned subreddits. Sleeping for {POLL_INTERVAL_SECONDS}s...")
            time.sleep(POLL_INTERVAL_SECONDS)

        except KeyboardInterrupt:
            print("\n👋 Scout stopped by user.")
            save_seen_posts(seen_posts)
            break
        except Exception as e:
            print(f"[!] Unexpected error in scout loop: {e}")
            time.sleep(30)


if __name__ == "__main__":
    main()
