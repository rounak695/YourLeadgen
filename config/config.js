import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "..", ".env") });

// ─── Validate required environment variables ───
const required = ["SERPER_API_KEY", "SMTP_USER", "SMTP_PASS"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `\n❌ Missing required environment variables: ${missing.join(", ")}`
  );
  console.error(`   Copy .env.example → .env and fill in your keys.\n`);
  process.exit(1);
}

// ─── Export config ───
const config = {
  // Lead generation
  SERPER_API_KEY: process.env.SERPER_API_KEY,
  MAX_LEADS: parseInt(process.env.MAX_LEADS || "100", 10),

  // Scraping
  SCRAPE_TIMEOUT: parseInt(process.env.SCRAPE_TIMEOUT || "10000", 10),

  // AI Provider Configuration
  AI_PROVIDER: process.env.AI_PROVIDER || "ollama",
  
  // Local AI (Ollama)
  OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434",
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || "llama3",

  // Cloud AI APIs
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
  
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || "llama3-70b-8192",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",

  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || "claude-3-haiku-20240307",

  GROK_API_KEY: process.env.GROK_API_KEY,
  GROK_MODEL: process.env.GROK_MODEL || "grok-2-latest",

  // Email SMTP
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER,

  // Safety limits
  MAX_EMAILS_PER_DAY: parseInt(process.env.MAX_EMAILS_PER_DAY || "200", 10),
  EMAIL_DELAY_MIN: parseInt(process.env.EMAIL_DELAY_MIN || "30000", 10),
  EMAIL_DELAY_MAX: parseInt(process.env.EMAIL_DELAY_MAX || "120000", 10),

  // Paths
  DATA_DIR: resolve(__dirname, "..", "data"),
};

export default config;
