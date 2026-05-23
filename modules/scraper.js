import axios from "axios";
import * as cheerio from "cheerio";
import config from "../config/config.js";

// Regex to match email addresses in text
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Common pages that often contain contact info
const CONTACT_PATHS = ["/contact", "/contact-us", "/about", "/about-us"];

/**
 * Scrape a website for emails and business info.
 * @param {string} url - The website URL to scrape
 * @returns {Promise<{email: string|null, about: string, services: string} | null>}
 */
export async function scrapeWebsite(url) {
  const emails = new Set();
  const phones = new Set();
  const socials = new Set();
  let about = "";
  let services = "";
  try {
    // ── Scrape the main page ──
    const mainPage = await fetchPage(url);
    if (mainPage) {
      extractEmails(mainPage, emails);
      extractPhones(mainPage, phones);
      extractSocials(mainPage, socials);
      about = extractAbout(mainPage);
      services = extractServices(mainPage);
    }

    // ── Try contact/about pages for more emails ──
    if (emails.size === 0) {
      for (const path of CONTACT_PATHS) {
        try {
          const contactUrl = new URL(path, url).href;
          const page = await fetchPage(contactUrl);
          if (page) {
            extractEmails(page, emails);
            extractPhones(page, phones); // also extract phones from contact page
            if (!about) about = extractAbout(page);
          }
          if (emails.size > 0) break; // Found an email, stop
        } catch {
          // Path doesn't exist, skip
        }
      }
    }
  } catch (error) {
    // Total failure scraping this site
    return null;
  }

  // ── Filter out generic/junk emails ──
  const filtered = [...emails].filter((e) => !isJunkEmail(e));

  return {
    email: filtered.length > 0 ? filtered[0] : null,
    phones: [...phones],
    socials: [...socials],
    about: about || "No description available",
    services: services || "Not specified",
  };
}

/**
 * Fetch a page and return a Cheerio instance.
 */
async function fetchPage(url) {
  try {
    const response = await axios.get(url, {
      timeout: config.SCRAPE_TIMEOUT,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      maxRedirects: 3,
      // Only accept HTML responses
      validateStatus: (status) => status < 400,
    });

    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("text/html")) return null;

    return cheerio.load(response.data);
  } catch {
    return null;
  }
}

/**
 * Extract email addresses from a Cheerio-parsed page.
 */
function extractEmails($, emailSet) {
  // 1. mailto: links
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const email = href.replace("mailto:", "").split("?")[0].trim();
    if (email && EMAIL_REGEX.test(email)) {
      emailSet.add(email.toLowerCase());
    }
  });

  // 2. Emails in visible text
  const bodyText = $("body").text();
  const matches = bodyText.match(EMAIL_REGEX) || [];
  for (const match of matches) {
    emailSet.add(match.toLowerCase());
  }
}

/**
 * Extract a short description/about text from the page.
 */
function extractAbout($) {
  // Try meta description first
  const metaDesc =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  if (metaDesc.length > 20) return metaDesc.slice(0, 300);

  // Fallback: first meaningful paragraph
  const paragraphs = $("p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((p) => p.length > 40);

  return paragraphs[0]?.slice(0, 300) || "";
}

/**
 * Extract services from headings and lists.
 */
function extractServices($) {
  const items = [];

  // Gather h2/h3 headings (often list services)
  $("h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 3 && text.length < 100) {
      items.push(text);
    }
  });

  return items.slice(0, 8).join(", ") || "";
}

/**
 * Filter out common junk/noreply emails.
 */
function isJunkEmail(email) {
  const junk = [
    "noreply",
    "no-reply",
    "mailer-daemon",
    "postmaster",
    "webmaster",
    "support@wordpress",
    "wix.com",
    "squarespace.com",
    "example.com",
    "sentry.io",
    ".png",
    ".jpg",
    ".gif",
  ];
  return junk.some((j) => email.includes(j));
}

/**
 * Extract phone numbers from links and text format
 */
function extractPhones($, phoneSet) {
  // 1. tel: links
  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const phone = href.replace("tel:", "").split("?")[0].trim();
    if (phone) phoneSet.add(phone.toLowerCase());
  });

  // 2. Visible text matching generic international phone pattern
  const bodyText = $("body").text();
  const phoneMatches = bodyText.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g) || [];
  for (const match of phoneMatches) {
    const cleanMatch = match.trim();
    // Filter out long strings of raw digits without formatting (likely timestamps/IDs)
    if (/^\d{10,}$/.test(cleanMatch) || /17[0-9]{11}/.test(cleanMatch) || cleanMatch.length > 16) continue;
    
    // Ensure it has at least some phone formatting or starts with +
    if (cleanMatch.length >= 8 && cleanMatch.length <= 16) {
      phoneSet.add(cleanMatch);
    }
  }
}

/**
 * Extract social media profiles from links
 */
function extractSocials($, socialSet) {
  const targetDomains = ["instagram.com/", "linkedin.com/in/", "linkedin.com/company/", "facebook.com/", "twitter.com/", "x.com/"];
  $('a[href]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const lowerHref = href.toLowerCase();
    
    // Check if it's a social link, but ignore share links
    if (targetDomains.some(domain => lowerHref.includes(domain)) && 
       !lowerHref.includes("/share") && 
       !lowerHref.includes("intent/tweet")) {
      socialSet.add(href); // keep original case
    }
  });
}
