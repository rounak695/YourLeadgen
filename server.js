import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import chalk from 'chalk';

import { fetchLeads } from "./modules/leadFetcher.js";
import { scrapeWebsite } from "./modules/scraper.js";
import { generateEmail } from "./modules/aiGenerator.js";
import { sendEmail, randomDelay } from "./modules/emailSender.js";
import { logResult, getStats } from "./modules/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded initially
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ─── CRM & Stats Endpoints ───

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm', async (req, res) => {
  try {
    const logsPath = path.join(__dirname, 'data', 'logs.json');
    const logsData = await fs.readFile(logsPath, 'utf8');
    res.json(JSON.parse(logsData));
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.json([]); // No logs yet
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ─── Settings Endpoints ───

const ENV_PATH = path.join(__dirname, '.env');

app.get('/api/config', async (req, res) => {
  try {
    // Read directly from process.env (or re-parse .env)
    const envData = await fs.readFile(ENV_PATH, 'utf8').catch(() => '');
    const config = dotenv.parse(envData);
    
    // Send back safe config
    res.json({
      SERPER_API_KEY: config.SERPER_API_KEY || '',
      SMTP_USER: config.SMTP_USER || '',
      SMTP_PASS: config.SMTP_PASS || '',
      AI_PROVIDER: config.AI_PROVIDER || 'ollama',
      OLLAMA_MODEL: config.OLLAMA_MODEL || 'llama3',
      OPENAI_API_KEY: config.OPENAI_API_KEY || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const updates = req.body;
    let envContent = await fs.readFile(ENV_PATH, 'utf8').catch(() => '');
    
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
      process.env[key] = value; // Update live process
    }
    
    await fs.writeFile(ENV_PATH, envContent, 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Campaign Runner (SSE) ───

app.get('/api/run', async (req, res) => {
  const query = req.query.query;
  const sendMode = req.query.sendMode === 'true';
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : Infinity;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendEvent = (type, message, data = null) => {
    res.write(`data: ${JSON.stringify({ type, message, data })}\n\n`);
  };

  if (!query) {
    sendEvent('error', 'Query parameter is required.');
    res.end();
    return;
  }

  // Validate API Keys at runtime
  if (!process.env.SERPER_API_KEY || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    sendEvent('error', 'Missing API Keys! Please configure your Serper API Key and SMTP credentials in the Settings tab before launching a campaign.');
    res.end();
    return;
  }

  try {
    const startTime = Date.now();
    sendEvent('info', `Starting campaign for query: "${query}" (Mode: ${sendMode ? "LIVE" : "DRY RUN"})`);

    sendEvent('progress', 'Fetching leads from Serper API...');
    const leads = await fetchLeads(query);
    sendEvent('success', `Found ${leads.length} unique leads`);

    const toProcess = leads.slice(0, limit);
    sendEvent('info', `Processing ${toProcess.length} leads...`);

    const scrapedLeads = [];
    
    for (let i = 0; i < toProcess.length; i++) {
      const lead = toProcess[i];
      sendEvent('progress', `[${i + 1}/${toProcess.length}] Scraping ${lead.name}...`);
      
      const scraped = await scrapeWebsite(lead.website);
      
      if (!scraped) {
        sendEvent('warning', `Skipped (inaccessible)`);
        scrapedLeads.push({ ...lead, email: "", phones: "", socials: "", about: "Failed to scrape", services: "" });
      } else {
        const emailStatus = scraped.email ? `Found: ${scraped.email}` : "No email";
        sendEvent(scraped.email ? 'success' : 'warning', emailStatus);
        scrapedLeads.push({
          ...lead,
          ...scraped,
          phones: (scraped.phones || []).join(" | "),
          socials: (scraped.socials || []).join(" | "),
        });
      }
    }

    const validLeads = scrapedLeads.filter((l) => l.email);
    let emailed = 0;
    let failed = 0;
    const skipped = scrapedLeads.length - validLeads.length;

    if (validLeads.length === 0) {
      sendEvent('warning', 'No emails found to send in this batch.');
    } else {
      sendEvent('info', `Starting Email Campaign for ${validLeads.length} leads...`);
    }

    for (let i = 0; i < validLeads.length; i++) {
      const lead = validLeads[i];
      sendEvent('progress', `[${i + 1}/${validLeads.length}] Preparing email for ${lead.name} (${lead.email})...`);

      sendEvent('progress', `Generating personalized email...`);
      const emailContent = await generateEmail({
        business_name: lead.name,
        about: lead.about,
        services: lead.services,
      });
      sendEvent('success', `Generated Subject: "${emailContent.subject}"`);

      sendEvent('progress', sendMode ? `Sending email via SMTP...` : `[Dry run] Logging email...`);
      
      const result = await sendEmail(
        {
          to: lead.email,
          subject: emailContent.subject,
          body: emailContent.email_body,
        },
        !sendMode
      );

      if (result.success) {
        sendEvent('success', result.message);
        emailed++;
        await logResult({ lead: lead.name, email: lead.email, status: "sent" });
      } else {
        sendEvent('error', result.message);
        failed++;
        await logResult({ lead: lead.name, email: lead.email, status: "failed", error: result.message });
      }

      if (sendMode && i < validLeads.length - 1) {
        sendEvent('progress', `Waiting to avoid spam filters...`);
        await randomDelay();
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    sendEvent('complete', `Run finished in ${elapsed}s. Sent: ${emailed}, Failed: ${failed}, Skipped: ${skipped}.`, { emailed, failed, skipped });

  } catch (error) {
    sendEvent('error', `Pipeline Error: ${error.message}`);
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(chalk.bold.cyan(`🚀 YourLeadGen Dashboard running on http://localhost:${PORT}`));
});
