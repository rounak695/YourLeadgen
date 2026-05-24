# Contributing to YourLeadGen

Welcome! We are genuinely thrilled that you are here. 🎉

YourLeadGen is built on the idea that open-source software can democratize powerful tools, and we rely on the brilliant minds in our community to make this vision a reality. Whether you are fixing a typo in the documentation, optimizing a scraping algorithm, or integrating a brand new AI provider, **your contribution matters.**

This document outlines our engineering standards, processes, and guidelines to ensure your time is well spent and your code gets merged smoothly.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Coding Standards](#-coding-standards)
- [Pull Request Process](#-pull-request-process)
- [Adding a New AI Provider](#-adding-a-new-ai-provider)
- [Legal](#-legal)

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and highly professional environment for everyone. This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold these standards. If you encounter any issues, please reach out to [rounakpaul881@gmail.com](mailto:rounakpaul881@gmail.com).

---

## 🤝 How Can I Contribute?

### 🐛 Report Bugs
Software is imperfect, and your bug reports help us build a more resilient system. Please [open an issue](../../issues/new?template=bug_report.md) and include:
- A clear, descriptive title.
- Step-by-step reproduction instructions.
- The expected outcome vs. the actual outcome.
- Your runtime environment (Node.js version, OS, configured AI provider).

### 💡 Suggest Features
Great products evolve through community feedback. If you have an idea, [open a feature request](../../issues/new?template=feature_request.md) detailing:
- The exact problem you are trying to solve.
- Your proposed solution or architecture.
- Any alternative approaches you have considered.

### 🔧 Submit Code
Ready to write some code? Here is our standard workflow:
1. **Fork** the repository.
2. **Branch out** for your feature or fix (`git checkout -b feature/amazing-feature`).
3. **Develop** your code, adhering to our coding standards.
4. **Test** your changes thoroughly.
5. **Commit** using Conventional Commits (`git commit -m 'feat: add Mistral AI provider'`).
6. **Push** to your fork (`git push origin feature/amazing-feature`).
7. **Open a Pull Request** against our `main` branch.

---

## 🛠️ Development Setup

Getting the project running locally should take less than two minutes:

```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/yourleadgen.git
cd yourleadgen

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Open .env and add your respective API keys (Serper, AI Provider, Gmail SMTP)

# 4. Verify the setup via Dry Run (generates emails, but prevents sending)
node main.js "tech startups in london" --limit 3
```

### Prerequisites
- **Node.js 18+** 
- **Ollama** (Optional, but highly recommended for local, cost-free AI testing).
- An API Key for your preferred provider if you aren't using Ollama.

---

## 📂 Project Structure

We follow a modular architecture to keep the codebase clean, testable, and scalable:

```
yourleadgen/
├── config/
│   └── config.js           # Centralized configuration and environment validation
├── modules/
│   ├── leadFetcher.js      # Serper API integration for Google Search + Maps
│   ├── scraper.js          # Web scraping engine (Cheerio/Axios)
│   ├── aiGenerator.js      # Multi-provider LLM inference engine
│   ├── emailSender.js      # SMTP transport with strict rate-limiting
│   ├── emailTemplate.js    # HTML email formatting
│   └── logger.js           # Disk-based JSON logger
├── data/                   # Runtime data cache (Git-ignored)
├── main.js                 # Standalone CLI entry point
├── server.js               # Express server and SSE stream for the Dashboard
├── public/                 # Vanilla JS / HTML frontend for the Web UI
├── .env.example            # Environment template
└── package.json            
```

---

## 📏 Coding Standards

We strive for a modern, clean, and predictable codebase.

### General Engineering Rules
- **ES Modules:** We strictly use ES Modules (`import`/`export`), not CommonJS (`require`).
- **Asynchronous Flow:** All I/O operations must be `async`/`await`. Avoid `.then()` chaining.
- **Defensive Programming:** Always wrap external network or disk calls in `try/catch` blocks. Provide meaningful fallbacks and clear error logs.
- **Zero Hardcoded Secrets:** All configuration and secrets must pass through `config/config.js`.

### Naming Conventions

| Element     | Convention   | Example |
|-------------|-------------|---------|
| Files       | camelCase   | `leadFetcher.js` |
| Functions   | camelCase   | `fetchLeads()` |
| Constants   | UPPER_SNAKE | `MAX_EMAILS_PER_DAY` |
| Classes     | PascalCase  | `EmailProvider` |

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. This helps us auto-generate release notes and keep our Git history readable.

```text
feat: add Mistral AI provider support
fix: handle timeout in scraper for slow sites
docs: update README with Groq setup instructions
refactor: simplify provider selection logic
chore: update npm dependencies
```

---

## 🔌 Adding a New AI Provider

We want YourLeadGen to support every major LLM. Adding a new one is highly encouraged!

### Option A: OpenAI-Compatible APIs
Most modern APIs (Groq, Together, Fireworks, xAI) use the standard OpenAI schema. To add one, simply extend the `PROVIDERS` registry in `modules/aiGenerator.js`:

```javascript
myProvider: {
  name: "My Provider",
  baseUrl: "https://api.myprovider.com/v1",
  defaultModel: "my-model-name",
  apiKeyEnv: "MYPROVIDER_API_KEY",
  format: "openai", 
},
```

### Option B: Custom API Architectures
If the provider uses a custom schema (like Claude), create a dedicated handler function:

```javascript
async function myProviderGenerate(prompt, apiKey, model) {
  // 1. Authenticate and POST to the provider
  // 2. Parse the proprietary response
  // 3. Return the standard schema: { subject: "...", email_body: "..." }
}
```
Then, register it in the `PROVIDERS` object using `format: "custom"` and pass your `handler` function.

### Finalizing Your Provider
1. Add the API key variable to `.env.example`.
2. Map it in `config/config.js`.
3. Update `README.md` to show users how to use it.

---

## 🔄 Pull Request Process

1. **Test Before Submitting:** Ensure your code works by running a full `--limit 3` dry-run.
2. **Update Documentation:** If you changed the behavior, ensure the README and setup guides reflect it.
3. **Keep It Focused:** One feature per Pull Request. Huge PRs are difficult to review.
4. **Provide Context:** Use the PR template to explain *what* you changed and *why* you changed it.
5. **Code Review:** A maintainer will review your code. We may ask for changes—please view this as a collaborative effort to merge the best possible code!

---

## ⚖️ Legal

By contributing to YourLeadGen, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## 🙏 Thank You!

Every pull request, issue, and discussion helps make this project better for the entire community. We are incredibly grateful for your time, expertise, and passion.

**Have Questions?** Open a [Discussion](../../discussions) or reach out directly at [rounakpaul881@gmail.com](mailto:rounakpaul881@gmail.com). Let's build something great.
