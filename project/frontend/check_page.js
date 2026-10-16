import puppeteer from 'puppeteer-core';
import path from 'path';

async function check() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('[BROWSER PAGE ERROR]', err.message));

  console.log('Navigating to http://127.0.0.1:3000 ...');
  try {
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Loaded domcontentloaded. Waiting 4 seconds for 3D digital twin...');
    await new Promise(r => setTimeout(r, 4000));

    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    console.log('Root HTML length:', rootHtml?.length);
    console.log('Root HTML snippet:', rootHtml?.slice(0, 400));

    const artifactDir = 'C:\\Users\\moham\\.gemini\\antigravity-ide\\brain\\1e0a8b26-d3bf-42d6-8cab-ed21528f35fb';
    const screenshotPath = path.join(artifactDir, 'nexus_live_view.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot successfully saved to:', screenshotPath);
  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await browser.close();
  }
}

check();
