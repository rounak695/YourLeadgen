<br><div align="center">

# YourLeadGen

### Open-Source AI Sales Outreach Engine

<br>

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<br>

**Find leads. Scrape data. Write personalized emails with AI. Send them. All from one dashboard.**

[Get Started](#-getting-started) · [How It Works](#-how-it-works) · [Contributing](CONTRIBUTING.md)

</div>

<br>

---

<br>

## What is this?

YourLeadGen is a local-first lead generation and cold outreach tool. You give it a search query like `"Interior designers in Australia"`, and it does the rest:

1. **Finds businesses** via Google Search (using Serper API)
2. **Scrapes their websites** for emails, phone numbers, social links, and what they do
3. **Generates a personalized cold email** for each lead using AI (Ollama, OpenAI, Groq, Gemini, Claude, or Grok)
4. **Sends the emails** through Gmail SMTP with rate limiting and anti-spam protections
5. **Logs everything** so you can track what was sent, what failed, and what was skipped

It runs entirely on your machine. Your data stays local. No SaaS subscriptions, no monthly fees.

<br>

---

<br>

## Features

- **Web Dashboard** — manage everything from a clean browser UI at `localhost:3000`. No terminal required.
- **Settings Page** — paste your API keys directly in the browser. No need to edit config files.
- **CRM View** — see all your processed leads in one table with status badges (sent, failed, skipped).
- **Real-time Console** — watch the pipeline run live with streaming server-sent events.
- **Multi-AI Support** — switch between Ollama (local/free), OpenAI, Groq, Gemini, Claude, or Grok.
- **Dry Run Mode** — test the full pipeline without actually sending any emails.
- **CSV Export** — every run auto-generates a CSV file with all scraped lead data.
- **CLI Mode** — prefer the terminal? The original CLI still works alongside the dashboard.

<br>

---

<br>

## Getting Started

### What you need

| Requirement | What it's for |
|------------|---------------|
| [Node.js 18+](https://nodejs.org/) | Running the app |
| [Serper API Key](https://serper.dev/) | Finding leads via Google Search (free tier gives 2,500 queries) |
| Gmail + App Password | Sending emails via SMTP |
| An AI provider | Generating personalized emails. Ollama is free and runs locally. |

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/yourleadgen.git
cd yourleadgen

# 2. Install dependencies
npm install

# 3. Start the dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Go to the **Settings** tab and enter your API keys. That's it — you're ready to run your first campaign.

### CLI usage (optional)

If you prefer the terminal, the CLI still works:

```bash
# Dry run — doesn't send emails
node main.js "Interior designers in Australia"

# Limit to 5 leads
node main.js "SaaS startups in San Francisco" --limit 5

# Actually send emails
node main.js "Yoga studios in London" --send

# Clear old logs before running
node main.js "Coffee shops in NYC" --clear-logs --limit 10
```

<br>

---

<br>

## How It Works

```
Search Query (e.g. "Interior designers in Australia")
        │
        ▼
┌─────────────────┐
│  Lead Fetcher   │  → Serper API (Google Search + Maps)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Web Scraper    │  → Cheerio (emails, phones, socials, about text)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│CSV File│ │ AI Engine │  → Ollama / OpenAI / Groq / Gemini / Claude / Grok
└────────┘ └─────┬────┘
                 │
                 ▼
          ┌─────────────┐
          │ Email Sender │  → Gmail SMTP (rate limited, deduplicated)
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐
          │   Logger    │  → JSON logs + CRM dashboard
          └─────────────┘
```

<br>

---

<br>

## Project Structure

```
yourleadgen/
├── server.js              # Express server — serves the dashboard + API endpoints
├── main.js                # CLI entry point (standalone mode)
├── package.json
│
├── public/                # Frontend dashboard
│   ├── index.html         # Dashboard layout (sidebar, tabs, forms)
│   ├── style.css          # Material Design styles
│   └── app.js             # Frontend logic (tab switching, SSE, API calls)
│
├── modules/
│   ├── leadFetcher.js     # Serper API integration
│   ├── scraper.js         # Website scraping (Cheerio + Axios)
│   ├── aiGenerator.js     # Multi-provider AI email generation
│   ├── emailSender.js     # Gmail SMTP with rate limiting
│   ├── emailTemplate.js   # HTML email templates
│   └── logger.js          # JSON file logging
│
├── config/
│   └── config.js          # Runtime configuration (reads from .env)
│
├── data/
│   ├── leads.json         # Scraped lead data
│   └── logs.json          # Send/fail/skip history
│
├── .env.example           # Template for environment variables
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SETUP.md               # Detailed setup guide
└── LICENSE                 # MIT
```

<br>

---

<br>

## Supported AI Providers

| Provider | Type | Model | API Key Required |
|----------|------|-------|-----------------|
| Ollama | Local (free) | llama3, mistral, etc. | No |
| OpenAI | Cloud | gpt-4o-mini | Yes |
| Groq | Cloud (fast) | llama3-70b | Yes |
| Gemini | Cloud | gemini-1.5-flash | Yes |
| Claude | Cloud | claude-3-haiku | Yes |
| Grok | Cloud | grok-2-latest | Yes |

Set `AI_PROVIDER` in the Settings tab or `.env` file to switch providers.

<br>

---

<br>

## Safety & Ethics

This tool is built for genuine business outreach, not spam. Here's what's built in:

- **Dry run by default** — no emails are sent unless you explicitly turn on Live Send Mode
- **Rate limiting** — random 30–120 second delay between each email
- **Batch limits** — configurable max of 200 emails per run
- **Deduplication** — the same email address never gets contacted twice
- **Junk email filtering** — auto-skips noreply@, support@, info@, and other generic addresses

> **Please comply with CAN-SPAM, GDPR, and any applicable email regulations in your region.**

<br>

---

<br>

## Contributing

Contributions are welcome. Whether it's a bug fix, a new AI provider, or a UI improvement — check out the [Contributing Guide](CONTRIBUTING.md) and feel free to open a PR.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

<br>

---

<br>

## License

MIT — see [LICENSE](LICENSE).

<br>

---

<br>

<div align="center">

Built by [Rounak Paul](https://xcelaratestudio.space)

[![Email](https://img.shields.io/badge/rounakpaul881@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:rounakpaul881@gmail.com)

<sub>If this helped you, consider giving it a ⭐</sub>

</div>
