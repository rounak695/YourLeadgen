import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, 'assets');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// 1. Dashboard tab
console.log('📸 Screenshotting Dashboard tab...');
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: path.join(assetsDir, 'screenshot_dashboard.png'), fullPage: false });
console.log('✔ Saved screenshot_dashboard.png');

// 2. CRM tab
console.log('📸 Screenshotting CRM tab...');
await page.click('[data-tab="crm"]');
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: path.join(assetsDir, 'screenshot_crm.png'), fullPage: false });
console.log('✔ Saved screenshot_crm.png');

// 3. Settings tab
console.log('📸 Screenshotting Settings tab...');
await page.click('[data-tab="settings"]');
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: path.join(assetsDir, 'screenshot_settings.png'), fullPage: false });
console.log('✔ Saved screenshot_settings.png');

await browser.close();
console.log('✅ All screenshots saved to assets/');
