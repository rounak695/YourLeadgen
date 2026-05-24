import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "..", ".env") });

// ─── Export config dynamically ───
const config = {
  // Lead generation
  get SERPER_API_KEY() { return process.env.SERPER_API_KEY; },
  get MAX_LEADS() { return parseInt(process.env.MAX_LEADS || "100", 10); },

  // Scraping
  get SCRAPE_TIMEOUT() { return parseInt(process.env.SCRAPE_TIMEOUT || "10000", 10); },

  // AI Provider Configuration
  get AI_PROVIDER() { return process.env.AI_PROVIDER || "ollama"; },
  
  // Local AI (Ollama)
  get OLLAMA_URL() { return process.env.OLLAMA_URL || "http://localhost:11434"; },
  get OLLAMA_MODEL() { return process.env.OLLAMA_MODEL || "llama3"; },

  // Cloud AI APIs
  get OPENAI_API_KEY() { return process.env.OPENAI_API_KEY; },
  get OPENAI_MODEL() { return process.env.OPENAI_MODEL || "gpt-4o-mini"; },
  
  get GROQ_API_KEY() { return process.env.GROQ_API_KEY; },
  get GROQ_MODEL() { return process.env.GROQ_MODEL || "llama3-70b-8192"; },

  get GEMINI_API_KEY() { return process.env.GEMINI_API_KEY; },
  get GEMINI_MODEL() { return process.env.GEMINI_MODEL || "gemini-1.5-flash"; },

  get CLAUDE_API_KEY() { return process.env.CLAUDE_API_KEY; },
  get CLAUDE_MODEL() { return process.env.CLAUDE_MODEL || "claude-3-haiku-20240307"; },

  get GROK_API_KEY() { return process.env.GROK_API_KEY; },
  get GROK_MODEL() { return process.env.GROK_MODEL || "grok-2-latest"; },

  // Email SMTP
  get SMTP_USER() { return process.env.SMTP_USER; },
  get SMTP_PASS() { return process.env.SMTP_PASS; },
  get SMTP_FROM() { return process.env.SMTP_FROM || process.env.SMTP_USER; },

  // Safety limits
  get MAX_EMAILS_PER_DAY() { return parseInt(process.env.MAX_EMAILS_PER_DAY || "200", 10); },
  get EMAIL_DELAY_MIN() { return parseInt(process.env.EMAIL_DELAY_MIN || "30000", 10); },
  get EMAIL_DELAY_MAX() { return parseInt(process.env.EMAIL_DELAY_MAX || "120000", 10); },

  // Paths
  get DATA_DIR() { return resolve(__dirname, "..", "data"); },
};

export default config;
