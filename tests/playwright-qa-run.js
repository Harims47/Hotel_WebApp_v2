import { chromium } from '@playwright/test';
import fs from 'fs';

// Log console and page errors
const consoleErrors = [];
const pageErrors = [];

async function loginAndNavigate(page, username, password, targetUrl) {
  console.log(`\nLogging in as ${username}...`);
  await page.goto('http://localhost:5176/login');
  // Clear local storage and cookies to force logout/reset auth state
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  }).catch(() => {});
  await page.goto('http://localhost:5176/login');
  await page.waitForSelector('input[name="username"]', { timeout: 5000 });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500); // Wait for navigation/hydration
  
  if (targetUrl) {
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(`http://localhost:5176${targetUrl}`);
    await page.waitForTimeout(1000);
  }
}

async function checkPageContent(page, pageName) {
  const text = await page.innerText('body').catch(() => '');
  
  const issues = [];
  
  // Check for common bug markers
  if (text.includes('NaN')) {
    issues.push(`Found 'NaN' in text content on ${pageName}`);
  }
  if (text.includes('undefined')) {
    issues.push(`Found 'undefined' in text content on ${pageName}`);
  }
  if (text.includes('null') && !pageName.toLowerCase().includes('null')) {
    const matches = text.match(/\bnull\b/g);
    if (matches && matches.length > 2) {
      issues.push(`Found potential 'null' in text content on ${pageName}`);
    }
  }
  if (text.includes('Invalid Date')) {
    issues.push(`Found 'Invalid Date' in text content on ${pageName}`);
  }
  if (text.includes('₹NaN')) {
    issues.push(`Found '₹NaN' in text content on ${pageName}`);
  }

  return issues;
}

