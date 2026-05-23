#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import { fetchLeads } from "./modules/leadFetcher.js";
import { scrapeWebsite } from "./modules/scraper.js";
import { generateEmail } from "./modules/aiGenerator.js";
import { sendEmail, randomDelay, getEmailStats } from "./modules/emailSender.js";
import { logResult, getStats, clearLogs } from "./modules/logger.js";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import os from "os";

// ─── Parse CLI Arguments ───
const args = process.argv.slice(2);
const query = args.find((a) => !a.startsWith("--"));
const sendMode = args.includes("--send");
const limitFlag = args.find((a) => a.startsWith("--limit"));
const limit = limitFlag ? parseInt(args[args.indexOf(limitFlag) + 1], 10) : Infinity;
const clearFlag = args.includes("--clear-logs");

// ─── Banner ───
console.log(
  chalk.bold.cyan(`
  ╔══════════════════════════════════════════╗
  ║        🤖 Your AI Sales Team            ║
  ║   ─────────────────────────────────────  ║
  ║   Local-first Cold Email Automation      ║
  ╚══════════════════════════════════════════╝
`)
);

// ─── Usage ───
if (!query) {
  console.log(chalk.yellow("Usage:"));
  console.log(
    chalk.white('  node main.js "Interior designers in Australia" [options]\n')
  );
  console.log(chalk.yellow("Options:"));
  console.log(chalk.white("  --send        Send real emails (default: dry-run)"));
  console.log(chalk.white("  --limit N     Process only N leads"));
  console.log(chalk.white("  --clear-logs  Clear previous log entries\n"));
  process.exit(0);
}

// ─── Clear logs if requested ───
if (clearFlag) {
  await clearLogs();
  console.log(chalk.gray("📋 Logs cleared.\n"));
}

