import nodemailer from "nodemailer";
import config from "../config/config.js";
import { buildEmailHtml, buildEmailText } from "./emailTemplate.js";

// ── In-memory state for rate limiting ──
let emailsSentToday = 0;
let lastResetDate = new Date().toDateString();
const sentEmails = new Set(); // Duplicate prevention

/**
 * Create a reusable SMTP transporter.
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });
}

/**
 * Send an email via Gmail SMTP.
 * @param {{ to: string, subject: string, body: string }} emailData
 * @param {boolean} dryRun - If true, logs instead of sending
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendEmail({ to, subject, body }, dryRun = true) {
  // ── Reset daily counter at midnight ──
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    emailsSentToday = 0;
    lastResetDate = today;
  }

  // ── Rate limit check ──
  if (emailsSentToday >= config.MAX_EMAILS_PER_DAY) {
    return {
      success: false,
      message: `Daily limit reached (${config.MAX_EMAILS_PER_DAY} emails)`,
    };
  }

  // ── Duplicate check ──
  if (sentEmails.has(to.toLowerCase())) {
    return {
      success: false,
      message: `Duplicate email skipped: ${to}`,
    };
  }

  // ── Dry run mode ──
  if (dryRun) {
    sentEmails.add(to.toLowerCase());
    emailsSentToday++;
    return {
      success: true,
      message: `[DRY RUN] Would send to: ${to} | Subject: ${subject}`,
    };
  }

  // ── Actually send the email ──
  try {
    const transporter = createTransporter();

    // Extract business name from the 'to' address for template fallback
    const businessNameHint = to.split("@")[1]?.split(".")[0] || "there";

    await transporter.sendMail({
      from: config.SMTP_FROM,
      to,
      subject,
      text: buildEmailText(body),
      html: buildEmailHtml({ subject, email_body: body, business_name: businessNameHint }),
    });

    sentEmails.add(to.toLowerCase());
    emailsSentToday++;

    return {
      success: true,
      message: `✅ Email sent to ${to}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to send to ${to}: ${error.message}`,
    };
  }
}

/**
 * Wait a random delay between min and max (for rate limiting).
 * @returns {Promise<void>}
 */
export function randomDelay() {
  const delay =
    config.EMAIL_DELAY_MIN +
    Math.random() * (config.EMAIL_DELAY_MAX - config.EMAIL_DELAY_MIN);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Get current email sending stats.
 */
export function getEmailStats() {
  return {
    sentToday: emailsSentToday,
    limit: config.MAX_EMAILS_PER_DAY,
    remaining: config.MAX_EMAILS_PER_DAY - emailsSentToday,
    uniqueRecipients: sentEmails.size,
  };
}
