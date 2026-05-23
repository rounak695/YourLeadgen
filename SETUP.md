# 🤖 Your AI Sales Team — Setup Guide

> **Local-first Cold Email Automation** powered by Ollama + Serper + Gmail SMTP.

---

## Prerequisites

Make sure the following are installed on your machine before starting:

| Tool | Check | Install |
|------|-------|---------|
| Node.js ≥ 18 | `node -v` | https://nodejs.org |
| npm ≥ 9 | `npm -v` | comes with Node |
| Ollama | `ollama -v` | https://ollama.ai |

---

## Step 1 — Clone / navigate to the project

```bash
cd "/Users/rounakpaul/My sales team/antigravity-agent"
```

---

## Step 2 — Install dependencies

```bash
npm install
```

---

## Step 3 — Pull the AI model (Ollama)

This downloads `llama3` (~4 GB) locally. Only needed once.

```bash
ollama pull llama3
```

Verify it's running:

```bash
ollama list
```

You should see `llama3:latest` in the list.

---

## Step 4 — Configure your environment

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Then open `.env` and set the following values:

```env
# ─── Serper API (Lead Generation) ───
# Get your key at https://serper.dev → Dashboard → API Key
SERPER_API_KEY=your_serper_api_key_here

# ─── Gmail SMTP (Email Sending) ───
# Use a Google App Password (NOT your regular Gmail password)
# Go to: Google Account → Security → 2-Step Verification → App Passwords
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM="Your Name <your.email@gmail.com>"

# ─── Ollama (AI Generation) ───
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

> **Note:** Your `.env` is already configured if you're Rounak — skip this step.

---

## Step 5 — Start Ollama (background service)

```bash
ollama serve
```

> Leave this running in a separate terminal tab while you use the system.

---

## Step 6 — Run the system

### Dry run (no emails sent — safe to test)

```bash
node main.js "Interior designers in Australia"
```

### Dry run with a lead limit

```bash
node main.js "Interior designers in Australia" --limit 5
```

### Live send (emails actually sent)

```bash
node main.js "Interior designers in Australia" --send
```

### Live send with a limit (recommended for first run)

```bash
node main.js "Interior designers in Australia" --send --limit 10
```

### Clear previous logs before a fresh run

```bash
node main.js "Interior designers in Australia" --send --clear-logs
```

---

## CLI Options Reference

| Flag | Description |
|------|-------------|
| `--send` | Send real emails (default is dry-run) |
| `--limit N` | Process only N leads |
| `--clear-logs` | Clear previous log entries before running |

---

## Output Files

| File | Description |
|------|-------------|
| `data/leads.json` | All leads fetched from Serper API |
| `data/logs.json` | Log of every email sent / skipped / failed |

---

## Daily Limits (Safety)

The system enforces these limits automatically:

- **Max 50 emails per day** (resets at midnight)
- **30–120 second random delay** between each email
- **Duplicate prevention** — same address is never emailed twice per session

To change limits, edit `config/config.js` or add to your `.env`:

```env
MAX_EMAILS_PER_DAY=50
EMAIL_DELAY_MIN=30000
EMAIL_DELAY_MAX=120000
```

---

## Troubleshooting

### ❌ `Missing required environment variables`
→ Your `.env` file is missing or has empty values. Re-check Step 4.

### ❌ `Ollama error: connect ECONNREFUSED`
→ Ollama isn't running. Run `ollama serve` in a separate terminal.

### ❌ `Invalid login: 535 Authentication failed`
→ Your `SMTP_PASS` is wrong. Make sure you're using a **Google App Password**, not your regular Gmail password.

### ❌ All leads skipped (no email found)
→ The scraper couldn't find emails on those pages. Try a more specific query:
```bash
node main.js "Interior design studio Sydney contact email" --limit 20
```

---

## Full Example — First Run

```bash
# 1. Install deps
npm install

# 2. Pull AI model (one-time)
ollama pull llama3

# 3. Start Ollama in a separate terminal
ollama serve

# 4. Test with a dry run first
node main.js "Graphic designers in Melbourne" --limit 5

# 5. Send for real
node main.js "Graphic designers in Melbourne" --send --limit 20
```
