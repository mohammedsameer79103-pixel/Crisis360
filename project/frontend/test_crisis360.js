import puppeteer from 'puppeteer-core';
import path from 'path';

async function testCrisis360Upgraded() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const consoleErrors = [];
  page.on('console', msg => {
    console.log('[BROWSER CONSOLE]', msg.type(), msg.text());
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    console.error('[BROWSER PAGE ERROR]', err.message);
    consoleErrors.push(err.message);
  });

  console.log('--- Step 1: Navigating to Crisis360 UI at http://127.0.0.1:3000 ---');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  console.log('--- Step 2: Verifying Page Title & Header ---');
  const pageTitle = await page.title();
  console.log('Page Title:', pageTitle);

  // Check Map Tools & Radar Drawer
  console.log('--- Step 3: Testing Map Tools & Radar Collapsible Drawer ---');
  const mapToolsOpened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('MAP TOOLS & RADAR'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Map Tools & Radar button:', mapToolsOpened);
  await new Promise(r => setTimeout(r, 1000));

  // Check layers tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const layersBtn = buttons.find(b => b.textContent && b.textContent.includes('LAYERS'));
    if (layersBtn) layersBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Check legend tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const legendBtn = buttons.find(b => b.textContent && b.textContent.includes('LEGEND'));
    if (legendBtn) legendBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('--- Step 4: Running Simulation & Verifying 3D Destruction ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const runBtn = buttons.find(b => b.textContent && b.textContent.includes('RUN SIMULATION'));
    if (runBtn) runBtn.click();
  });

  console.log('Advancing simulation ticks for 4 seconds...');
  await new Promise(r => setTimeout(r, 4000));

  // Verify AI Copilot Tab in AnalyticsDeck
  console.log('--- Step 5: Checking Explainable AI Copilot Tab ---');
  const copilotContent = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasCopilotTab: body.includes('AI COPILOT'),
      hasPrimaryThreat: body.includes('Primary Hazard Front') || body.includes('Breach') || body.includes('Overtopping'),
      hasTacticalDirectives: body.includes('Ranked Tactical Directives') || body.includes('Execute Directive')
    };
  });
  console.log('AI Copilot verification:', copilotContent);

  // Take screenshot of running upgraded viewport
  const artifactDir = 'C:\\Users\\moham\\.gemini\\antigravity-ide\\brain\\1e0a8b26-d3bf-42d6-8cab-ed21528f35fb';
  const viewportScreenshotPath = path.join(artifactDir, 'crisis360_upgraded_viewport.png');
  await page.screenshot({ path: viewportScreenshotPath });
  console.log('Saved upgraded viewport screenshot to:', viewportScreenshotPath);

  // Open Situation Report Modal
  console.log('--- Step 6: Testing Incident Situation Report (SitRep) Modal ---');
  const openedModal = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const reportBtn = buttons.find(b => b.textContent && (b.textContent.includes('EXPORT SITREP') || b.textContent.includes('SITREP')));
    if (reportBtn) {
      reportBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Export SitRep button:', openedModal);
  await new Promise(r => setTimeout(r, 1500));

  // Check modal contents
  const sitrepModalData = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasModalTitle: body.includes('CRISIS360 INCIDENT SITREP'),
      hasMatrix: body.includes('Three-Future Decision Matrix'),
      hasBranchA: body.includes('Branch A (No Intervention)'),
      hasBranchB: body.includes('Branch B (Early Intervention)'),
      hasBranchC: body.includes('Branch C (Resource-Constrained)'),
      hasAvertedLoss: body.includes('Loss Averted by Early Intervention') || body.includes('Direct Asset Loss Averted')
    };
  });
  console.log('SitRep Modal content verification:', sitrepModalData);

  const modalScreenshotPath = path.join(artifactDir, 'crisis360_sitrep_modal.png');
  await page.screenshot({ path: modalScreenshotPath });
  console.log('Saved SitRep modal screenshot to:', modalScreenshotPath);

  // Close modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find(b => b.textContent && b.textContent.includes('Close Report'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- Step 7: Testing Timeline Milestone Jump ---');
  await page.evaluate(() => {
    // Click on the slider or timeline milestone pins
    const pins = Array.from(document.querySelectorAll('div[title*="T+"]'));
    if (pins.length > 0) {
      pins[0].click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('--- Final Console Errors Check ---');
  console.log('Total Console Errors encountered:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Console Errors:', consoleErrors);
  } else {
    console.log('SUCCESS: Zero console errors encountered!');
  }

  await browser.close();
}

testCrisis360Upgraded().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