async function runQA() {
  console.log('Starting visual and functional QA pass...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message + '\n' + err.stack);
  });

  const bugReport = [];

  // ==========================================
  // MODULE 1 - SUPER ADMIN
  // ==========================================
  await loginAndNavigate(page, 'superadmin', '123456');
  
  const superAdminPages = [
    { name: 'Users', path: '/admin/users' },
    { name: 'Tables', path: '/admin/tables' },
    { name: 'Menu', path: '/admin/menu' },
    { name: 'Restaurant Settings', path: '/admin/restaurant' },
    { name: 'Tax Settings', path: '/admin/settings/tax' },
    { name: 'Payment Settings', path: '/admin/settings/payment-methods' },
    { name: 'Mgmt Dashboard', path: '/management/dashboard' },
    { name: 'Mgmt Reports', path: '/management/reports' },
  ];

  for (const adminPage of superAdminPages) {
    console.log(`Testing Admin page: ${adminPage.name}`);
    await page.goto(`http://localhost:5176${adminPage.path}`);
    await page.waitForTimeout(800);
    
    const contentIssues = await checkPageContent(page, adminPage.name);
    bugReport.push(...contentIssues.map(issue => ({ module: 'Super Admin', page: adminPage.name, issue, type: 'Data Error' })));
  }

  // ==========================================
  // MODULE 2 - INVENTORY MANAGER
  // ==========================================
  await loginAndNavigate(page, 'inventory', '123456');

  const inventoryPages = [
    { name: 'Inventory Dashboard', path: '/inventory/dashboard' },
    { name: 'Low Stock', path: '/inventory/low-stock' },
    { name: 'Purchase Orders List', path: '/inventory/purchase-orders' },
    { name: 'GRN List', path: '/inventory/grn' },
    { name: 'Issues List', path: '/inventory/issues' },
    { name: 'Waste List', path: '/inventory/waste' },
    { name: 'Transfers List', path: '/inventory/transfers' },
    { name: 'Adjustments List', path: '/inventory/adjustments' },
    { name: 'Stock Counts List', path: '/inventory/stock-counts' },
    { name: 'Reimbursements List', path: '/inventory/reimbursements' },
    { name: 'Current Stock', path: '/inventory/stock' },
    { name: 'Stock Ledger', path: '/inventory/stock-ledger' },
    { name: 'Alerts', path: '/inventory/alerts' },
    { name: 'Inventory Reports', path: '/inventory/reports' },
    { name: 'Items Master', path: '/inventory/items' },
    { name: 'Categories Master', path: '/inventory/categories' },
    { name: 'Suppliers Master', path: '/inventory/suppliers' },
    { name: 'Locations Master', path: '/inventory/locations' },
    { name: 'UOM Master', path: '/inventory/uom' }
  ];

  for (const invPage of inventoryPages) {
    console.log(`Testing Inventory page: ${invPage.name}`);
    await page.goto(`http://localhost:5176${invPage.path}`);
    await page.waitForTimeout(800);
    
    const contentIssues = await checkPageContent(page, invPage.name);
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: invPage.name, issue, type: 'Data Error' })));
  }

  // ------------------------------------------
  // Creation Screen Testing
  // ------------------------------------------

  // 1. New Purchase Order
  console.log('Testing New Purchase Order screen...');
  await page.goto('http://localhost:5176/inventory/purchase-orders/new');
  await page.waitForTimeout(1000);
  try {
    // Check if NaN/undefined/Invalid Date is loaded
    let contentIssues = await checkPageContent(page, 'New Purchase Order Load');
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New Purchase Order', issue, type: 'Visual Error' })));
    
    await page.selectOption('select', { index: 1 }).catch(() => {});
    const addItemBtn = page.locator('button:has-text("Add Item"), button:has-text("Add")').first();
    if (await addItemBtn.count() > 0) {
      await addItemBtn.click();
      await page.waitForTimeout(500);
      await page.selectOption('tbody tr select', { index: 1 }).catch(() => {});
      await page.fill('input[type="number"]', '10');
      const rateInputs = page.locator('tbody tr input[type="number"]');
      if (await rateInputs.count() > 1) {
        await rateInputs.nth(1).fill('150');
      }
      await page.waitForTimeout(500);
      
      contentIssues = await checkPageContent(page, 'New Purchase Order Form filled');
      bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New Purchase Order', issue, type: 'Calculation Error' })));
    }
  } catch (e) {
    console.error('Error during PO creation test:', e);
  }

  // 2. New GRN
  console.log('Testing New GRN screen...');
  await page.goto('http://localhost:5176/inventory/grn/new');
  await page.waitForTimeout(1000);
  try {
    const contentIssues = await checkPageContent(page, 'New GRN');
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New GRN', issue, type: 'Visual Error' })));
  } catch (e) {
    console.error(e);
  }

  // 3. New Issue
  console.log('Testing New Issue screen...');
  await page.goto('http://localhost:5176/inventory/issues/new');
  await page.waitForTimeout(1000);
  try {
    const contentIssues = await checkPageContent(page, 'New Issue');
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New Issue', issue, type: 'Visual Error' })));
  } catch (e) {
    console.error(e);
  }

  // 4. New Waste
  console.log('Testing New Waste screen...');
  await page.goto('http://localhost:5176/inventory/waste/new');
  await page.waitForTimeout(1000);
  try {
    const contentIssues = await checkPageContent(page, 'New Waste');
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New Waste', issue, type: 'Visual Error' })));
  } catch (e) {
    console.error(e);
  }

  // 5. New Transfer
  console.log('Testing New Transfer screen...');
  await page.goto('http://localhost:5176/inventory/transfers/new');
  await page.waitForTimeout(1000);
  try {
    const contentIssues = await checkPageContent(page, 'New Transfer');
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New Transfer', issue, type: 'Visual Error' })));
  } catch (e) {
    console.error(e);
  }

  // 6. New Adjustment
  console.log('Testing New Adjustment screen...');
  await page.goto('http://localhost:5176/inventory/adjustments/new');
  await page.waitForTimeout(1000);
  try {
    const contentIssues = await checkPageContent(page, 'New Adjustment');
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New Adjustment', issue, type: 'Visual Error' })));
  } catch (e) {
    console.error(e);
  }

  // 7. New Stock Count
  console.log('Testing New Stock Count screen...');
  await page.goto('http://localhost:5176/inventory/stock-counts/new');
  await page.waitForTimeout(1000);
  try {
    const contentIssues = await checkPageContent(page, 'New Stock Count');
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New Stock Count', issue, type: 'Visual Error' })));
  } catch (e) {
    console.error(e);
  }

  // 8. New Reimbursement
  console.log('Testing New Reimbursement screen...');
  await page.goto('http://localhost:5176/inventory/reimbursements/new');
  await page.waitForTimeout(1000);
  try {
    const contentIssues = await checkPageContent(page, 'New Reimbursement');
    bugReport.push(...contentIssues.map(issue => ({ module: 'Inventory', page: 'New Reimbursement', issue, type: 'Visual Error' })));
  } catch (e) {
    console.error(e);
  }

  // ==========================================
  // MODULE 3 - RESTAURANT OPERATIONS
  // ==========================================
  // Cashier
  await loginAndNavigate(page, 'cashier', '123456');
  const cashierPages = [
    { name: 'Bills', path: '/cashier/bills' },
    { name: 'Takeaway', path: '/cashier/takeaway' },
    { name: 'Delivery', path: '/cashier/delivery' },
    { name: 'Payments', path: '/cashier/payments' }
  ];
  for (const cashPage of cashierPages) {
    console.log(`Testing Cashier page: ${cashPage.name}`);
    await page.goto(`http://localhost:5176${cashPage.path}`);
    await page.waitForTimeout(800);
    const contentIssues = await checkPageContent(page, cashPage.name);
    bugReport.push(...contentIssues.map(issue => ({ module: 'Restaurant Operations', page: cashPage.name, issue, type: 'Data Error' })));
  }

  // Waiter
  await loginAndNavigate(page, 'waiter1', '123456');
  const waiterPages = [
    { name: 'Waiter Tables', path: '/waiter/tables' },
    { name: 'Waiter Orders', path: '/waiter/orders' },
    { name: 'Waiter Menu', path: '/waiter/menu' }
  ];
  for (const waitPage of waiterPages) {
    console.log(`Testing Waiter page: ${waitPage.name}`);
    await page.goto(`http://localhost:5176${waitPage.path}`);
    await page.waitForTimeout(800);
    const contentIssues = await checkPageContent(page, waitPage.name);
    bugReport.push(...contentIssues.map(issue => ({ module: 'Restaurant Operations', page: waitPage.name, issue, type: 'Data Error' })));
  }

  // KOT (Kitchen)
  await loginAndNavigate(page, 'kitchen', '123456');
  const kotPages = [
    { name: 'KOT Orders', path: '/kot/orders' },
    { name: 'KOT Preparing', path: '/kot/preparing' },
    { name: 'KOT Ready', path: '/kot/ready' },
    { name: 'KOT Completed', path: '/kot/completed' }
  ];
  for (const kotPage of kotPages) {
    console.log(`Testing KOT page: ${kotPage.name}`);
    await page.goto(`http://localhost:5176${kotPage.path}`);
    await page.waitForTimeout(800);
    const contentIssues = await checkPageContent(page, kotPage.name);
    bugReport.push(...contentIssues.map(issue => ({ module: 'Restaurant Operations', page: kotPage.name, issue, type: 'Data Error' })));
  }

  // Delivery Boy
  await loginAndNavigate(page, 'delivery', '123456');
  const deliveryPages = [
    { name: 'Delivery Orders', path: '/delivery/orders' }
  ];
  for (const delPage of deliveryPages) {
    console.log(`Testing Delivery page: ${delPage.name}`);
    await page.goto(`http://localhost:5176${delPage.path}`);
    await page.waitForTimeout(800);
    const contentIssues = await checkPageContent(page, delPage.name);
    bugReport.push(...contentIssues.map(issue => ({ module: 'Restaurant Operations', page: delPage.name, issue, type: 'Data Error' })));
  }

  // ==========================================
  // MODULE 4 - GENERAL MANAGER
  // ==========================================
  await loginAndNavigate(page, 'gm', '123456');
  const gmPages = [
    { name: 'GM Dashboard', path: '/management/dashboard' },
    { name: 'GM Management Reports', path: '/management/reports' },
    { name: 'GM Orders', path: '/gm/orders' },
    { name: 'GM KOT', path: '/gm/kot' },
    { name: 'GM Tables', path: '/gm/tables' },
    { name: 'GM Bills', path: '/gm/bills' },
    { name: 'GM Delivery', path: '/gm/delivery' }
  ];
  for (const gmPage of gmPages) {
    console.log(`Testing GM page: ${gmPage.name}`);
    await page.goto(`http://localhost:5176${gmPage.path}`);
    await page.waitForTimeout(800);
    const contentIssues = await checkPageContent(page, gmPage.name);
    bugReport.push(...contentIssues.map(issue => ({ module: 'General Manager', page: gmPage.name, issue, type: 'Data Error' })));
  }

  // Clean up
  await browser.close();

  // Print results
  console.log('\n--- QA Run Completed ---');
  console.log(`Total data issues found: ${bugReport.length}`);
  console.log(`Total console errors: ${consoleErrors.length}`);
  console.log(`Total page/js errors: ${pageErrors.length}`);
  
  // Write to a temporary file
  const results = {
    bugReport,
    consoleErrors,
    pageErrors
  };
  fs.writeFileSync('qa_results.json', JSON.stringify(results, null, 2));
  console.log('Results written to qa_results.json');
}

runQA().catch(err => {
  console.error('QA script failed to run:', err);
  process.exit(1);
});
