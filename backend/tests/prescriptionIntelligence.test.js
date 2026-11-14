/**
 * MedsZop Prescription Intelligence V2 — Unit & Integration Test Suite
 */

const assert = require("assert");
const sharp = require("sharp");
const prescriptionPreprocessor = require("../services/prescriptionPreprocessor");
const { validateExtraction } = require("../services/extractionValidator");
const medicineMatcher = require("../services/medicineMatcher");
const { getOCRProvider } = require("../services/ocrProviderAdapter");

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

  test("Extraction Validator: Zero Hallucination gate rejects null/empty candidates gracefully", () => {
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
    // Clinical Zero Hallucination: Unverified guess is NOT assigned to medicineName
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
    assert.strictEqual(matched.possibleMatches.length, 0, "Zero Hallucination: Must not fabricate candidates on scribble");
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

