/**
 * MedsZop Prescription Intelligence V2 — Unit & Integration Test Suite
 */

const assert = require("assert");
const sharp = require("sharp");
const prescriptionPreprocessor = require("../services/prescriptionPreprocessor");
const { validateExtraction } = require("../services/extractionValidator");
const medicineMatcher = require("../services/medicineMatcher");
const { getOCRProvider } = require("../services/ocrProviderAdapter");
const prescriptionReviewService = require("../services/prescriptionReviewService");
const Prescription = require("../models/Prescription");
const Pharmacy = require("../models/Pharmacy");
const Order = require("../models/Order");

async function runTests() {
  console.log("\n============================================================");
  console.log(" Running MedsZop Prescription Intelligence V2 Test Suite");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // 1. Sharp Preprocessor & Quality Evaluation Tests
  // ----------------------------------------------------
  await asyncTest("Sharp Preprocessor: Ingests synthetic image and generates enhanced & preview buffers", async () => {
    // Generate simple sharp synthetic image
    const syntheticBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 245, g: 245, b: 245 }
      }
    })
      .png()
      .toBuffer();

    const result = await prescriptionPreprocessor.preprocess(syntheticBuffer);
    assert.strictEqual(result.isPdf, false);
    assert(Buffer.isBuffer(result.enhancedBuffer), "enhancedBuffer should be a Buffer");
    assert(Buffer.isBuffer(result.previewBuffer), "previewBuffer should be a Buffer");
    assert(result.quality !== null, "quality assessment should be populated");
    assert.strictEqual(typeof result.quality.edgeVariance, "number");
  });

  await asyncTest("Sharp Preprocessor: Accurately identifies PDF documents", async () => {
    const dummyPdfBuffer = Buffer.from("%PDF-1.4\n%Fake PDF content for test");
    const result = await prescriptionPreprocessor.preprocess(dummyPdfBuffer);
    assert.strictEqual(result.isPdf, true);
    assert.strictEqual(result.metadata.format, "pdf");
    assert(result.quality.warnings[0].includes("PDF document"), "should flag PDF processing");
  });

  await asyncTest("Sharp Preprocessor: Computes Laplacian edge energy", async () => {
    const sharpLineBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="400" height="400"><line x1="20" y1="20" x2="380" y2="380" stroke="black" stroke-width="8"/></svg>'
          ),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

    const variance = await prescriptionPreprocessor.calculateEdgeVariance(sharpLineBuffer);
    assert(variance > 0, "Laplacian edge variance on sharp line image should be > 0");
  });

  // ----------------------------------------------------
  // 2. Extraction Validation & Schema Enforcement Tests
  // ----------------------------------------------------
  test("Extraction Validator: Normalizes structured JSON and preserves sourceText", () => {
    const rawAiOutput = {
      doctor: { doctorName: "Dr. A. Verma", qualification: "MBBS" },
      patient: { patientName: "Rahul", age: "32" },
      medicines: [
        {
          medicineName: "Augmentin",
          sourceText: "Augmentin 625 BD",
          strength: "625mg",
          prescribedDose: "1 tab",
          frequency: "BD",
          duration: "5 days",
          instructions: "Post food",
          recognitionStatus: "RECOGNIZED_UNVERIFIED",
          fieldConfidence: 0.95
        }
      ],
      rawExtractedText: "Augmentin 625 BD Post food"
    };

    const validated = validateExtraction(rawAiOutput);
    assert.strictEqual(validated.medicines.length, 1);
    assert.strictEqual(validated.medicines[0].medicineName, "Augmentin");
    assert.strictEqual(validated.medicines[0].sourceText, "Augmentin 625 BD");
    assert.strictEqual(validated.medicines[0].recognitionStatus, "RECOGNIZED_UNVERIFIED");
  });

  test("Extraction Validator: Uncertainty safeguard rejects null/empty candidates gracefully", () => {
    const emptyAiOutput = {
      doctor: {},
      patient: {},
      medicines: []
    };

    const validated = validateExtraction(emptyAiOutput);
    assert.strictEqual(validated.medicines.length, 0);
  });

  test("Extraction Validator: Preserves UNCERTAIN and ILLEGIBLE recognition statuses", () => {
    const uncertainAiOutput = {
      medicines: [
        {
          medicineName: "Ce~f~~ime",
          sourceText: "Ce~f~~ime",
          strength: "200mg",
          recognitionStatus: "UNCERTAIN",
          fieldConfidence: 0.35,
          uncertaintyReasons: ["Partially smudged cursive ink"]
        }
      ]
    };

    const validated = validateExtraction(uncertainAiOutput);
    assert.strictEqual(validated.medicines[0].recognitionStatus, "UNCERTAIN");
    assert(validated.hasUncertainFields, "hasUncertainFields must be true");
  });

  // ----------------------------------------------------
  // 3. Indian Medicine Database & LASA Matching Tests
  // ----------------------------------------------------
  await asyncTest("Medicine Matcher: Identifies high-risk Metformin / Metoprolol LASA pair", async () => {
    const items = [
      { medicineName: "Metformin", strength: "500mg" },
      { medicineName: "Metoprolol", strength: "50mg" }
    ];

    const matched = await medicineMatcher.matchAll(items);
    assert.strictEqual(matched.length, 2);
    const hasLasaAlert = matched.some((m) => m.lasaAlert !== null);
    assert(hasLasaAlert, "Must raise high-risk LASA alert for Metformin/Metoprolol pair");
    assert(matched[0].lasaAlert.warning.includes("Sound-Alike") || matched[0].lasaAlert.warning.includes("LASA"));
  });

  await asyncTest("Medicine Matcher: Reconciles fuzzy typo with Jan Aushadhi / CDSCO catalog", async () => {
    const items = [
      { medicineName: "Paracetmol", strength: "650mg" } // Typo: missing 'a'
    ];

    const matched = await medicineMatcher.matchAll(items);
    assert.strictEqual(matched[0].canonicalName, "Paracetamol");
    assert(matched[0].similarityScore > 0.85, "Similarity score should exceed 0.85");
  });

  await asyncTest("Medicine Matcher: Expands clinical abbreviations (PCM -> Paracetamol)", async () => {
    const items = [
      { medicineName: "PCM", strength: "650mg" }
    ];

    const matched = await medicineMatcher.matchAll(items);
    assert.strictEqual(matched[0].canonicalName, "Paracetamol");
  });

  await asyncTest("Medicine Matcher: Partial handwriting 'Met...ol' yields visualState AMBER, null medicineName, and candidate suggestions", async () => {
    const item = {
      recognizedFragment: "Met...ol",
      sourceText: "Met...ol 50mg OD",
      strength: "50mg",
      frequency: "OD"
    };

    const matched = await medicineMatcher.match(item);
    // Clinical Uncertainty Safeguard: Unverified guess is NOT assigned to medicineName
    assert.strictEqual(matched.medicineName, null, "medicineName must remain null until verified");
    assert.strictEqual(matched.visualState, "AMBER", "visualState must be AMBER for partial handwriting");
    assert.strictEqual(matched.recognitionStatus, "UNCERTAIN");
    assert(matched.possibleMatches.length > 0, "Must generate candidate interpretations");
    assert(matched.possibleMatches.length <= 3, "Must not exceed 3 candidates");
    const hasMetoprolol = matched.possibleMatches.some((cand) =>
      cand.medicineName.toLowerCase().includes("metoprolol")
    );
    assert(hasMetoprolol, "Suggestions must include Metoprolol based on 'Met...ol' fragment");
    assert(matched.possibleMatches[0].evidence.length > 0, "Candidate must provide visible evidence");
    assert.strictEqual(matched.possibleMatches[0].verified, false, "Candidate must be marked unverified");
  });

  await asyncTest("Medicine Matcher: Illegible scribble yields visualState RED, null medicineName, and zero suggestions", async () => {
    const item = {
      recognizedFragment: "???",
      sourceText: "???",
      medicineName: "",
      recognitionStatus: "ILLEGIBLE"
    };

    const matched = await medicineMatcher.match(item);
    assert.strictEqual(matched.medicineName, null);
    assert.strictEqual(matched.visualState, "RED", "Illegible scribble must have visualState RED");
    assert.strictEqual(matched.recognitionStatus, "ILLEGIBLE");
    assert.strictEqual(matched.possibleMatches.length, 0, "Uncertainty Safeguard: Must not fabricate candidates on scribble");
  });

  await asyncTest("Medicine Matcher: Missing strength triggers missingStrengthWarning and AMBER visualState", async () => {
    const item = {
      medicineName: "Paracetamol",
      sourceText: "Paracetamol 1 tab",
      strength: null,
      frequency: "TDS"
    };

    const matched = await medicineMatcher.match(item);
    assert.strictEqual(matched.missingStrengthWarning, true, "Missing strength must be flagged");
    assert.strictEqual(matched.visualState, "AMBER", "Missing strength must require pharmacist confirmation (AMBER)");
    assert(
      matched.uncertaintyReasons.some((r) => r.toLowerCase().includes("strength")),
      "Must include strength note in uncertaintyReasons"
    );
  });

  test("Extraction Validator: Enforces 3-state clinical visual triage (GREEN, AMBER, RED)", () => {
    const mixedPayload = {
      doctor: { doctorName: "Dr. K. Mehta" },
      patient: { patientName: "Aarav Sharma" },
      medicines: [
        // GREEN: Fully recognized with complete strength and dosage
        {
          medicineName: "Augmentin",
          sourceText: "Augmentin 625mg BD",
          strength: "625mg",
          prescribedDose: "1 tab",
          frequency: "BD",
          recognitionStatus: "RECOGNIZED_UNVERIFIED"
        },
        // AMBER: Partial handwriting with wildcard
        {
          medicineName: null,
          recognizedFragment: "Met...ol",
          sourceText: "Met...ol 50mg",
          strength: "50mg",
          recognitionStatus: "UNCERTAIN"
        },
        // RED: Illegible scribble
        {
          medicineName: "",
          recognizedFragment: null,
          sourceText: "~~~~",
          recognitionStatus: "ILLEGIBLE"
        }
      ]
    };

    const validated = validateExtraction(mixedPayload);
    assert.strictEqual(validated.medicines.length, 3);

    // Green item assertions
    assert.strictEqual(validated.medicines[0].visualState, "GREEN");
    assert.strictEqual(validated.medicines[0].medicineName, "Augmentin");

    // Amber item assertions
    assert.strictEqual(validated.medicines[1].visualState, "AMBER");
    assert.strictEqual(validated.medicines[1].medicineName, null);
    assert.strictEqual(validated.medicines[1].recognitionStatus, "UNCERTAIN");

    // Red item assertions
    assert.strictEqual(validated.medicines[2].visualState, "RED");
    assert.strictEqual(validated.medicines[2].medicineName, null);
    assert.strictEqual(validated.medicines[2].possibleMatches.length, 0);

    // Overall uncertain flag
    assert.strictEqual(validated.hasUncertainFields, true);
  });

  // ----------------------------------------------------
  // 4. Multi-Provider OCR Adapter Tests
  // ----------------------------------------------------
  test("OCR Provider Adapter: Factory correctly returns configured providers", () => {
    const geminiProvider = getOCRProvider("gemini");
    assert.strictEqual(geminiProvider.getName(), "gemini-2.5-flash");

    const hybridProvider = getOCRProvider("hybrid");
    assert.strictEqual(hybridProvider.getName(), "hybrid-gemini-documentai");

    const docAiProvider = getOCRProvider("documentai");
    assert.strictEqual(docAiProvider.getName(), "google-cloud-documentai");
  });

  // ----------------------------------------------------
  // 5. Clinical Authorization & Cross-Pharmacy Access Control
  // ----------------------------------------------------
  await asyncTest("Clinical Auth: Unverified pharmacy cannot access review queue (403)", async () => {
    // Stub Pharmacy.findOne to simulate unverified pharmacy account
    const origFindOne = Pharmacy.findOne;
    Pharmacy.findOne = async () => ({
      _id: "pharma-unverified-id",
      user_id: "user-unverified",
      name: "Unverified Pharmacy",
      verified: false
    });

    try {
      let threw = false;
      try {
        await prescriptionReviewService.getReviewQueue({ pharmacyId: "user-unverified" });
      } catch (err) {
        threw = true;
        assert(err.message.includes("Forbidden") || err.statusCode === 403);
        assert(err.message.includes("verified licensed pharmacist"));
      }
      assert(threw, "Must throw 403 Forbidden for unverified pharmacy accessing review queue");
    } finally {
      Pharmacy.findOne = origFindOne;
    }
  });

  await asyncTest("Clinical Auth: Pharmacy review queue enforces strict pharmacy tenancy filtering", async () => {
    const origFindOne = Pharmacy.findOne;
    const origCount = Prescription.countDocuments;
    const origFind = Prescription.find;

    let capturedQuery = null;
    Pharmacy.findOne = async () => ({
      _id: "pharma-A-id",
      user_id: "user-pharma-A",
      name: "MedPlus Pharmacy A",
      verified: true
    });

    Prescription.countDocuments = async (q) => {
      capturedQuery = q;
      return 1;
    };
    Prescription.find = (q) => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [
              {
                _id: "rx-001",
                pharmacy_id: "pharma-A-id",
                status: "needs_review"
              }
            ]
          })
        })
      })
    });

    try {
      const res = await prescriptionReviewService.getReviewQueue({ pharmacyId: "user-pharma-A" });
      assert.strictEqual(res.total, 1);
      assert(capturedQuery, "Query must be executed");
      // Tenancy check: Ensure the query includes pharmacy_id matching Pharmacy A
      const queryStr = JSON.stringify(capturedQuery);
      assert(queryStr.includes("pharma-A-id"), "Queue query must filter by Pharmacy A ID");
    } finally {
      Pharmacy.findOne = origFindOne;
      Prescription.countDocuments = origCount;
      Prescription.find = origFind;
    }
  });

  await asyncTest("Clinical Auth: Cross-pharmacy prescription details access is strictly denied (403)", async () => {
    const origFindById = Prescription.findById;
    const origFindOne = Pharmacy.findOne;

    // Prescription is assigned to Pharmacy A
    Prescription.findById = () => ({
      lean: async () => ({
        _id: "rx-assigned-to-A",
        user_id: "cust-1",
        pharmacy_id: "pharma-A-id",
        file_url: "https://medszop.com/rx/rx-01.jpg"
      })
    });

    // Pharmacy B attempts to inspect Pharmacy A's prescription
    Pharmacy.findOne = async () => ({
      _id: "pharma-B-id",
      user_id: "user-pharma-B",
      name: "MedPlus Pharmacy B",
      verified: true
    });

    try {
      let threw = false;
      try {
        await prescriptionReviewService.getPrescriptionDetails("rx-assigned-to-A", {
          id: "user-pharma-B",
          role: "pharmacy"
        });
      } catch (err) {
        threw = true;
        assert.strictEqual(err.statusCode, 403);
        assert(err.message.includes("Cross-pharmacy access denied"));
      }
      assert(threw, "Pharmacy B must be denied access to Pharmacy A's prescription");
    } finally {
      Prescription.findById = origFindById;
      Pharmacy.findOne = origFindOne;
    }
  });

  await asyncTest("Clinical Auth: Cross-pharmacy review approval is strictly denied (403)", async () => {
    const origFindById = Prescription.findById;
    const origFindOne = Pharmacy.findOne;

    Prescription.findById = async () => ({
      _id: "rx-assigned-to-A",
      pharmacy_id: "pharma-A-id",
      parsed_data: { medicines: [] },
      markModified: () => {},
      save: async () => {}
    });

    // Pharmacist B attempts to sign off on Pharmacy A's prescription
    Pharmacy.findOne = async () => ({
      _id: "pharma-B-id",
      user_id: "user-pharma-B",
      verified: true,
      license_number: "DL-2024-B"
    });

    try {
      let threw = false;
      try {
        await prescriptionReviewService.submitReview({
          prescriptionId: "rx-assigned-to-A",
          decision: "approve",
          reviewedMedicines: [],
          pharmacist: { id: "user-pharma-B", role: "pharmacy", name: "Pharmacist B" }
        });
      } catch (err) {
        threw = true;
        assert.strictEqual(err.statusCode, 403);
        assert(err.message.includes("Cross-pharmacy review denied"));
      }
      assert(threw, "Must throw 403 Forbidden on cross-pharmacy review approval");
    } finally {
      Prescription.findById = origFindById;
      Pharmacy.findOne = origFindOne;
    }
  });

  await asyncTest("Clinical Auth: Non-pharmacist role is rejected from clinical review approval (403)", async () => {
    try {
      let threw = false;
      try {
        await prescriptionReviewService.submitReview({
          prescriptionId: "rx-001",
          decision: "approve",
          pharmacist: { id: "cust-99", role: "customer", name: "Unauthorized Customer" }
        });
      } catch (err) {
        threw = true;
        assert.strictEqual(err.statusCode, 403);
        assert(err.message.includes("Unauthorized") || err.message.includes("licensed pharmacists"));
      }
      assert(threw, "Non-pharmacists must be strictly rejected from approval");
    } catch (e) {
      throw e;
    }
  });

  await asyncTest("Clinical Auth: Verified assigned pharmacist approval succeeds with license audit trail", async () => {
    const origFindById = Prescription.findById;
    const origFindOne = Pharmacy.findOne;

    let savedRx = null;
    Prescription.findById = async () => ({
      _id: "rx-assigned-to-A",
      pharmacy_id: "pharma-A-id",
      status: "needs_review",
      parsed_data: { medicines: [{ medicineName: "Augmentin", strength: "625mg" }] },
      markModified: () => {},
      save: async function () {
        savedRx = this;
      }
    });

    Pharmacy.findOne = async () => ({
      _id: "pharma-A-id",
      user_id: "user-pharma-A",
      pharmacist_name: "Dr. Ramesh Gupta",
      verified: true,
      license_number: "DL-MH-2024-88392"
    });

    try {
      const result = await prescriptionReviewService.submitReview({
        prescriptionId: "rx-assigned-to-A",
        decision: "approve",
        reviewedMedicines: [{ medicineName: "Augmentin", strength: "625mg", prescribedDose: "1 tab BD" }],
        notes: "Clinically verified against doctor registration #48291",
        pharmacist: { id: "user-pharma-A", role: "pharmacy" }
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, "verified");
      assert.strictEqual(result.reviewEvent.pharmacistLicense, "DL-MH-2024-88392");
      assert.strictEqual(savedRx.parsed_data.reviewedByLicense, "DL-MH-2024-88392");
    } finally {
      Prescription.findById = origFindById;
      Pharmacy.findOne = origFindOne;
    }
  });

  await asyncTest("Prescription Model Relations: Schema defines Mongoose references & virtual relations", async () => {
    // Assert schema paths have configured refs
    assert.strictEqual(Prescription.schema.path("user_id").options.ref, "User");
    assert.strictEqual(Prescription.schema.path("order_id").options.ref, "Order");
    assert.strictEqual(Prescription.schema.path("pharmacy_id").options.ref, "Pharmacy");
    assert.strictEqual(Prescription.schema.path("assigned_pharmacist_id").options.ref, "User");

    // Assert virtual relations exist
    assert(Prescription.schema.virtuals.user, "Virtual 'user' must be configured");
    assert(Prescription.schema.virtuals.order, "Virtual 'order' must be configured");
    assert(Prescription.schema.virtuals.pharmacy, "Virtual 'pharmacy' must be configured");
    assert(Prescription.schema.virtuals.assignedPharmacist, "Virtual 'assignedPharmacist' must be configured");

    // Order model relations
    assert.strictEqual(Order.schema.path("prescription_id").options.ref, "Prescription");
    assert(Order.schema.virtuals.prescription, "Virtual 'prescription' must be configured in Order");
  });

  await asyncTest("Prescription Review: Syncs linked order status to 'confirmed' upon pharmacist verification", async () => {
    const origFindById = Prescription.findById;
    const origPharmacyFindOne = Pharmacy.findOne;
    const origOrderFindById = Order.findById;

    let updatedOrder = null;
    Prescription.findById = async () => ({
      _id: "rx-sync-100",
      order_id: "order-999",
      pharmacy_id: "pharma-A-id",
      status: "needs_review",
      parsed_data: { medicines: [{ medicineName: "Amoxicillin", strength: "500mg" }] },
      markModified: () => {},
      save: async () => {}
    });

    Pharmacy.findOne = async () => ({
      _id: "pharma-A-id",
      user_id: "user-pharma-A",
      pharmacist_name: "Dr. Ramesh Gupta",
      verified: true,
      license_number: "DL-MH-2024-88392"
    });

    Order.findById = async (id) => ({
      _id: id,
      order_status: "pending_verification",
      prescription_verified: false,
      save: async function() {
        updatedOrder = this;
      }
    });

    try {
      const result = await prescriptionReviewService.submitReview({
        prescriptionId: "rx-sync-100",
        decision: "approve",
        reviewedMedicines: [{ medicineName: "Amoxicillin", strength: "500mg" }],
        pharmacist: { id: "user-pharma-A", role: "pharmacy" }
      });

      assert.strictEqual(result.status, "verified");
      assert(updatedOrder !== null, "Linked order must be retrieved and updated");
      assert.strictEqual(updatedOrder.order_status, "confirmed");
      assert.strictEqual(updatedOrder.prescription_verified, true);
    } finally {
      Prescription.findById = origFindById;
      Pharmacy.findOne = origPharmacyFindOne;
      Order.findById = origOrderFindById;
    }
  });

  // ----------------------------------------------------
  // 6. Real Scanner Evaluation & Candidate Safety Rules
  // ----------------------------------------------------
  await asyncTest("Scanner Pipeline: Realistic SVG handwritten prescription evaluates sharpness & quality metrics", async () => {
    // Generate realistic multi-stroke prescription test image with simulated ink strokes and doctor stamp
    const syntheticRxBuffer = await sharp({
      create: {
        width: 1400,
        height: 1000,
        channels: 3,
        background: { r: 252, g: 250, b: 245 }
      }
    })
      .composite([
        {
          input: Buffer.from(`
            <svg width="1400" height="1000" xmlns="http://www.w3.org/2000/svg">
              <text x="60" y="80" font-family="serif" font-size="28" font-weight="bold" fill="#1e293b">APOLLO CLINIC • DR. V. K. SHARMA, MD</text>
              <text x="60" y="115" font-family="sans-serif" font-size="16" fill="#64748b">Reg No: MCI-2015-84920 | New Delhi</text>
              <line x1="50" y1="135" x2="1350" y2="135" stroke="#94a3b8" stroke-width="2"/>
              <text x="60" y="180" font-family="serif" font-size="32" font-style="italic" fill="#0f172a">Rx</text>
              <!-- Simulated cursive ink prescription lines -->
              <path d="M 120 220 Q 200 210 280 225 T 440 215 T 580 230" fill="none" stroke="#1e3a8a" stroke-width="4"/>
              <text x="120" y="270" font-family="cursive, serif" font-size="26" fill="#1e3a8a">1. Augmentin 625mg  1 tab BD x 5 days</text>
              <text x="120" y="340" font-family="cursive, serif" font-size="26" fill="#1e3a8a">2. Met...ol 50mg  OD post breakfast</text>
              <circle cx="1200" cy="850" r="70" stroke="#059669" stroke-width="3" fill="none" opacity="0.6"/>
              <text x="1145" y="855" font-family="sans-serif" font-size="14" fill="#059669" font-weight="bold">VERIFIED CLINIC</text>
            </svg>
          `),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

    const preprocessed = await prescriptionPreprocessor.preprocess(syntheticRxBuffer);
    assert.strictEqual(preprocessed.isPdf, false);
    assert(preprocessed.quality.edgeVariance > 10, "Realistic prescription SVG must have measurable edge variance");
    assert.strictEqual(preprocessed.quality.dimensions.width, 1400);
    assert.strictEqual(preprocessed.quality.dimensions.height, 1000);
    assert.strictEqual(preprocessed.metadata.format, "png");
  });

  await asyncTest("Candidate Safety: Refuses to invent medicine candidates when no useful characters are readable", async () => {
    // Single non-alphanumeric character or punctuation
    const emptyCandidates1 = await medicineMatcher.generateSuggestions("...");
    assert.strictEqual(emptyCandidates1.length, 0, "Must return 0 candidates for '...'");

    const emptyCandidates2 = await medicineMatcher.generateSuggestions("~");
    assert.strictEqual(emptyCandidates2.length, 0, "Must return 0 candidates for '~'");

    const emptyCandidates3 = await medicineMatcher.generateSuggestions("!@#$");
    assert.strictEqual(emptyCandidates3.length, 0, "Must return 0 candidates for '!@#$'");

    const emptyCandidates4 = await medicineMatcher.generateSuggestions(" ");
    assert.strictEqual(emptyCandidates4.length, 0, "Must return 0 candidates for whitespace");
  });

  await asyncTest("Heuristic Match Score: Candidates include explicit heuristic disclosure and scoreDisclaimer", async () => {
    const suggestions = await medicineMatcher.generateSuggestions("Met...ol", "50mg");
    assert(suggestions.length > 0, "Must yield suggestions for Met...ol");
    const topSuggestion = suggestions[0];
    assert.strictEqual(typeof topSuggestion.heuristicMatchScore, "number");
    assert(topSuggestion.scoreDisclaimer.includes("Heuristic character agreement"), "Must disclose heuristic nature of score");
  });

  console.log("\n============================================================");
  console.log(` Test Suite Completed: ${passed} Passed, ${failed} Failed`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

