import puppeteer from 'puppeteer-core';
import path from 'path';

async function testCompletePlatform() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  console.log('Navigating to http://127.0.0.1:3000 ...');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const artifactDir = 'C:\\Users\\moham\\.gemini\\antigravity-ide\\brain\\1e0a8b26-d3bf-42d6-8cab-ed21528f35fb';

  // Helper function to click sidebar button by text
  async function clickSidebar(label) {
    console.log(`Navigating to ${label}...`);
    const buttons = await page.$$('aside button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes(label)) {
        await btn.click();
        await new Promise(r => setTimeout(r, 1200));
        return true;
      }
    }
    return false;
  }

  // 1. Capture Command Center
  console.log('Capturing Page 1: Command Center...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_command_center.png') });

  // 2. Capture Simulation Lab
  await clickSidebar('Disaster Simulation Lab');
  console.log('Capturing Page 2: Simulation Lab...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_sim_lab.png') });

  // 3. Capture Emergency Response
  await clickSidebar('Emergency Response');
  console.log('Capturing Page 3: Emergency Response...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_emergency_response.png') });

  // 4. Capture Medical & Ambulance
  await clickSidebar('Medical & Ambulance');
  console.log('Capturing Page 4: Medical & Ambulance...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_medical_ambulance.png') });

  // 5. Capture Fire & Rescue
  await clickSidebar('Fire & Rescue');
  console.log('Capturing Page 5: Fire & Rescue...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_fire_rescue.png') });

  // 6. Capture Relief & Assistance
  await clickSidebar('Relief & Assistance');
  console.log('Capturing Page 6: Relief & Assistance...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_relief_assistance.png') });

  // 7. Capture Resource & Evacuation Map
  await clickSidebar('Resource & Evacuation Map');
  console.log('Capturing Page 7: Resource & Evacuation Map...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_evacuation_map.png') });

  // 8. Capture Hospitals & Shelters
  await clickSidebar('Hospitals & Shelters');
  console.log('Capturing Page 8: Hospitals & Shelters...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_hospitals_shelters.png') });

  // 9. Capture Incident Management
  await clickSidebar('Incident Management');
  console.log('Capturing Page 9: Incident Management...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_incident_management.png') });

  // 10. Capture Analytics & Reports
  await clickSidebar('Analytics & Reports');
  console.log('Capturing Page 10: Analytics & Reports...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_analytics_reports.png') });

  // 11. Capture Settings & Data Sources
  await clickSidebar('Settings & Data Sources');
  console.log('Capturing Page 11: Settings & Data Sources...');
  await page.screenshot({ path: path.join(artifactDir, 'crisis360_settings_sources.png') });

  // Test Action: Open New Incident Modal & verify form inputs
  console.log('Testing New Incident Modal submission...');
  const topBarButtons = await page.$$('header button');
  for (const btn of topBarButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('LOG INCIDENT')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }

  // Type incident title and submit
  const inputs = await page.$$('input[type="text"]');
  if (inputs.length > 0) {
    await inputs[0].type('Simulated Flash Flood Alert Ward 5');
  }

  console.log('Closing modal...');
  const closeBtn = await page.$('form button[type="button"]');
  if (closeBtn) await closeBtn.click();
  await new Promise(r => setTimeout(r, 500));

  console.log('Total page errors encountered:', errors.length);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
  }

  await browser.close();
}

testCompletePlatform();
