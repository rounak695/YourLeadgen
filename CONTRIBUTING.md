# Contributing to YourLeadGen

First off — **thank you** for considering contributing to YourLeadGen! 🎉

Every contribution matters, whether it's fixing a typo, improving docs, reporting a bug, or building a whole new AI provider integration.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Adding a New AI Provider](#adding-a-new-ai-provider)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## 📜 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [growth@xcelaratestudio.space](mailto:rounakpaul881@gmail.com).

---

## 🤝 How Can I Contribute?

### 🐛 Report Bugs

Found a bug? [Open an issue](../../issues/new?template=bug_report.md) with:
- A clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Node.js version, OS, AI provider)

### 💡 Suggest Features

Have an idea? [Open a feature request](../../issues/new?template=feature_request.md) with:
- A clear description of the problem you're solving
- Your proposed solution
- Any alternatives you've considered

### 🔧 Submit Code

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write your code
4. Write/update tests if applicable
5. Commit with a clear message (`git commit -m 'feat: add Mistral AI provider'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 🛠️ Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/yourleadgen.git
cd yourleadgen

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 4. Test with a dry run
node main.js "test query" --limit 3
```

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Ollama** (optional) — [Download](https://ollama.ai/) — Only needed for local AI
- At least one AI provider API key (Groq has a generous free tier)

---

## 📂 Project Structure

```
yourleadgen/
├── config/
│   └── config.js           # Centralized config + env validation
├── modules/
│   ├── leadFetcher.js       # Serper API lead generation
│   ├── scraper.js           # Web scraping engine
│   ├── aiGenerator.js       # Multi-provider AI engine (core)
│   ├── emailSender.js       # SMTP + rate limiter
│   ├── emailTemplate.js     # HTML email templates
│   └── logger.js            # JSON file logger
├── data/                    # Runtime data (gitignored)
├── main.js                  # CLI entry point
├── .env.example             # Environment template
└── package.json
```

---

## 📏 Coding Standards

### General Rules

- **ES Modules** — Use `import/export`, not `require/module.exports`
- **Async/Await** — All I/O operations must be async
- **Error handling** — Always wrap external calls in try/catch with meaningful fallbacks
- **No hardcoded secrets** — Everything goes through `config.js` → `.env`

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | camelCase | `leadFetcher.js` |
| Functions | camelCase | `fetchLeads()` |
| Constants | UPPER_SNAKE | `MAX_EMAILS_PER_DAY` |
| Classes | PascalCase | `EmailProvider` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Mistral AI provider support
fix: handle timeout in scraper for slow sites
docs: update README with Groq setup instructions
refactor: simplify provider selection logic
chore: update dependencies
```

---

## 🔌 Adding a New AI Provider

Want to add support for a new AI provider? Here's the pattern:

### 1. Check if it's OpenAI-compatible

Most modern AI APIs (Groq, Grok/xAI, Together, Fireworks, etc.) use the OpenAI chat completions format. If your provider does too, you just need to add it to the `PROVIDERS` registry in `aiGenerator.js`:

```javascript
// In modules/aiGenerator.js → PROVIDERS object
myProvider: {
  name: "My Provider",
  baseUrl: "https://api.myprovider.com/v1",
  defaultModel: "my-model-name",
  apiKeyEnv: "MYPROVIDER_API_KEY",
  format: "openai",  // Uses OpenAI-compatible format
},
```

### 2. If it has a custom API format

Add a new handler function:

```javascript
async function myProviderGenerate(prompt, apiKey, model) {
  // Call the provider's API
  // Return: { subject: "...", email_body: "..." }
}
```

Then register it in the `PROVIDERS` object with `format: "custom"` and a `handler` function.

### 3. Update config & docs

- Add the API key to `.env.example`
- Add the provider to `config/config.js`
- Update the README with setup instructions
- Add the provider to the badges

---

## 🔄 Pull Request Process

1. **Ensure your code works** — Run a dry-run test before submitting
2. **Update docs** — If you changed behavior, update the README
3. **One feature per PR** — Keep PRs focused and reviewable
4. **Describe your changes** — Use the PR template to explain what and why
5. **Be patient** — Maintainers are human too! We'll review as soon as we can

### PR Checklist

- [ ] My code follows the project's coding standards
- [ ] I have tested my changes with a dry run
- [ ] I have updated the documentation (if applicable)
- [ ] I have added my provider to `.env.example` (if adding a provider)
- [ ] My commits follow the conventional commits format

---

## ⚖️ Legal

By contributing to YourLeadGen, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## 🙏 Thank You!

Every contribution — no matter how small — helps make YourLeadGen better for everyone. We appreciate your time and effort!

**Questions?** Open a [Discussion](../../discussions) or email [growth@xcelaratestudio.space](mailto:rounakpaul881@gmail.com).
