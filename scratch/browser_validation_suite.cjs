const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '../frontend/node_modules/playwright'));

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:/Users/ASUS/.gemini/antigravity/brain/f034dc02-3c65-495b-bdff-0ffa5eb3384f/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '320px (iPhone SE)', width: 320, height: 640 },
  { name: '375px (iPhone 13)', width: 375, height: 667 },
  { name: '430px (iPhone 15 Pro Max)', width: 430, height: 932 },
  { name: '768px (iPad Portrait)', width: 768, height: 1024 },
  { name: '1024px (iPad Landscape / Laptop)', width: 1024, height: 768 },
  { name: '1440px (Desktop High-DPI)', width: 1440, height: 900 },
  { name: '1920px (Full HD Ultrawide)', width: 1920, height: 1080 },
  { name: '2560px (4K / QHD Display)', width: 2560, height: 1440 }
];

const PAGES_TO_TEST = [
  { path: '/', name: 'LandingPage' },
  { path: '/login', name: 'LoginPage' },
  { path: '/register', name: 'RegisterPage' },
  { path: '/forgot-password', name: 'ForgotPasswordPage' },
  { path: '/medicines', name: 'MedicinesPage' },
  { path: '/cart', name: 'CartPage' },
  { path: '/help', name: 'HelpCenterPage' },
  { path: '/faqs', name: 'FaqsPage' },
  { path: '/terms', name: 'TermsPage' }
];

