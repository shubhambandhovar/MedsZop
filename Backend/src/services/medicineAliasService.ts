// Medicine alias mapping for doctor shorthand to full names
// Doctors use abbreviated forms that need to be mapped to actual medicine names

export const medicineAliases: { [key: string]: string } = {
  // Paracetamol variants
  pcm: "paracetamol",
  acetaminophen: "paracetamol",
  crocin: "paracetamol",
  dolo: "paracetamol",
  acimol: "paracetamol",
  tylenol: "paracetamol",
  
  // Amoxicillin variants
  amox: "amoxicillin",
  amoxil: "amoxicillin",
  polymox: "amoxicillin",
  
  // Cetirizine variants
  cetirizine: "cetirizine",
  cetrizine: "cetirizine",
  piriteze: "cetirizine",
  zyrtec: "cetirizine",
  
  // Metformin variants
  metformin: "metformin",
  glucophage: "metformin",
  
  // Omeprazole variants
  omeprazole: "omeprazole",
  prilosec: "omeprazole",
  losec: "omeprazole",
  
  // Ibuprofen variants
  ibuprofen: "ibuprofen",
  brufen: "ibuprofen",
  combiflam: "ibuprofen",
  
  // Aspirin variants
  aspirin: "aspirin",
  ecosprin: "aspirin",
  disprin: "aspirin",
  
  // Azithromycin variants
  azithromycin: "azithromycin",
  zithromax: "azithromycin",
  
  // Ranitidine variants
  ranitidine: "ranitidine",
  zantac: "ranitidine",
  
  // Atorvastatin variants
  atorvastatin: "atorvastatin",
  lipitor: "atorvastatin",
  
  // Lisinopril variants
  lisinopril: "lisinopril",
  prinivil: "lisinopril",
  zestril: "lisinopril",
  
  // Antibiotics
  amx: "amoxicillin",
  cephalexin: "cephalexin",
  cipro: "ciprofloxacin",
  cipflox: "ciprofloxacin",
  levofloxacin: "levofloxacin",
  levaquin: "levofloxacin",
  
  // Antihistamines
  benadryl: "diphenhydramine",
  chlorpheniramine: "chlorpheniramine",
  
  // Cough & Cold
  dextromethorphan: "dextromethorphan",
  pseudoephedrine: "pseudoephedrine",
  phenylephrine: "phenylephrine",
  
  // Antacids
  antacid: "calcium carbonate",
  gaviscon: "alginate",
  
  // Vitamins & Supplements
  vitamin_b12: "vitamin b12",
  cyanocobalamin: "vitamin b12",
  folic: "folic acid",
  folicacid: "folic acid",
  
  // Common abbreviations
  bd: "", // BD = Twice daily (not a medicine)
  od: "", // OD = Once daily
  hs: "", // HS = At bedtime
  sos: "", // SOS = As needed
  tab: "", // TAB = Tablet
  cap: "", // CAP = Capsule
  syr: "", // SYR = Syrup
  inj: "", // INJ = Injection
};

/**
 * Normalize medicine name from doctor's abbreviation
 * @param text - Raw medicine name or abbreviation
 * @returns Normalized full medicine name
 */
export function normalizeMedicineName(text: string): string {
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/^\d+\s*/, "") // Remove leading numbers
    .replace(/\s*(mg|ml|%|gm|gram|mcg|µg)\s*/g, "") // Remove dosages
    .replace(/\s*(bd|od|hs|sos|times?)\s*/gi, "") // Remove frequency
    .replace(/\s*(tablet|capsule|syrup|injection|solution|cream|ointment)\s*/gi, "")
    .replace(/[,\-\(\)]/g, "") // Remove punctuation
    .replace(/\s+/g, " ")
    .trim();

  // Check if it's an alias
  if (medicineAliases[cleaned]) {
    const normalized = medicineAliases[cleaned];
    return normalized || cleaned;
  }

  // Return original if no alias found
  return cleaned;
}

/**
 * Extract and normalize medicine names from prescription text
 * @param prescriptionText - Raw OCR text from prescription
 * @returns Array of normalized medicine names
 */
export function extractMedicineNames(prescriptionText: string): string[] {
  // Split by newlines and common separators
  const lines = prescriptionText
    .split(/[\n,;]/g)
    .map(line => line.trim())
    .filter(line => line.length > 2);

  const medicines: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    // Skip if line is too short or just contains numbers/dosages
    if (line.length < 3) continue;

    const normalized = normalizeMedicineName(line);

    // Skip empty results from abbreviations and duplicates
    if (normalized.length > 2 && !seen.has(normalized)) {
      medicines.push(normalized);
      seen.add(normalized);
    }
  }

  return medicines;
}

/**
 * Get similar medicine names for suggestion (fuzzy matching)
 * @param medicineName - Normalized medicine name
 * @param availableMedicines - List of available medicines
 * @returns Matched medicine or null
 */
export function findSimilarMedicine(
  medicineName: string,
  availableMedicines: Array<{ name: string; genericName: string; brand: string }>
): any | null {
  const lowerName = medicineName.toLowerCase();

  // Exact match on name
  let match = availableMedicines.find(m =>
    m.name.toLowerCase() === lowerName ||
    m.genericName.toLowerCase() === lowerName ||
    m.brand.toLowerCase() === lowerName
  );

  if (match) return match;

  // Partial match (first word)
  const firstWord = lowerName.split(" ")[0];
  match = availableMedicines.find(m =>
    m.name.toLowerCase().startsWith(firstWord) ||
    m.genericName.toLowerCase().startsWith(firstWord) ||
    m.brand.toLowerCase().startsWith(firstWord)
  );

  if (match) return match;

  // Substring match
  match = availableMedicines.find(m =>
    m.name.toLowerCase().includes(lowerName) ||
    m.genericName.toLowerCase().includes(lowerName)
  );

  return match || null;
}
