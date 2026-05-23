import axios from "axios";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import config from "../config/config.js";

/**
 * Fetch business leads from Serper API based on a search query.
 * @param {string} query - e.g. "Interior designers in Australia"
 * @returns {Promise<Array<{name: string, website: string, source: string}>>}
 */
export async function fetchLeads(query) {
  const results = [];

  try {
    // ── Google Maps results (local businesses) ──
    const mapsResponse = await axios.post(
      "https://google.serper.dev/maps",
      { q: query, num: Math.min(config.MAX_LEADS, 20) },
      {
        headers: {
          "X-API-KEY": config.SERPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const places = mapsResponse.data.places || [];
    for (const place of places) {
      if (place.website) {
        results.push({
          name: place.title || "Unknown",
          website: place.website,
          source: "google_maps",
        });
      }
    }

    // ── Google Search (organic results) ──
    const searchResponse = await axios.post(
      "https://google.serper.dev/search",
      { q: query, num: Math.min(config.MAX_LEADS, 100) },
      {
        headers: {
          "X-API-KEY": config.SERPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const organic = searchResponse.data.organic || [];
    for (const item of organic) {
      if (item.link) {
        results.push({
          name: item.title || "Unknown",
          website: item.link,
          source: "google",
        });
      }
    }
  } catch (error) {
    console.error(`❌ Lead fetching error: ${error.message}`);
    throw error;
  }

  // ── Deduplicate by website domain ──
  const seen = new Set();
  const unique = results.filter((lead) => {
    try {
      const domain = new URL(lead.website).hostname;
      if (seen.has(domain)) return false;
      seen.add(domain);
      return true;
    } catch {
      return false;
    }
  });

  // ── Cap at MAX_LEADS ──
  const capped = unique.slice(0, config.MAX_LEADS);

  // ── Save to data/leads.json ──
  const leadsPath = join(config.DATA_DIR, "leads.json");
  await writeFile(leadsPath, JSON.stringify(capped, null, 2), "utf-8");

  return capped;
}

/**
 * Load previously saved leads from disk.
 * @returns {Promise<Array>}
 */
export async function loadLeads() {
  const leadsPath = join(config.DATA_DIR, "leads.json");
  try {
    const data = await readFile(leadsPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}
