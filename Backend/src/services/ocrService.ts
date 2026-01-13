import { extractMedicineNames, findSimilarMedicine } from "./medicineAliasService";

interface OCRResult {
  rawText: string;
  detectedMedicines: DetectedMedicine[];
  added: string[];
  suggested: string[];
  needsVerification: boolean;
}

interface DetectedMedicine {
  detectedName: string;
  matchedMedicine: any | null;
  confidence: number;
  alternatives: any[];
}

/**
 * Extract text from image using simulated OCR
 * In production, integrate with Google Vision API or Tesseract
 * @param imageBuffer - Image file buffer
 * @returns Extracted text from image
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    // Simulate OCR by detecting common medicine patterns in image
    // In production, this would use Google Vision API
    console.log("📸 Processing image buffer:", imageBuffer.length, "bytes");
    
    // For now, return simulated text
    // TODO: Integrate with real OCR service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`
          Tab Paracetamol 500mg OD
          Cap Amoxicillin 250mg BD
          Cetirizine 10mg HS
          Metformin 500mg BD
          Omeprazole 20mg OD
        `);
      }, 1000);
    });
  } catch (error: any) {
    console.error("OCR Processing Error:", error.message);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Process prescription image and extract medicines
 * @param imageBuffer - Image file buffer
 * @param availableMedicines - List of available medicines in inventory
 * @returns OCR result with detected medicines and suggestions
 */
export async function processPrescriptionImage(
  imageBuffer: Buffer,
  availableMedicines: any[]
): Promise<OCRResult> {
  try {
    // Step 1: Extract text from image
    console.log("📸 Extracting text from prescription image...");
    const rawText = await extractTextFromImage(imageBuffer);

    if (!rawText || rawText.trim().length === 0) {
      return {
        rawText: "",
        detectedMedicines: [],
        added: [],
        suggested: [],
        needsVerification: false,
      };
    }

    // Step 2: Extract and normalize medicine names
    console.log("🧹 Cleaning and normalizing medicine names...");
    const normalizedNames = extractMedicineNames(rawText);

    // Step 3: Match with inventory
    console.log("🔍 Matching medicines with inventory...");
    const detectedMedicines: DetectedMedicine[] = [];
    const added: string[] = [];
    const suggested: string[] = [];

    for (const medicineName of normalizedNames) {
      const matchedMedicine = findSimilarMedicine(
        medicineName,
        availableMedicines
      );

      let alternatives: any[] = [];
      if (matchedMedicine) {
        alternatives = availableMedicines.filter(
          (m: any) =>
            (m.genericName === matchedMedicine.genericName ||
              m.category === matchedMedicine.category) &&
            m.id !== matchedMedicine.id
        );

        if (matchedMedicine.inStock) {
          added.push(matchedMedicine.brand || matchedMedicine.name);
        } else {
          const availableAlternative = alternatives.find((m: any) => m.inStock);
          if (availableAlternative) {
            suggested.push(availableAlternative.brand || availableAlternative.name);
          }
        }
      } else {
        const keywordAlternatives = availableMedicines.filter((m: any) =>
          m.name.toLowerCase().includes(medicineName.split(" ")[0])
        );

        if (keywordAlternatives.length > 0) {
          alternatives = keywordAlternatives;
          suggested.push(
            `Could not find "${medicineName}". Check suggested alternatives.`
          );
        }
      }

      detectedMedicines.push({
        detectedName: medicineName,
        matchedMedicine: matchedMedicine,
        confidence: matchedMedicine ? 0.95 : 0.6,
        alternatives: alternatives.slice(0, 3),
      });
    }

    return {
      rawText,
      detectedMedicines,
      added,
      suggested,
      needsVerification: true,
    };
  } catch (error: any) {
    console.error("Prescription processing error:", error);
    throw error;
  }
}

/**
 * Simulate OCR for testing
 * @param imageBuffer - Image buffer (unused in simulation)
 * @param availableMedicines - Available medicines
 * @returns Mock OCR result
 */
export async function simulateOCRForTesting(
  imageBuffer: Buffer,
  availableMedicines: any[]
): Promise<OCRResult> {
  const mockText = `
    Tab Paracetamol 500mg OD
    Cap Amoxicillin 250mg BD
    Cetirizine 10mg HS
    Metformin 500mg BD
    Omeprazole 20mg OD
  `;

  const normalizedNames = extractMedicineNames(mockText);
  const detectedMedicines: DetectedMedicine[] = [];
  const added: string[] = [];
  const suggested: string[] = [];

  for (const medicineName of normalizedNames) {
    const matchedMedicine = findSimilarMedicine(
      medicineName,
      availableMedicines
    );

    let alternatives: any[] = [];
    if (matchedMedicine) {
      alternatives = availableMedicines.filter(
        (m: any) =>
          (m.genericName === matchedMedicine.genericName ||
            m.category === matchedMedicine.category) &&
          m.id !== matchedMedicine.id
      );

      if (matchedMedicine.inStock) {
        added.push(matchedMedicine.brand || matchedMedicine.name);
      }
    } else {
      const keywordAlternatives = availableMedicines.filter((m: any) =>
        m.name.toLowerCase().includes(medicineName.split(" ")[0])
      );
      if (keywordAlternatives.length > 0) {
        alternatives = keywordAlternatives;
      }
    }

    detectedMedicines.push({
      detectedName: medicineName,
      matchedMedicine: matchedMedicine,
      confidence: matchedMedicine ? 0.95 : 0.6,
      alternatives: alternatives.slice(0, 3),
    });
  }

  return {
    rawText: mockText,
    detectedMedicines,
    added,
    suggested,
    needsVerification: true,
  };
}
