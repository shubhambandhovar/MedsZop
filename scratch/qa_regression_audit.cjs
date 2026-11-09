const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve('S:/B.TECH CSE/Project 2/MedsZop');
const frontendRoot = path.join(projectRoot, 'frontend');
const pagesDir = path.join(frontendRoot, 'src', 'pages');

const pages = [
  'LandingPage.jsx',
  'LoginPage.jsx',
  'ForgotPasswordPage.jsx',
  'RegisterPage.jsx',
  'MedicinesPage.jsx',
  'MedicineDetailPage.jsx',
  'CartPage.jsx',
  'CheckoutPage.jsx',
  'OrdersPage.jsx',
  'OrderTrackingPage.jsx',
  'PrescriptionScanPage.jsx',
  'AIDoctorPage.jsx',
  'ConsultDoctorPage.jsx',
  'VideoCallPage.jsx',
  'PharmacyDashboardPage.jsx',
  'DeliveryDashboardPage.jsx',
  'DoctorDashboardPage.jsx',
  'AdminDashboardPage.jsx',
  'DashboardPage.jsx',
  'SettingsPage.jsx',
  'ChangePasswordPage.jsx',
  'support/HelpCenterPage.jsx',
  'support/FaqsPage.jsx',
  'support/RefundPolicyPage.jsx',
  'support/PrivacyPolicyPage.jsx',
  'support/TermsPage.jsx',
  'onboarding/DoctorApplicationPage.jsx',
  'onboarding/PharmacistApplicationPage.jsx',
  'onboarding/DeliveryApplicationPage.jsx',
  'onboarding/ApplicationStatusPage.jsx'
];

console.log('=====================================================');
console.log('MEDSZOP PHASE 6: AUTOMATED REGRESSION & QA AUDIT SUITE');
console.log('=====================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = [];
let warnings = [];

// 1. FILE EXISTENCE & EXPORT CHECK
console.log('1. Page Existence & Component Export Checks:');
pages.forEach(relPath => {
  totalChecks++;
  const fullPath = path.join(pagesDir, relPath);
  if (!fs.existsSync(fullPath)) {
    failedChecks.push({ file: relPath, check: 'File exists', issue: 'File does not exist' });
    console.error(`  ❌ Missing file: ${relPath}`);
  } else {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasExport = content.includes('export default') || content.includes('export {');
    if (hasExport) {
      passedChecks++;
      console.log(`  ✅ ${relPath} (Found & default export present)`);
    } else {
      failedChecks.push({ file: relPath, check: 'Component export', issue: 'No export found' });
      console.error(`  ❌ ${relPath}: No default export found`);
    }
  }
});

// 2. ACCESSIBILITY INSPECTION (ALT, ARIA, LABELS)
console.log('\n2. Static Accessibility (a11y) Verification:');
pages.forEach(relPath => {
  const fullPath = path.join(pagesDir, relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');

  // Check <img> without alt
  const imgMatches = content.match(/<img[^>]*>/g) || [];
  imgMatches.forEach(img => {
    totalChecks++;
    if (!img.includes('alt=')) {
      warnings.push({ file: relPath, check: 'Img Alt Attribute', detail: `Missing alt attribute on <img> tag: ${img.slice(0, 50)}...` });
    } else {
      passedChecks++;
    }
  });

  // Check buttons without text or aria-label
  const btnMatches = content.match(/<(?:Button|button)[^>]*>(?:(?!<\/(?:Button|button)>).)*?<\/(?:Button|button)>/gs) || [];
  btnMatches.forEach(btn => {
    // If it only contains icons and no aria-label, flag warning
    if (btn.includes('size="icon"') && !btn.includes('aria-label') && !btn.includes('title')) {
      totalChecks++;
      warnings.push({ file: relPath, check: 'Icon-only button accessible label', detail: `Button with size="icon" missing aria-label: ${btn.slice(0, 70)}...` });
    }
  });
});
console.log(`  Processed ${pages.length} pages. Flagged ${warnings.length} accessibility warnings.`);
warnings.forEach(w => console.log(`   - [${w.file}] ${w.detail}`));

// 3. RESPONSIVE HAZARD CHECKS (HARDCODED STATIC PIXELS ON MAIN CONTAINERS)
console.log('\n3. Responsive Hazard & Viewport Overflow Inspection:');
let overflowHazards = 0;
pages.forEach(relPath => {
  const fullPath = path.join(pagesDir, relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');

  // Scan for dangerous fixed widths like w-[500px], min-w-[400px] without responsive prefix (excluding max-w-)
  const matches = content.match(/(?<!sm:|md:|lg:|xl:|2xl:|max-)(?:\bw-|min-w-)\[(?!min\()[3-9]\d{2,}px\]/g) || [];
  if (matches.length > 0) {
    overflowHazards += matches.length;
    console.warn(`  ⚠️ ${relPath}: Found potential mobile overflow hazard: ${matches.join(', ')}`);
  }
});
if (overflowHazards === 0) {
  console.log('  ✅ 0 hardcoded fixed-width (>300px) overflow hazards found across all pages!');
}

// 4. DATA-TESTID VERIFICATION ON CRITICAL USER JOURNEYS
console.log('\n4. Critical Selector (data-testid) Audit:');
const requiredTestIds = [
  { id: 'hero-search-submit', page: 'LandingPage.jsx' },
  { id: 'scan-prescription-btn', page: 'LandingPage.jsx' },
  { id: 'chat-ai-doctor-hero', page: 'LandingPage.jsx' },
  { id: 'scan-prescription-submit-btn', page: 'PrescriptionScanPage.jsx' },
  { id: 'orders-title', page: 'OrdersPage.jsx' },
  { id: 'order-tracking-title', page: 'OrderTrackingPage.jsx' },
  { id: 'forgot-password-card', page: 'ForgotPasswordPage.jsx' },
  { id: 'forgot-password-email-input', page: 'ForgotPasswordPage.jsx' },
  { id: 'forgot-password-send-otp-btn', page: 'ForgotPasswordPage.jsx' },
  { id: 'change-password-card', page: 'ChangePasswordPage.jsx' },
  { id: 'current-password-input', page: 'ChangePasswordPage.jsx' },
  { id: 'pharmacy-dashboard-title', page: 'PharmacyDashboardPage.jsx' },
  { id: 'delivery-dashboard-title', page: 'DeliveryDashboardPage.jsx' }
];

let testIdPassCount = 0;
requiredTestIds.forEach(item => {
  totalChecks++;
  const fullPath = path.join(pagesDir, item.page);
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(`data-testid="${item.id}"`)) {
    testIdPassCount++;
    passedChecks++;
    console.log(`  ✅ [${item.page}] data-testid="${item.id}" verified`);
  } else {
    failedChecks.push({ file: item.page, check: 'data-testid', issue: `Missing data-testid="${item.id}"` });
    console.error(`  ❌ [${item.page}] Missing data-testid="${item.id}"`);
  }
});

console.log('\n=====================================================');
console.log(`RESULTS SUMMARY:`);
console.log(`Total Checks Run: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${failedChecks.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log('=====================================================');

if (failedChecks.length > 0) {
  console.log('\nFAILURES DETAIL:');
  console.log(JSON.stringify(failedChecks, null, 2));
  process.exit(1);
} else {
  console.log('\n🎉 ALL STATIC TESTS PASSED CLEANLY.');
  process.exit(0);
}