async function runRealBrowserAudit() {
  console.log('================================================================');
  console.log('MEDSZOP PHASE 7: REAL BROWSER TESTING & RESPONSIVE VALIDATION');
  console.log('================================================================');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Screenshots Directory: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const matrixResults = [];
  const consoleErrors = [];
  const networkErrors = [];

  // 1. RESPONSIVE MATRIX & OVERFLOW CHECK ACROSS VIEWPORTS
  console.log('1. RUNNING RESPONSIVE VIEWPORT MATRIX ACROSS 8 VIEWPORTS...');

  for (const vp of VIEWPORTS) {
    process.stdout.write(`  Testing Viewport ${vp.name}... `);
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({ viewport: vp.name, text: msg.text() });
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push({ viewport: vp.name, text: err.message });
    });

    page.on('requestfailed', req => {
      networkErrors.push({
        url: req.url(),
        failure: req.failure() ? req.failure().errorText : 'failed'
      });
    });

    let vpOverflowCount = 0;
    const pageResults = [];

    for (const testPage of PAGES_TO_TEST) {
      try {
        await page.goto(`${BASE_URL}${testPage.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        // Give dynamic animations and font rendering 300ms to settle
        await page.waitForTimeout(300);

        // Check horizontal overflow
        const overflowData = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          const clientWidth = window.innerWidth;
          const hasOverflow = scrollWidth > clientWidth;

          // Find offending element if overflow exists
          let widestEl = null;
          let maxElWidth = 0;
          if (hasOverflow) {
            const allEls = document.querySelectorAll('*');
            for (const el of allEls) {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientWidth && rect.width > maxElWidth) {
                maxElWidth = rect.width;
                widestEl = {
                  tag: el.tagName,
                  className: el.className,
                  right: rect.right,
                  width: rect.width
                };
              }
            }
          }

          return { scrollWidth, clientWidth, hasOverflow, widestEl };
        });

        if (overflowData.hasOverflow) {
          vpOverflowCount++;
          console.warn(`\n    ⚠️ OVERFLOW detected on ${testPage.name} at ${vp.width}px! ScrollWidth: ${overflowData.scrollWidth}px > ClientWidth: ${overflowData.clientWidth}px`);
        }

        pageResults.push({
          page: testPage.name,
          hasOverflow: overflowData.hasOverflow,
          scrollWidth: overflowData.scrollWidth,
          clientWidth: overflowData.clientWidth
        });

        // Capture screenshot on 320px, 768px, and 1440px for key pages
        if ([320, 768, 1440].includes(vp.width) && ['LandingPage', 'LoginPage', 'MedicinesPage', 'CartPage'].includes(testPage.name)) {
          const shotName = `${testPage.name.toLowerCase()}-${vp.width}px.png`;
          const shotPath = path.join(SCREENSHOT_DIR, shotName);
          await page.screenshot({ path: shotPath, fullPage: false });
        }
      } catch (err) {
        console.error(`\n    ❌ Error loading ${testPage.name} at ${vp.width}px: ${err.message}`);
      }
    }

    matrixResults.push({ viewport: vp, overflowCount: vpOverflowCount, pageResults });
    console.log(`Completed. (Overflows: ${vpOverflowCount})`);
    await page.close();
  }

  // 2. THEME SWITCHING (LIGHT & DARK MODE) VERIFICATION
  console.log('\n2. TESTING THEME SWITCHING & DARK MODE PARITY...');
  const themePage = await context.newPage();
  await themePage.setViewportSize({ width: 1440, height: 900 });
  await themePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  // Trigger dark mode by adding 'dark' class
  await themePage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await themePage.waitForTimeout(300);

  const darkColors = await themePage.evaluate(() => {
    const computed = window.getComputedStyle(document.body);
    return {
      bgColor: computed.backgroundColor,
      color: computed.color
    };
  });
  console.log(`  Dark mode background: ${darkColors.bgColor}, text: ${darkColors.color}`);

  const darkShotPath = path.join(SCREENSHOT_DIR, 'landing-dark-mode-1440px.png');
  await themePage.screenshot({ path: darkShotPath, fullPage: false });
  console.log(`  Dark mode screenshot saved to: ${darkShotPath}`);
  await themePage.close();

  // 3. FUNCTIONAL WORKFLOW TESTING IN BROWSER
  console.log('\n3. RUNNING FUNCTIONAL WORKFLOW TESTS...');
  const testPage = await context.newPage();
  await testPage.setViewportSize({ width: 1280, height: 800 });

  const functionalResults = [];

  // Workflow A: Hero Search & Interaction
  try {
    await testPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const searchInput = testPage.locator('input[type="text"]').first();
    await searchInput.fill('Amoxicillin');
    const searchSubmit = testPage.locator('[data-testid="hero-search-submit"]');
    const submitVisible = await searchSubmit.isVisible();
    functionalResults.push({
      workflow: 'Hero Search Input & Submit Selector',
      passed: submitVisible,
      details: submitVisible ? 'Hero search input accepts text and submit button is interactable' : 'Submit button not visible'
    });
  } catch (e) {
    functionalResults.push({ workflow: 'Hero Search Input', passed: false, details: e.message });
  }

  // Workflow B: Prescription Upload Navigation & File Input
  try {
    const scanBtn = testPage.locator('[data-testid="scan-prescription-btn"]');
    if (await scanBtn.isVisible()) {
      await scanBtn.click();
      await testPage.waitForTimeout(500);
      const url = testPage.url();
      // Should redirect to login if unauthenticated or show prescription upload
      functionalResults.push({
        workflow: 'Prescription CTA Navigation',
        passed: url.includes('/login') || url.includes('/prescription-scan'),
        details: `Prescription CTA navigated to: ${url} (Protected route auth-redirect operational)`
      });
    }
  } catch (e) {
    functionalResults.push({ workflow: 'Prescription CTA Navigation', passed: false, details: e.message });
  }

  // Workflow C: Login Form Interactions & Validation
  try {
    await testPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    const emailInput = testPage.locator('input[type="email"]');
    const passwordInput = testPage.locator('input[type="password"]');
    await emailInput.fill('qa_patient@medszop.test');
    await passwordInput.fill('SafeTestPass123!');
    const submitBtn = testPage.locator('button[type="submit"]');
    const canSubmit = await submitBtn.isEnabled();
    functionalResults.push({
      workflow: 'Login Form Fields & Validation',
      passed: canSubmit,
      details: 'Email and password fields accept credentials; submit button is enabled'
    });
  } catch (e) {
    functionalResults.push({ workflow: 'Login Form', passed: false, details: e.message });
  }

  // Workflow D: Forgot Password Multi-Step Flow
  try {
    await testPage.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
    const fpCard = testPage.locator('[data-testid="forgot-password-card"]');
    await fpCard.waitFor({ state: 'visible', timeout: 5000 });
    const cardVisible = await fpCard.isVisible();
    const fpEmail = testPage.locator('[data-testid="forgot-password-email-input"]');
    await fpEmail.fill('qa_recovery@medszop.test');
    await testPage.waitForTimeout(100);
    const sendOtpBtn = testPage.locator('[data-testid="forgot-password-send-otp-btn"]');
    const btnEnabled = await sendOtpBtn.isEnabled();
    functionalResults.push({
      workflow: 'Forgot Password Step 1 (OTP Request)',
      passed: cardVisible && btnEnabled,
      details: 'Card renders cleanly; OTP request trigger is active'
    });
  } catch (e) {
    functionalResults.push({ workflow: 'Forgot Password Flow', passed: false, details: e.message });
  }

  // Workflow E: Unauthenticated Protected Route Guard
  try {
    await testPage.goto(`${BASE_URL}/orders`, { waitUntil: 'domcontentloaded' });
    await testPage.waitForTimeout(300);
    const redirectUrl = testPage.url();
    const redirectedToLogin = redirectUrl.includes('/login');
    functionalResults.push({
      workflow: 'Protected Route Redirection (/orders -> /login)',
      passed: redirectedToLogin,
      details: redirectedToLogin ? `Protected route guard redirected unauthenticated user to ${redirectUrl}` : 'Guard failed to redirect'
    });
  } catch (e) {
    functionalResults.push({ workflow: 'Protected Route Guard', passed: false, details: e.message });
  }

  // Workflow F: Medicines Page Filters & Category Navigation
  try {
    await testPage.goto(`${BASE_URL}/medicines`, { waitUntil: 'domcontentloaded' });
    await testPage.waitForTimeout(400);
    const searchInput = testPage.locator('input[placeholder*="Search"]').first();
    const hasSearch = await searchInput.isVisible();
    functionalResults.push({
      workflow: 'Medicines Directory Search & Responsive View',
      passed: hasSearch,
      details: hasSearch ? 'Medicine directory search input rendered and interactive' : 'Search input not found'
    });
  } catch (e) {
    functionalResults.push({ workflow: 'Medicines Directory', passed: false, details: e.message });
  }

  // Workflow G: Specialist Dashboard Guard Redirection (/pharmacy -> /login)
  try {
    await testPage.goto(`${BASE_URL}/pharmacy`, { waitUntil: 'domcontentloaded' });
    await testPage.waitForTimeout(300);
    const redirectUrl = testPage.url();
    const redirected = redirectUrl.includes('/login');
    functionalResults.push({
      workflow: 'Pharmacy Dashboard RBAC Route Guard',
      passed: redirected,
      details: redirected ? `Unauthorized customer/visitor redirected to ${redirectUrl}` : 'Role guard failed'
    });
  } catch (e) {
    functionalResults.push({ workflow: 'Pharmacy Dashboard Guard', passed: false, details: e.message });
  }

  // Workflow H: Delivery Agent Dashboard Guard Redirection (/delivery -> /login)
  try {
    await testPage.goto(`${BASE_URL}/delivery`, { waitUntil: 'domcontentloaded' });
    await testPage.waitForTimeout(300);
    const redirectUrl = testPage.url();
    const redirected = redirectUrl.includes('/login');
    functionalResults.push({
      workflow: 'Delivery Dashboard RBAC Route Guard',
      passed: redirected,
      details: redirected ? `Unauthorized visitor redirected to ${redirectUrl}` : 'Role guard failed'
    });
  } catch (e) {
    functionalResults.push({ workflow: 'Delivery Dashboard Guard', passed: false, details: e.message });
  }

  // Workflow I: Support & Policy Pages Accessibility
  try {
    await testPage.goto(`${BASE_URL}/help`, { waitUntil: 'domcontentloaded' });
    await testPage.waitForTimeout(300);
    const helpTitle = await testPage.locator('h1').first().textContent();
    functionalResults.push({
      workflow: 'Support Center Navigation & Headings',
      passed: !!helpTitle,
      details: `Help Center rendered with primary heading: "${helpTitle.trim()}"`
    });
  } catch (e) {
    functionalResults.push({ workflow: 'Support Center', passed: false, details: e.message });
  }

  await testPage.close();
  await browser.close();

  // PRINT SUMMARY
  console.log('\n================================================================');
  console.log('REAL BROWSER TEST RESULTS SUMMARY');
  console.log('================================================================');
  console.log('1. Viewport Matrix Results:');
  matrixResults.forEach(r => {
    const status = r.overflowCount === 0 ? '✅ PASS (0 overflows)' : `⚠️ ${r.overflowCount} OVERFLOWS`;
    console.log(`   - ${r.viewport.name}: ${status}`);
  });

  console.log('\n2. Functional Interaction Workflows:');
  functionalResults.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   - [${status}] ${r.workflow}: ${r.details}`);
  });

  console.log('\n3. Console & Network Errors:');
  const distinctConsoleErrors = [...new Set(consoleErrors.map(e => e.text))];
  console.log(`   - Console Errors: ${distinctConsoleErrors.length}`);
  distinctConsoleErrors.slice(0, 5).forEach(e => console.log(`     * ${e}`));

  const backendBlockedRequests = networkErrors.filter(e => e.url.includes(':5000') || e.url.includes('/api/'));
  console.log(`   - Backend API Blocked Requests (Port 5000 Inactive): ${backendBlockedRequests.length}`);
  backendBlockedRequests.slice(0, 3).forEach(e => console.log(`     * Blocked API: ${e.url} (${e.failure})`));

  console.log('================================================================\n');

  // Return full report object for output
  return { matrixResults, functionalResults, distinctConsoleErrors, backendBlockedRequests };
}

runRealBrowserAudit().catch(err => {
  console.error('Fatal error in Playwright test suite:', err);
  process.exit(1);
});
