import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || path.resolve(__dirname, 'screenshots', 'prescription_intelligence_v2');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Generate a dummy prescription image buffer
const DUMMY_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const MOCK_SCAN_RESPONSE = {
  success: true,
  parsed: {
    doctor: {
      doctorName: "Dr. Rajesh Sharma, MD",
      qualification: "MBBS, MD (Medicine), Reg. #48291"
    },
    patient: {
      patientName: "Aarav Patel",
      age: "45",
      gender: "Male"
    },
    prescriptionDate: "2026-11-14",
    hasUncertainFields: true,
    medicines: [
      // 1. GREEN: Recognized by AI — unverified disclaimer, complete strength
      {
        medicineName: "Augmentin 625 Duo",
        sourceText: "Augmentin 625 Duo BD x 5d",
        strength: "625mg",
        frequency: "Twice daily (BD)",
        duration: "5 days",
        instructions: "After meals",
        recognitionStatus: "RECOGNIZED_UNVERIFIED",
        visualState: "GREEN",
        requiresPharmacistReview: true
      },
      // 2. AMBER: Partial handwriting snippet, LASA alert, candidate interpretations
      {
        medicineName: null,
        recognizedFragment: "Met...ol",
        sourceText: "Met...ol 50mg OD",
        strength: "50mg",
        frequency: "Once daily (OD)",
        recognitionStatus: "UNCERTAIN",
        visualState: "AMBER",
        missingStrengthWarning: false,
        requiresPharmacistReview: true,
        lasaAlert: {
          warning: "Metoprolol (LASA / Sound-Alike with Metformin). Dispensing confirmation required.",
          isHighRisk: true
        },
        possibleMatches: [
          {
            medicineName: "Metoprolol Succinate 50mg",
            evidence: "Visible character boundaries 'met...' and '...ol' agree with 'Metoprolol Succinate'",
            verified: false,
            confidenceScore: 0.92
          },
          {
            medicineName: "Metformin Hydrochloride 500mg",
            evidence: "Initial visible cursive letters 'met' agree with 'Metformin'",
            verified: false,
            confidenceScore: 0.78
          },
          {
            medicineName: "Metronidazole 400mg",
            evidence: "Prefix letters 'met' align with 'Metronidazole'",
            verified: false,
            confidenceScore: 0.68
          }
        ]
      },
      // 3. RED: Illegible scribble — Zero Hallucination enforced
      {
        medicineName: null,
        recognizedFragment: null,
        sourceText: "~~~~ unreadable cursive ~~~~",
        recognitionStatus: "ILLEGIBLE",
        visualState: "RED",
        requiresPharmacistReview: true,
        possibleMatches: []
      }
    ],
    rawExtractedText: "Rx:\n1. Augmentin 625 Duo BD x 5d (Post meals)\n2. Met...ol 50mg OD\n3. ~~~~ unreadable cursive ~~~~"
  }
};

async function isServerRunning(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function ensurePreviewServer() {
  if (await isServerRunning(BASE_URL)) {
    console.log(`✓ Preview server already active at ${BASE_URL}`);
    return null;
  }
  console.log(`ℹ Starting Vite preview server at ${BASE_URL}...`);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'ignore'
  });

  const start = Date.now();
  while (Date.now() - start < 20000) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isServerRunning(BASE_URL)) {
      console.log(`✓ Preview server is ready at ${BASE_URL}`);
      return server;
    }
  }
  throw new Error('Preview server did not start in time');
}

async function run() {
  let serverProc = null;
  let browser = null;

  try {
    serverProc = await ensurePreviewServer();

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const viewports = [
      { name: 'desktop_1440x900', width: 1440, height: 900 },
      { name: 'mobile_375x812', width: 375, height: 812 }
    ];

    const themes = ['light', 'dark'];

    // Create a dummy image file on disk for file input upload
    const dummyImgPath = path.resolve(__dirname, 'dummy_rx.png');
    const base64Data = DUMMY_PNG_BASE64.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(dummyImgPath, Buffer.from(base64Data, 'base64'));

    for (const theme of themes) {
      for (const vp of viewports) {
        console.log(`\nCapturing [${theme.toUpperCase()}] at [${vp.name}]...`);

        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 2
        });

        // Set mock authentication token
        await context.addInitScript(() => {
          localStorage.setItem('token', 'mock-valid-jwt-token');
          localStorage.setItem('medszop_theme', 'light');
        });

        const page = await context.newPage();

        // Intercept Auth Check
        await page.route('**/api/auth/me', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              _id: 'cust-001',
              name: 'Aarav Patel',
              email: 'aarav@medszop.com',
              role: 'customer'
            })
          });
        });

        // Intercept Scan API
        await page.route('**/api/prescriptions/scan', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_SCAN_RESPONSE)
          });
        });

        // Navigate to Prescription Scan Page
        await page.goto(`${BASE_URL}/prescription-scan`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);

        // Apply theme class to <html>
        await page.evaluate((th) => {
          if (th === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }, theme);

        // Upload dummy file
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(dummyImgPath);
          await page.waitForTimeout(500);

          // Click "Extract Medicines"
          const scanBtn = page.locator('[data-testid="scan-prescription-submit-btn"]').first();
          if (await scanBtn.isVisible()) {
            await scanBtn.click();
            // Wait for clinical extraction results to render
            await page.waitForSelector('text=/Augmentin 625/i', { timeout: 10000 });
            await page.waitForTimeout(500);
          }
        }

        // Strict UI assertions: All expected elements must be present or test fails
        // 1. GREEN state
        const greenItem = page.locator('text=/Augmentin 625 Duo/i').first();
        const greenTitle = await greenItem.isVisible();
        if (!greenTitle) {
          throw new Error(`[Assertion Failure] Green state item "Augmentin 625 Duo" not visible for ${vp.name} (${theme})`);
        }
        console.log(`  ✓ Green State Medication Visible: ${greenTitle}`);

        // 2. AMBER state: Observed Handwriting & Candidates
        const amberItem = page.locator('text=/Observed Handwriting/i').first();
        const amberCandidate = page.locator('text=/Metoprolol Succinate 50mg/i').first();
        const amberVisible = (await amberItem.isVisible()) && (await amberCandidate.isVisible());
        if (!amberVisible) {
          throw new Error(`[Assertion Failure] Amber state fragment/candidates not visible for ${vp.name} (${theme})`);
        }
        console.log(`  ✓ Amber State Fragment & Candidates Visible: ${amberVisible}`);

        // 3. RED state: Illegible Line
        const redItem = page.locator('text=/Cannot safely decipher medication/i').first();
        const redLineInDom = (await redItem.count()) > 0;
        await redItem.scrollIntoViewIfNeeded();
        const redLineVisible = await redItem.isVisible();
        if (!redLineVisible || !redLineInDom) {
          throw new Error(`[Assertion Failure] Red state uncertainty callout not visible for ${vp.name} (${theme})`);
        }
        console.log(`  ✓ Red State Uncertainty Safeguard Visible: ${redLineVisible}`);

        // Capture full page screenshot
        const screenshotPath = path.join(SCREENSHOT_DIR, `rx_smart_suggestions_${vp.name}_${theme}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  📷 Screenshot saved: ${screenshotPath}`);

        await context.close();
      }
    }

    if (fs.existsSync(dummyImgPath)) {
      fs.unlinkSync(dummyImgPath);
    }

    console.log('\n🎉 All Prescription Intelligence V2 screenshots successfully captured!');
  } catch (err) {
    console.error('Execution error:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (serverProc) {
      serverProc.kill();
    }
  }
}

run();
