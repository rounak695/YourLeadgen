import axios from "axios";
import config from "../config/config.js";

/**
 * Generate a personalized cold email using the configured AI provider.
 * @param {{ business_name: string, about: string, services: string }} leadData
 * @returns {Promise<{ subject: string, email_body: string }>}
 */
export async function generateEmail(leadData) {
  const { business_name, about, services } = leadData;
  const prompt = `You are a professional cold email writer. Your ONLY output must be a single valid JSON object — no explanation, no preamble, no markdown fences.

Business Name: ${business_name}
About: ${about}
Services: ${services}

Rules:
- Write a short, human, personalised cold email under 100 words.
- The subject must be a concise, catchy email subject line (max 60 chars). Do NOT start the subject with a sentence like "Here is …".
- Sign off as Rounak.
- Do NOT sound spammy.

Output format (JSON only, nothing else):
{"subject":"<concise subject line>","email_body":"<email body text>"}`;

  try {
    let rawText = "";

    switch (config.AI_PROVIDER.toLowerCase()) {
      case "openai":
        rawText = await generateOpenAI(prompt);
        break;
      case "groq":
        rawText = await generateGroq(prompt);
        break;
      case "gemini":
        rawText = await generateGemini(prompt);
        break;
      case "claude":
        rawText = await generateClaude(prompt);
        break;
      case "grok":
        rawText = await generateGrok(prompt);
        break;
      case "ollama":
      default:
        rawText = await generateOllama(prompt);
        break;
    }

    return parseEmailResponse(rawText, business_name);
  } catch (error) {
    console.error(`⚠️  AI generation error [${config.AI_PROVIDER}]: ${error.message}`);
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data));
    }
    return getFallbackEmail(business_name);
  }
}

// ─── Provider Handlers ───

async function generateOllama(prompt) {
  const response = await axios.post(
    `${config.OLLAMA_URL}/api/generate`,
    {
      model: config.OLLAMA_MODEL,
      prompt,
      stream: false,
      format: "json",
      options: { temperature: 0.7, num_predict: 300 },
    },
    { timeout: 120000 }
  );
  return response.data.response || "";
}

async function generateOpenAI(prompt) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: config.OPENAI_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "Authorization": `Bearer ${config.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );
  return response.data.choices[0].message.content || "";
}

async function generateGroq(prompt) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: config.GROQ_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "Authorization": `Bearer ${config.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );
  return response.data.choices[0].message.content || "";
}

async function generateGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.GEMINI_MODEL}:generateContent?key=${config.GEMINI_API_KEY}`;
  const response = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data.candidates[0].content.parts[0].text || "";
}

async function generateClaude(prompt) {
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: config.CLAUDE_MODEL,
      max_tokens: 300,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "x-api-key": config.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      }
    }
  );
  return response.data.content[0].text || "";
}

async function generateGrok(prompt) {
  const response = await axios.post(
    "https://api.x.ai/v1/chat/completions",
    {
      model: config.GROK_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "Authorization": `Bearer ${config.GROK_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );
  return response.data.choices[0].message.content || "";
}

// ─── Helpers ───

function sanitizeSubject(subject) {
  const cleaned = subject
    .replace(/^(here is|here's|below is|see below|subject\s*:|re\s*:|subj\s*:)\s*/i, "")
    .replace(/cold email[:\s]*/i, "")
    .replace(/personalized[:\s]*/i, "")
    .trim();
  return cleaned.length > 60 ? cleaned.slice(0, 57) + "…" : cleaned;
}

function parseEmailResponse(text, businessName) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*?"subject"[\s\S]*?"email_body"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.subject && parsed.email_body) {
        return {
          subject: sanitizeSubject(parsed.subject),
          email_body: parsed.email_body.trim(),
        };
      }
    }
  } catch {}

  const lines = text.trim().split("\n").filter((l) => l.trim());
  if (lines.length >= 2) {
    const subject = sanitizeSubject(lines[0].replace(/^(subject|re|subj)[:\s]*/i, "").trim());
    const body = lines.slice(1).join("\n").trim();
    return {
      subject: subject || `Quick idea for ${businessName}`,
      email_body: body,
    };
  }

  return getFallbackEmail(businessName);
}

function getFallbackEmail(businessName) {
  return {
    subject: `Quick idea for ${businessName}`,
    email_body: `Hi,\n\nI came across ${businessName} and was really impressed by your work. I'd love to explore how we might collaborate.\n\nWould you be open to a quick chat this week?\n\nBest regards,\nRounak`,
  };
}
