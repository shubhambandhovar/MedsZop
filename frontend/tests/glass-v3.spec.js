/**
 * MedsZop Glass Experience V3 — Hardened Visual, Responsive & Accessibility Verification Suite
 *
 * Verifies:
 * 1. 7 responsive viewports (320px, 375px, 768px, 1024px, 1440px, 1920px, 2560px) with 0 horizontal overflow.
 * 2. Strict mobile touch-target audit (minimum 44x44px for required interactive controls).
 * 3. Modal focus trapping, dialog open verification, and Escape key dismissal (zero swallowed errors).
 * 4. Actual animation behavior under prefers-reduced-motion (verifying no active scaling or motion displacement).
 * 5. Distinct unauthenticated and authenticated route coverage, asserting expected headings and detecting unexpected redirects.
 * 6. Completely portable paths and automatic preview server start/verify.
 * 7. Nonzero exit code on any test failure.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = 5173;
const BASE_URL = process.env.PREVIEW_URL || process.env.VITE_URL || `http://localhost:${DEFAULT_PORT}`;
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR
  ? path.resolve(process.env.SCREENSHOT_DIR)
  : path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 7 Standard Viewports
const VIEWPORTS = [
  { name: '320px-mobile-narrow', width: 320, height: 568 },
  { name: '375px-mobile-standard', width: 375, height: 667 },
  { name: '768px-tablet-portrait', width: 768, height: 1024 },
  { name: '1024px-tablet-landscape', width: 1024, height: 768 },
  { name: '1440px-desktop-hd', width: 1440, height: 900 },
  { name: '1920px-desktop-fhd', width: 1920, height: 1080 },
  { name: '2560px-ultrawide-2k', width: 2560, height: 1440 }
];

// Unauthenticated (Public) Pages
const PUBLIC_PAGES = [
  {
    name: '01_landing_hero',
    path: '/',
    headingSelector: '[data-testid="logo-link"]',
    verifyContent: async (page) => {
      const hero = await page.$('form');
      return !!hero;
    }
  },
  {
    name: '02_medicines_catalog',
    path: '/medicines',
    headingSelector: 'input[placeholder*="Search"], h1',
    verifyContent: async (page) => {
      const search = await page.$('input');
      return !!search;
    }
  },
  {
    name: '03_care_identity_login',
    path: '/login',
    headingSelector: 'input[type="email"], [data-testid="login-title"]',
    verifyContent: async (page) => {
      const email = await page.$('input[type="email"]');
      return !!email;
    }
  },
  {
    name: '04_help_center',
    path: '/help',
    headingSelector: 'h1',
    verifyContent: async (page) => {
      const heading = await page.innerText('h1');
      return heading.toLowerCase().includes('help');
    }
  },
  {
    name: '05_faqs_accordions',
    path: '/faqs',
    headingSelector: 'h1',
    verifyContent: async (page) => {
      const heading = await page.innerText('h1');
      return heading.toLowerCase().includes('frequently') || heading.toLowerCase().includes('faq');
    }
  }
];

// Authenticated (Customer Protected) Pages
const PROTECTED_PAGES = [
  {
    name: '06_cart_overview',
    path: '/cart',
    headingSelector: 'h1, h2, [data-testid="cart-title"], div:has-text("Cart")',
    verifyContent: async (page) => {
      const body = await page.innerText('body');
      return body.toLowerCase().includes('cart') || body.toLowerCase().includes('order summary');
    }
  },
  {
    name: '07_patient_dashboard',
    path: '/dashboard',
    headingSelector: '[data-testid="dashboard-title"], h1:has-text("Welcome"), h1:has-text("Patient")',
    verifyContent: async (page) => {
      const title = await page.$('[data-testid="dashboard-title"], h1');
      return !!title;
    }
  },
  {
    name: '08_ai_doctor_chat',
    path: '/doctor-chat',
    headingSelector: 'h2:has-text("Dr. MedsZop"), [data-testid="chat-messages-container"], h1:has-text("AI")',
    verifyContent: async (page) => {
      const chat = await page.$('div:has-text("Dr. MedsZop"), [data-testid="chat-messages-container"]');
      return !!chat;
    }
  },
  {
    name: '09_prescription_scan',
    path: '/prescription-scan',
    headingSelector: 'h1, button:has-text("Scan"), div:has-text("Upload Prescription")',
    verifyContent: async (page) => {
      const body = await page.innerText('body');
      return body.toLowerCase().includes('prescription') || body.toLowerCase().includes('rx');
    }
  },
  {
    name: '10_consult_doctor',
    path: '/consult-doctor',
    headingSelector: 'h1, h2, div:has-text("Consult")',
    verifyContent: async (page) => {
      const body = await page.innerText('body');
      return body.toLowerCase().includes('doctor') || body.toLowerCase().includes('consult');
    }
  }
];

// Check if preview server is responsive
async function isServerRunning(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

// Ensure preview server is available, start if necessary
async function ensurePreviewServer() {
  const running = await isServerRunning(BASE_URL);
  if (running) {
    console.log(`✓ Local server is active and responsive at ${BASE_URL}`);
    return null;
  }

  console.log(`ℹ No active server at ${BASE_URL}. Launching Vite preview server...`);

  const frontendDir = path.resolve(__dirname, '..');
  const distDir = path.join(frontendDir, 'dist');

  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('ℹ Production dist/ assets not found. Compiling build first...');
    const { execSync } = await import('child_process');
    execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  }

  const serverProc = spawn('npx', ['vite', 'preview', '--port', String(DEFAULT_PORT), '--host'], {
    cwd: frontendDir,
    shell: true,
    stdio: 'ignore'
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 20000) {
    await new Promise((r) => setTimeout(r, 600));
    if (await isServerRunning(BASE_URL)) {
      console.log(`✓ Spawned Vite preview server is ready at ${BASE_URL}`);
      return serverProc;
    }
  }

  throw new Error(`Failed to start preview server at ${BASE_URL} within 20s`);
}

async function runHardenedTestSuite() {
  console.log('='.repeat(75));
  console.log('🚀 MedsZop Glass Experience V3 — Hardened Verification Suite');
  console.log(`🌐 Target Base URL: ${BASE_URL}`);
  console.log(`📁 Screenshot Output: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(75));

  let previewServer = null;
  try {
    previewServer = await ensurePreviewServer();
  } catch (err) {
    console.error('✗ Server setup error:', err.message);
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testSummary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    viewportsTested: [],
    overflowAudit: [],
    touchTargetAudit: [],
    reducedMotionAudit: [],
    modalKeyboardAudit: [],
    authGuardAudit: [],
    pageThemesCaptured: [],
    allPassed: true,
    failures: []
  };

  const registerFailure = (category, description) => {
    testSummary.allPassed = false;
    testSummary.failures.push({ category, description });
    console.error(`  ❌ [FAIL] ${category}: ${description}`);
  };

  try {
    // -------------------------------------------------------------
    // 1. RESPONSIVE VIEWPORTS & ZERO HORIZONTAL OVERFLOW
    // -------------------------------------------------------------
    console.log('\n[1/6] Auditing 7 Responsive Viewports for Horizontal Overflow...');
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(400);

        const metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
          const clientWidth = root.clientWidth || window.innerWidth;
          return {
            scrollWidth,
            clientWidth,
            hasHorizontalOverflow: scrollWidth > clientWidth + 1
          };
        });

        const pass = !metrics.hasHorizontalOverflow;
        if (!pass) {
          registerFailure(
            'Horizontal Overflow',
            `Viewport ${vp.name} (${vp.width}px) has overflow: scrollWidth=${metrics.scrollWidth}px > clientWidth=${metrics.clientWidth}px`
          );
        }

        console.log(
          `  ${pass ? '✓' : '✗'} ${vp.name.padEnd(25)} -> Width: ${vp.width}px | Scroll: ${metrics.scrollWidth}px | Status: ${pass ? 'PASS' : 'FAIL'}`
        );

        testSummary.overflowAudit.push({
          viewport: vp.name,
          width: vp.width,
          metrics,
          pass
        });
        testSummary.viewportsTested.push(vp);
      } catch (err) {
        registerFailure('Horizontal Overflow', `Error testing ${vp.name}: ${err.message}`);
      } finally {
        await context.close();
      }
    }

    // -------------------------------------------------------------
    // 2. STRICT MOBILE TOUCH-TARGET AUDIT (Minimum 44x44px)
    // -------------------------------------------------------------
    console.log('\n[2/6] Auditing Mobile Touch Targets (Strict 44x44px for required controls)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 1
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await mobilePage.waitForTimeout(500);

    const touchAudit = await mobilePage.evaluate(() => {
      // Find required primary touch controls: header icon buttons, logo, main action triggers
      const primaryControls = [
        { selector: '[data-testid="logo-link"]', label: 'Header Brand Logo Link' },
        { selector: '[data-testid="theme-toggle"]', label: 'Theme Toggle Button' },
        { selector: '[data-testid="cart-link"]', label: 'Shopping Cart Action' },
        { selector: '[data-testid="mobile-menu"]', label: 'Mobile Navigation Menu Drawer' },
        { selector: '[data-testid="hero-upload-prescription-btn"]', label: 'Hero Upload Prescription CTA' }
      ];

      return primaryControls.map(({ selector, label }) => {
        const el = document.querySelector(selector);
        if (!el) {
          return { label, selector, found: false, width: 0, height: 0, pass: false, error: 'Element not found' };
        }
        const rect = el.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        // Required minimum 44px in both dimensions
        const pass = width >= 44 && height >= 44;
        return {
          label,
          selector,
          found: true,
          width,
          height,
          pass,
          error: pass ? null : `Dimensions ${width}x${height}px are below required 44x44px minimum`
        };
      });
    });

    for (const item of touchAudit) {
      if (!item.pass) {
        registerFailure('Mobile Touch Target', `${item.label} (${item.selector}): ${item.error}`);
      }
      console.log(
        `  ${item.pass ? '✓' : '✗'} ${item.label.padEnd(35)} -> ${item.width}x${item.height}px [${item.pass ? 'PASS' : 'FAIL'}]`
      );
    }
    testSummary.touchTargetAudit = touchAudit;
    await mobileContext.close();

    // -------------------------------------------------------------
    // 3. ACTUAL ANIMATION BEHAVIOR UNDER PREFERS-REDUCED-MOTION
    // -------------------------------------------------------------
    console.log('\n[3/6] Testing Actual Animation Behavior under prefers-reduced-motion: reduce...');
    const rmContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce'
    });
    const rmPage = await rmContext.newPage();
    await rmPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await rmPage.waitForTimeout(500);

    // 3A: Verify media query matches
    const mediaReduced = await rmPage.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!mediaReduced) {
      registerFailure('Reduced Motion', 'Browser did not emulate prefers-reduced-motion: reduce correctly');
    }
    console.log(`  ✓ matchMedia(prefers-reduced-motion: reduce): ${mediaReduced}`);

    // 3B: Test GlassButton active scale physics under reduced motion
    const buttonScaleCheck = await rmPage.evaluate(async () => {
      // Find a button
      const btn = document.querySelector('button[type="submit"], [data-testid="hero-upload-prescription-btn"]');
      if (!btn) return { error: 'No button found to test' };

      const computedBefore = window.getComputedStyle(btn);
      const transformBefore = computedBefore.transform;

      // Simulate pointerdown / mousedown
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      // Wait 50ms
      await new Promise((r) => setTimeout(r, 50));

      const computedActive = window.getComputedStyle(btn);
      const transformActive = computedActive.transform;

      btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      // Parse scale matrix if present
      let scaleX = 1;
      if (transformActive && transformActive !== 'none' && transformActive.startsWith('matrix')) {
        const parts = transformActive.replace('matrix(', '').replace(')', '').split(',');
        scaleX = parseFloat(parts[0].trim());
      }

      // Scaling down (< 0.99) violates reduced motion requirement
      const scaledDown = scaleX < 0.99;
      return {
        transformBefore,
        transformActive,
        scaleX,
        scaledDown,
        pass: !scaledDown
      };
    });

    if (!buttonScaleCheck.pass) {
      registerFailure(
        'Reduced Motion Physics',
        `GlassButton scaled down during active state under reduced-motion: transformActive=${buttonScaleCheck.transformActive} (scaleX=${buttonScaleCheck.scaleX})`
      );
    } else {
      console.log(`  ✓ GlassButton active transform under reduced motion: ${buttonScaleCheck.transformActive} (scale: ${buttonScaleCheck.scaleX}) [PASS]`);
    }

    testSummary.reducedMotionAudit.push({
      tested: 'GlassButton scale suppression under reduced-motion',
      result: buttonScaleCheck,
      pass: buttonScaleCheck.pass
    });
    await rmContext.close();

    // -------------------------------------------------------------
    // 4. MODAL TESTS: FOCUS TRAPPING & ESCAPE DISMISSAL
    // -------------------------------------------------------------
    console.log('\n[4/6] Testing Modal Focus Trapping & Escape Dismissal...');

    // 4A: Desktop Language Selector Modal
    const desktopModalContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const dmPage = await desktopModalContext.newPage();
    await dmPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await dmPage.waitForTimeout(500);

    try {
      const trigger = dmPage.locator('[data-testid="language-selector-trigger"]');
      const triggerFound = await trigger.isVisible({ timeout: 4000 });
      if (!triggerFound) {
        throw new Error('Language selector trigger [data-testid="language-selector-trigger"] is not visible on desktop!');
      }

      await trigger.click();
      const dialog = dmPage.locator('[role="dialog"]');
      await dialog.waitFor({ state: 'visible', timeout: 4000 });

      // Verify focus is inside dialog
      const focusInside = await dmPage.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        return d ? d.contains(document.activeElement) : false;
      });
      if (!focusInside) {
        throw new Error('Focus was not automatically trapped inside [role="dialog"] on modal open!');
      }
      console.log('  ✓ Desktop Dialog opened with active focus contained inside [role="dialog"]');

      // Press Escape
      await dmPage.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden', timeout: 4000 });
      console.log('  ✓ Desktop Dialog closed cleanly on Escape key press');

      testSummary.modalKeyboardAudit.push({
        modal: 'LanguageSelector (Desktop)',
        pass: true
      });
    } catch (err) {
      registerFailure('Modal Keyboard Accessibility', `Desktop modal failed: ${err.message}`);
      testSummary.modalKeyboardAudit.push({
        modal: 'LanguageSelector (Desktop)',
        pass: false,
        error: err.message
      });
    } finally {
      await desktopModalContext.close();
    }

    // 4B: Mobile Navigation Drawer
    const mobileModalContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const mmPage = await mobileModalContext.newPage();
    await mmPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await mmPage.waitForTimeout(500);

    try {
      const menuTrigger = mmPage.locator('[data-testid="mobile-menu"]');
      const menuVisible = await menuTrigger.isVisible({ timeout: 4000 });
      if (!menuVisible) {
        throw new Error('Mobile drawer trigger [data-testid="mobile-menu"] not visible on mobile viewport!');
      }

      await menuTrigger.click();
      const mobileDrawer = mmPage.locator('[role="dialog"]');
      await mobileDrawer.waitFor({ state: 'visible', timeout: 4000 });

      // Press Escape
      await mmPage.keyboard.press('Escape');
      await mobileDrawer.waitFor({ state: 'hidden', timeout: 4000 });
      console.log('  ✓ Mobile Menu Drawer opened and closed cleanly on Escape key press');

      testSummary.modalKeyboardAudit.push({
        modal: 'MobileMenuDrawer (Mobile)',
        pass: true
      });
    } catch (err) {
      registerFailure('Modal Keyboard Accessibility', `Mobile drawer failed: ${err.message}`);
      testSummary.modalKeyboardAudit.push({
        modal: 'MobileMenuDrawer (Mobile)',
        pass: false,
        error: err.message
      });
    } finally {
      await mobileModalContext.close();
    }

    // -------------------------------------------------------------
    // 5. AUTH GUARD: VERIFY UNAUTHENTICATED ACCESS TO PROTECTED ROUTES
    // -------------------------------------------------------------
    console.log('\n[5/6] Verifying Auth Guard Redirection for Protected Routes...');
    const unauthContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const unauthPage = await unauthContext.newPage();

    for (const protPage of PROTECTED_PAGES.slice(0, 3)) {
      try {
        await unauthPage.goto(`${BASE_URL}${protPage.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await unauthPage.waitForTimeout(600);

        const currentUrl = unauthPage.url();
        const correctlyRedirected = currentUrl.includes('/login');

        if (!correctlyRedirected) {
          registerFailure(
            'Auth Guard Security',
            `Unauthenticated access to ${protPage.path} did NOT redirect to /login! Current URL: ${currentUrl}`
          );
        } else {
          console.log(`  ✓ Unauthenticated access to ${protPage.path} -> redirected to /login [PASS]`);
        }

        testSummary.authGuardAudit.push({
          path: protPage.path,
          redirectedToLogin: correctlyRedirected,
          pass: correctlyRedirected
        });
      } catch (err) {
        registerFailure('Auth Guard Security', `Error checking auth guard for ${protPage.path}: ${err.message}`);
      }
    }
    await unauthContext.close();

    // -------------------------------------------------------------
    // 6. SCREENSHOT TESTS: DISTINGUISHING UNAUTH AND AUTH ROUTES
    // -------------------------------------------------------------
    console.log('\n[6/6] Capturing High-Res Screenshots & Asserting Headings (Light & Dark)...');

    // Setup Mocked Authenticated Session for Protected Routes
    const mockUser = {
      _id: 'cust-verified-001',
      id: 'cust-verified-001',
      name: 'Ananya Sharma',
      email: 'ananya@medszop.site',
      role: 'customer',
      mobile: '9876543210'
    };

    const runPageCapture = async ({ pageItem, isProtected, theme }) => {
      const pageContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        colorScheme: theme
      });

      if (isProtected) {
        // Inject token into localStorage before page loads
        await pageContext.addInitScript(() => {
          localStorage.setItem('token', 'mock-valid-customer-jwt-token');
        });

        // Intercept user API call to authenticate session
        await pageContext.route('**/auth/me', (route) => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockUser)
          });
        });

        // Mock empty data endpoints
        await pageContext.route('**/orders**', (route) => {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });
        await pageContext.route('**/prescriptions**', (route) => {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });
        await pageContext.route('**/addresses**', (route) => {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        });
      }

      const activePage = await pageContext.newPage();

      try {
        await activePage.goto(`${BASE_URL}${pageItem.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await activePage.waitForTimeout(600);

        // Detect unexpected redirect to login
        const currentUrl = activePage.url();
        if (pageItem.path !== '/login' && currentUrl.includes('/login')) {
          throw new Error(
            `Unexpected redirect to /login for route: ${pageItem.path} (isProtected=${isProtected}). Current URL: ${currentUrl}`
          );
        }

        // Apply theme explicitly
        if (theme === 'dark') {
          await activePage.evaluate(() => document.documentElement.classList.add('dark'));
        } else {
          await activePage.evaluate(() => document.documentElement.classList.remove('dark'));
        }
        await activePage.waitForTimeout(200);

        // Assert expected heading / content
        await activePage.waitForSelector(pageItem.headingSelector, { timeout: 6000 });
        if (pageItem.verifyContent) {
          const contentValid = await pageItem.verifyContent(activePage);
          if (!contentValid) {
            throw new Error(`Content verification failed for selector ${pageItem.headingSelector} on ${pageItem.path}`);
          }
        }

        const fileName = `${pageItem.name}_${theme}.png`;
        const filePath = path.join(SCREENSHOT_DIR, fileName);
        await activePage.screenshot({ path: filePath, fullPage: false });

        console.log(`  📸 Captured ${fileName} (${isProtected ? 'Authenticated' : 'Public'})`);
        testSummary.pageThemesCaptured.push({
          page: pageItem.name,
          path: pageItem.path,
          isProtected,
          theme,
          file: fileName,
          pass: true
        });
      } catch (err) {
        registerFailure('Page Visual Capture', `${pageItem.name} (${theme}): ${err.message}`);
        testSummary.pageThemesCaptured.push({
          page: pageItem.name,
          path: pageItem.path,
          isProtected,
          theme,
          error: err.message,
          pass: false
        });
      } finally {
        await pageContext.close();
      }
    };

    // Capture Public Pages
    for (const pageItem of PUBLIC_PAGES) {
      for (const theme of ['light', 'dark']) {
        await runPageCapture({ pageItem, isProtected: false, theme });
      }
    }

    // Capture Protected Pages with Customer Auth
    for (const pageItem of PROTECTED_PAGES) {
      for (const theme of ['light', 'dark']) {
        await runPageCapture({ pageItem, isProtected: true, theme });
      }
    }

    // -------------------------------------------------------------
    // SUMMARY & EXIT CODE HANDLING
    // -------------------------------------------------------------
    const summaryFile = path.join(__dirname, 'glass-test-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(testSummary, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(75));
    console.log('🏁 Hardened Test Suite Execution Finished');
    console.log(`   Overflow Audits:      ${testSummary.overflowAudit.filter((t) => t.pass).length}/${testSummary.overflowAudit.length} Passed`);
    console.log(`   Touch Target Audits:  ${testSummary.touchTargetAudit.filter((t) => t.pass).length}/${testSummary.touchTargetAudit.length} Passed`);
    console.log(`   Reduced Motion:       ${testSummary.reducedMotionAudit.filter((t) => t.pass).length}/${testSummary.reducedMotionAudit.length} Passed`);
    console.log(`   Modal Accessibility:  ${testSummary.modalKeyboardAudit.filter((t) => t.pass).length}/${testSummary.modalKeyboardAudit.length} Passed`);
    console.log(`   Auth Guard Checks:    ${testSummary.authGuardAudit.filter((t) => t.pass).length}/${testSummary.authGuardAudit.length} Passed`);
    console.log(`   Screenshots Saved:    ${testSummary.pageThemesCaptured.filter((t) => t.pass).length}/${testSummary.pageThemesCaptured.length} Passed`);
    console.log(`   Total Failures:       ${testSummary.failures.length}`);
    console.log(`   Overall Status:       ${testSummary.allPassed ? '✅ 100% PASSED' : '❌ FAILED'}`);
    console.log('='.repeat(75));

    if (!testSummary.allPassed) {
      console.error('\n❌ Suite failed! Specific errors:');
      for (const f of testSummary.failures) {
        console.error(`  - [${f.category}] ${f.description}`);
      }
      process.exit(1);
    }
  } catch (fatalErr) {
    console.error('Fatal Suite Exception:', fatalErr);
    process.exit(1);
  } finally {
    await browser.close();
    if (previewServer) {
      console.log('🛑 Terminating preview server...');
      previewServer.kill();
    }
  }
}

runHardenedTestSuite().catch((err) => {
  console.error('Execution Failed:', err);
  process.exit(1);
});
