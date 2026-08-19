import { chromium } from '@playwright/test';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5176/ ...');
  try {
    await page.goto('http://localhost:5176/', { timeout: 10000 });
    console.log('Page loaded successfully!');
    const title = await page.title();
    console.log('Title:', title);
    
    // Take a screenshot of the login page
    await page.screenshot({ path: 'login_page_smoke.png' });
    console.log('Screenshot saved to login_page_smoke.png');
  } catch (err) {
    console.error('Error during browser run:', err);
  } finally {
    await browser.close();
  }
}

main();