// ─── Main Pipeline ───
async function run() {
  const startTime = Date.now();

  console.log(chalk.bold(`\n🔍 Query: "${query}"`));
  console.log(
    chalk.gray(
      `   Mode: ${sendMode ? chalk.red.bold("LIVE SEND") : chalk.green.bold("DRY RUN")}`
    )
  );
  if (limit < Infinity) console.log(chalk.gray(`   Limit: ${limit} leads\n`));
  else console.log();

  // ═══ STEP 1: Fetch Leads ═══
  const fetchSpinner = ora("Fetching leads from Serper API...").start();
  let leads;
  try {
    leads = await fetchLeads(query);
    fetchSpinner.succeed(
      chalk.green(`Found ${leads.length} unique leads`)
    );
  } catch (error) {
    fetchSpinner.fail(chalk.red(`Lead fetching failed: ${error.message}`));
    process.exit(1);
  }

  const toProcess = leads.slice(0, limit);
  console.log(chalk.gray(`   Processing ${toProcess.length} leads...\n`));

  // ═══ STEP 2: Scrape All Leads ═══
  console.log(chalk.bold(`\n🕵️  Scraping ${toProcess.length} leads to generate dataset...`));
  const scrapedLeads = [];

  for (let i = 0; i < toProcess.length; i++) {
    const lead = toProcess[i];
    const prefix = chalk.gray(`[${i + 1}/${toProcess.length}]`);
    const scrapeSpinner = ora(`${prefix} Scraping ${chalk.white(lead.name)}...`).start();

    const scraped = await scrapeWebsite(lead.website);

    if (!scraped) {
      scrapeSpinner.warn(chalk.yellow(`Skipped (inaccessible)`));
      scrapedLeads.push({
        ...lead,
        email: "",
        phones: "",
        socials: "",
        about: "Failed to scrape",
        services: "",
      });
    } else {
      const emailStatus = scraped.email ? chalk.green(`Found: ${scraped.email}`) : chalk.yellow("No email");
      scrapeSpinner.succeed(emailStatus);
      scrapedLeads.push({
        ...lead,
        ...scraped,
        phones: (scraped.phones || []).join(" | "),
        socials: (scraped.socials || []).join(" | "),
      });
    }
  }

  // ═══ STEP 3: Auto-Download CSV ═══
  let csvContent = "Name,Website,Source,Email,Phones,Socials\n";
  for (const l of scrapedLeads) {
    const safeStr = (str) => '"' + String(str || "").replace(/"/g, '""') + '"';
    csvContent += [
      safeStr(l.name),
      safeStr(l.website),
      safeStr(l.source),
      safeStr(l.email),
      safeStr(l.phones),
      safeStr(l.socials),
    ].join(",") + "\n";
  }

  const csvFilename = `scraped_leads_${Date.now()}.csv`;
  const csvPath = path.join(os.homedir(), "Desktop", csvFilename);
  await writeFile(csvPath, csvContent, "utf8");
  console.log(chalk.cyan.bold(`\n💾 CSV Auto-generated: `) + chalk.gray(csvPath));

  // ═══ STEP 4: Emailing Phase ═══
  console.log(chalk.bold(`\n📧 Starting Email Campaign...`));
  let processed = 0;
  let emailed = 0;
  let skipped = 0;
  let failed = 0;

  const validLeads = scrapedLeads.filter((l) => l.email);
  skipped += scrapedLeads.length - validLeads.length;

  if (validLeads.length === 0) {
    console.log(chalk.yellow("   No emails found to send in this batch."));
  }

  for (let i = 0; i < validLeads.length; i++) {
    const lead = validLeads[i];
    const prefix = chalk.gray(`[${i + 1}/${validLeads.length}]`);

    console.log(`\n${prefix} ${chalk.bold.white(lead.name)}`);
    console.log(chalk.gray(`      To: ${lead.email}`));

    // ── AI Generate ──
    const aiSpinner = ora({ text: "   Generating personalized email...", indent: 4 }).start();
    const emailContent = await generateEmail({
      business_name: lead.name,
      about: lead.about,
      services: lead.services,
    });
    aiSpinner.succeed(chalk.green(`Subject: "${emailContent.subject}"`));

    // ── Send Email ──
    const sendSpinner = ora({
      text: sendMode ? "   Sending email via SMTP..." : "   [Dry run] Logging email...",
      indent: 4,
    }).start();

    const result = await sendEmail(
      {
        to: lead.email,
        subject: emailContent.subject,
        body: emailContent.email_body,
      },
      !sendMode
    );

    if (result.success) {
      sendSpinner.succeed(chalk.green(result.message));
      emailed++;
      await logResult({
        lead: lead.name,
        email: lead.email,
        status: "sent",
      });
    } else {
      sendSpinner.fail(chalk.red(result.message));
      failed++;
      await logResult({
        lead: lead.name,
        email: lead.email,
        status: "failed",
        error: result.message,
      });
    }

    processed++;

    // ── Delay between emails ──
    if (sendMode && i < validLeads.length - 1) {
      const delaySpinner = ora({
        text: chalk.gray("   Waiting to avoid spam filters (rate limit)..."),
        indent: 4,
      }).start();
      await randomDelay();
      delaySpinner.clear();
    }
  }

  // ═══ Summary ═══
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = await getStats();

  console.log(
    chalk.bold.cyan(`
  ══════════════════════════════════════════
   📊 Run Summary
  ──────────────────────────────────────────
   Query:      "${query}"
   Mode:       ${sendMode ? "LIVE" : "DRY RUN"}
   Leads:      ${leads.length} found, ${toProcess.length} processed
   Emailed:    ${emailed}
   Skipped:    ${skipped} (no email)
   Failed:     ${failed}
   Time:       ${elapsed}s
  ──────────────────────────────────────────
   Total logs: ${stats.total} (${stats.sent} sent, ${stats.failed} failed)
  ══════════════════════════════════════════
`)
  );
}

run().catch((error) => {
  console.error(chalk.red(`\n💥 Fatal error: ${error.message}\n`));
  process.exit(1);
});
