/**
 * MedsZop Prescription Intelligence V2 — medicineMatcher
 * 
 * Controlled catalog reconciliation and Look-Alike / Sound-Alike (LASA) safety engine.
 * 
 * Clinical Rule:
 * "A text similarity score must NEVER be treated as clinical proof that a medicine was correctly identified.
 * Do not substitute medicines or infer therapeutic equivalence automatically.
 * Any conflicting strength, dosage form, salt, or brand must require review."
 */

const Medicine = require("../models/Medicine");

// High-Risk Indian Look-Alike / Sound-Alike (LASA) Confusable Drug Registry
const LASA_REGISTRY = [
  { pair: ["metformin", "metoprolol"], warning: "High Alert (LASA / Sound-Alike): Metformin (Antidiabetic) vs Metoprolol (Beta-blocker/Cardiac)" },
  { pair: ["amlodipine", "amitriptyline"], warning: "High Alert (LASA / Sound-Alike): Amlodipine (Antihypertensive) vs Amitriptyline (Tricyclic Antidepressant)" },
  { pair: ["cefixime", "cefuroxime"], warning: "High Alert (LASA / Sound-Alike): Cefixime (3rd gen Cephalosporin) vs Cefuroxime (2nd gen Cephalosporin)" },
  { pair: ["prednisone", "prednisolone"], warning: "Caution (LASA): Prednisone vs Prednisolone steroid potency & hepatic conversion difference" },
  { pair: ["tramadol", "trazodone"], warning: "High Alert (LASA / Sound-Alike): Tramadol (Opioid analgesic) vs Trazodone (Antidepressant/Sedative)" },
  { pair: ["hydroxyzine", "hydralazine"], warning: "High Alert (LASA / Sound-Alike): Hydroxyzine (Antihistamine) vs Hydralazine (Antihypertensive vasodilator)" },
  { pair: ["clonazepam", "lorazepam"], warning: "High Alert (LASA / Sound-Alike): Clonazepam vs Lorazepam benzodiazepine potency variation" },
  { pair: ["azithromycin", "erythromycin"], warning: "Caution (LASA): Azithromycin vs Erythromycin macrolide dosing variation" },
  { pair: ["fluoxetine", "duloxetine"], warning: "Caution (LASA): Fluoxetine (SSRI) vs Duloxetine (SNRI)" },
  { pair: ["telmisartan", "losartan"], warning: "Caution (LASA): Telmisartan vs Losartan ARB dosing & half-life differences" }
];

// Curated high-frequency Indian pharmacopeia benchmark items for offline / fast fallback matching
const BENCHMARK_CATALOG = [
  { name: "Paracetamol 650mg", generic_name: "Paracetamol", brand: "Generic", dosage_form: "Tablet", strength: "650mg", category: "Analgesic" },
  { name: "Amoxicillin 500mg", generic_name: "Amoxicillin", brand: "Generic", dosage_form: "Capsule", strength: "500mg", category: "Antibiotic" },
  { name: "Metformin 500mg", generic_name: "Metformin", brand: "Generic", dosage_form: "Tablet", strength: "500mg", category: "Antidiabetic" },
  { name: "Metoprolol 50mg", generic_name: "Metoprolol", brand: "Generic", dosage_form: "Tablet", strength: "50mg", category: "Cardiac" },
  { name: "Glycomet SR 500mg", generic_name: "Metformin Hydrochloride", brand: "USV Ltd", dosage_form: "Tablet", strength: "500mg", category: "Diabetes" },
  { name: "Glycomet GP 1", generic_name: "Metformin + Glimepiride", brand: "USV Ltd", dosage_form: "Tablet", strength: "500mg/1mg", category: "Diabetes" },
  { name: "Augmentin 625 Duo", generic_name: "Amoxicillin + Clavulanic Acid", brand: "GSK", dosage_form: "Tablet", strength: "625mg", category: "Antibiotic" },
  { name: "Pan 40", generic_name: "Pantoprazole Gastro-Resistant", brand: "Alkem Laboratories", dosage_form: "Tablet", strength: "40mg", category: "Gastro" },
  { name: "Telma 40", generic_name: "Telmisartan", brand: "Glenmark Pharmaceuticals", dosage_form: "Tablet", strength: "40mg", category: "Cardiac" },
  { name: "Atorva 10", generic_name: "Atorvastatin Calcium", brand: "Zydus Healthcare", dosage_form: "Tablet", strength: "10mg", category: "Cardiac" },
  { name: "Amlokind 5", generic_name: "Amlodipine Besylate", brand: "Mankind Pharma", dosage_form: "Tablet", strength: "5mg", category: "Cardiac" },
  { name: "Cetzine 10mg", generic_name: "Cetirizine Hydrochloride", brand: "Dr. Reddy's", dosage_form: "Tablet", strength: "10mg", category: "Antihistamine" },
  { name: "Dolo 650", generic_name: "Paracetamol", brand: "Micro Labs", dosage_form: "Tablet", strength: "650mg", category: "Analgesic" },
  { name: "Calpol 500", generic_name: "Paracetamol", brand: "GSK", dosage_form: "Tablet", strength: "500mg", category: "Analgesic" },
  { name: "Azithral 500", generic_name: "Azithromycin", brand: "Alembic Pharmaceuticals", dosage_form: "Tablet", strength: "500mg", category: "Antibiotic" },
  { name: "Montair LC", generic_name: "Montelukast + Levocetirizine", brand: "Cipla", dosage_form: "Tablet", strength: "10mg/5mg", category: "Respiratory" }
];

