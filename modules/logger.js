import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import config from "../config/config.js";

const LOGS_PATH = join(config.DATA_DIR, "logs.json");

/**
 * Ensure the data directory and logs file exist.
 */
async function ensureLogsFile() {
  try {
    await mkdir(config.DATA_DIR, { recursive: true });
    try {
      await readFile(LOGS_PATH, "utf-8");
    } catch {
      await writeFile(LOGS_PATH, "[]", "utf-8");
    }
  } catch (error) {
    console.error(`⚠️  Logger init error: ${error.message}`);
  }
}

/**
 * Log a result entry to data/logs.json.
 * @param {{ lead: string, email: string, status: string, error?: string }} entry
 */
export async function logResult(entry) {
  await ensureLogsFile();

  try {
    const raw = await readFile(LOGS_PATH, "utf-8");
    const logs = JSON.parse(raw);

    logs.push({
      lead: entry.lead,
      email: entry.email,
      status: entry.status,
      error: entry.error || null,
      timestamp: new Date().toISOString(),
    });

    await writeFile(LOGS_PATH, JSON.stringify(logs, null, 2), "utf-8");
  } catch (error) {
    console.error(`⚠️  Logging error: ${error.message}`);
  }
}

/**
 * Get summary stats from the logs.
 * @returns {Promise<{ total: number, sent: number, failed: number, skipped: number }>}
 */
export async function getStats() {
  await ensureLogsFile();

  try {
    const raw = await readFile(LOGS_PATH, "utf-8");
    const logs = JSON.parse(raw);

    return {
      total: logs.length,
      sent: logs.filter((l) => l.status === "sent").length,
      failed: logs.filter((l) => l.status === "failed").length,
      skipped: logs.filter((l) => l.status === "skipped").length,
    };
  } catch {
    return { total: 0, sent: 0, failed: 0, skipped: 0 };
  }
}

/**
 * Clear all logs (useful for fresh runs).
 */
export async function clearLogs() {
  await ensureLogsFile();
  await writeFile(LOGS_PATH, "[]", "utf-8");
}