const CLINICAL_ABBREVIATIONS = {
  pcm: "Paracetamol",
  amox: "Amoxicillin",
  amoxy: "Amoxicillin",
  azithro: "Azithromycin",
  cipro: "Ciprofloxacin",
  metro: "Metronidazole",
  panto: "Pantoprazole",
  omep: "Omeprazole",
  cetriz: "Cetirizine",
  mont: "Montelukast",
  ator: "Atorvastatin"
};

class MedicineMatcher {
  /**
   * Calculate string similarity (0.0 to 1.0)
   */
  calculateSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();
    if (a === b) return 1.0;

    // Substring inclusion bonus
    if (a.includes(b) || b.includes(a)) {
      const minLen = Math.min(a.length, b.length);
      const maxLen = Math.max(a.length, b.length);
      return 0.8 + 0.2 * (minLen / maxLen);
    }

    // Levenshtein distance calculation
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    const dist = matrix[b.length][a.length];
    const maxLen = Math.max(a.length, b.length);
    return Math.max(0, 1 - dist / maxLen);
  }

  /**
   * Check if recognized text triggers any Look-Alike / Sound-Alike (LASA) confusable drug warnings
   * @param {string} text
   * @returns {object|null}
   */
  checkLasaAlert(text) {
    if (!text) return null;
    const clean = text.toLowerCase().replace(/[^a-z]/g, "");

    for (const item of LASA_REGISTRY) {
      for (const drug of item.pair) {
        if (clean.includes(drug) || this.calculateSimilarity(clean, drug) > 0.82) {
          return {
            triggeredDrug: drug,
            pair: item.pair,
            warning: item.warning,
            isHighRisk: true
          };
        }
      }
    }
    return null;
  }

  /**
   * Clean and normalize medicine search query
   */
  normalizeName(raw) {
    if (!raw) return "";
    const base = raw
      .replace(/\b(tab|tablets?|cap|capsules?|syp|syrup|inj|injection|drops?|ointment|gel)\b/gi, "")
      .replace(/\b\d+(\.\d+)?\s*(mg|g|mcg|ml|iu|%)\b/gi, "")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const lower = base.toLowerCase();
    if (CLINICAL_ABBREVIATIONS[lower]) {
      return CLINICAL_ABBREVIATIONS[lower];
    }
    return base;
  }

  /**
   * Match an extracted medicine item against Indian catalog candidates
   * @param {object} extractedItem
   * @returns {Promise<object>} enriched item with candidate matches and LASA flags
   */
  async match(extractedItem) {
    const rawName = extractedItem.medicineName || extractedItem.sourceText || "";
    const cleanQuery = this.normalizeName(rawName);
    const lasa = this.checkLasaAlert(rawName);

    let candidates = [];

    // 1. Search Database if MongoDB is active
    try {
      if (cleanQuery.length >= 2 && Medicine && Medicine.find) {
        const queryRegex = new RegExp(cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const dbMatches = await Medicine.find({
          $or: [
            { name: { $regex: queryRegex } },
            { generic_name: { $regex: queryRegex } },
            { brand: { $regex: queryRegex } }
          ]
        })
          .limit(8)
          .lean();

        candidates = dbMatches.map((m) => ({
          id: m._id ? m._id.toString() : m.id,
          name: m.name,
          genericName: m.generic_name || m.genericName,
          brand: m.brand,
          dosageForm: m.dosage_form || m.dosageForm,
          strength: m.strength,
          requiresPrescription: m.requires_prescription || false,
          similarity: this.calculateSimilarity(cleanQuery, this.normalizeName(m.name))
        }));
      }
    } catch {
      // Graceful fallback to static benchmark catalog on DB disconnect
    }

    // 2. Supplement with benchmark catalog if candidates are sparse
    if (candidates.length === 0 && cleanQuery.length >= 2) {
      BENCHMARK_CATALOG.forEach((item, idx) => {
        const simName = this.calculateSimilarity(cleanQuery, this.normalizeName(item.name));
        const simSalt = this.calculateSimilarity(cleanQuery, this.normalizeName(item.generic_name));
        const bestSim = Math.max(simName, simSalt);

        if (bestSim >= 0.6) {
          candidates.push({
            id: `benchmark-${idx}`,
            name: item.name,
            genericName: item.generic_name,
            brand: item.brand,
            dosageForm: item.dosage_form,
            strength: item.strength,
            requiresPrescription: true,
            similarity: bestSim
          });
        }
      });
    }

    // 3. Sort candidates by similarity descending
    candidates.sort((a, b) => b.similarity - a.similarity);

    // Top candidate evaluation
    const topCandidate = candidates[0] || null;
    let recognitionStatus = extractedItem.recognitionStatus || "PENDING_PHARMACIST";
    const uncertaintyReasons = Array.isArray(extractedItem.uncertaintyReasons) ? [...extractedItem.uncertaintyReasons] : [];

    if (lasa) {
      uncertaintyReasons.push(lasa.warning);
      recognitionStatus = "UNCERTAIN";
    }

    // Check strength consistency if top candidate exists
    let strengthDiscrepancy = null;
    if (topCandidate && extractedItem.strength && topCandidate.strength) {
      const extractedClean = extractedItem.strength.toLowerCase().replace(/\s+/g, "");
      const candidateClean = topCandidate.strength.toLowerCase().replace(/\s+/g, "");
      if (!candidateClean.includes(extractedClean) && !extractedClean.includes(candidateClean)) {
        strengthDiscrepancy = `Discrepancy: Extracted "${extractedItem.strength}" differs from catalog "${topCandidate.strength}".`;
        uncertaintyReasons.push(strengthDiscrepancy);
        if (recognitionStatus === "RECOGNIZED_UNVERIFIED") {
          recognitionStatus = "UNCERTAIN";
        }
      }
    }

    return {
      ...extractedItem,
      canonicalName: topCandidate ? topCandidate.genericName || topCandidate.name : cleanQuery || null,
      normalizedCandidate: topCandidate ? topCandidate.name : null,
      matchedMedicineId: topCandidate ? topCandidate.id : null,
      matchedGenericName: topCandidate ? topCandidate.genericName : null,
      similarityScore: topCandidate ? topCandidate.similarity : 0,
      candidateMatches: candidates.slice(0, 4),
      lasaAlert: lasa ? { warning: lasa.warning, ...lasa } : null,
      lasaDetails: lasa,
      strengthDiscrepancy,
      recognitionStatus,
      uncertaintyReasons
    };
  }

  /**
   * Match an entire array of extracted medicine items
   * @param {Array<object>} items
   * @returns {Promise<Array<object>>}
   */
  async matchAll(items) {
    if (!Array.isArray(items)) return [];
    return Promise.all(items.map((item) => this.match(item)));
  }
}

module.exports = new MedicineMatcher();
