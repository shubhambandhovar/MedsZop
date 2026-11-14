/**
 * MedsZop Prescription Intelligence V2 — medicineMatcher
 * 
 * Smart Handwriting Suggestion Engine & Controlled Catalog Reconciliation:
 * 1. Partial handwriting fragment recognition (wildcard prefix/suffix matching).
 * 2. Multi-evidence candidate generation (character similarity, abbreviation expansion, strength consistency).
 * 3. Separation of raw observations from unverified suggestions.
 * 4. High-Risk Look-Alike / Sound-Alike (LASA) safety guard.
 * 5. Strict uncertainty safeguards: do not generate suggestions when no legible characters are observed.
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
  { name: "Pantoprazole 40mg", generic_name: "Pantoprazole", brand: "Generic", dosage_form: "Tablet", strength: "40mg", category: "Gastro" },
  { name: "Telma 40", generic_name: "Telmisartan", brand: "Glenmark Pharmaceuticals", dosage_form: "Tablet", strength: "40mg", category: "Cardiac" },
  { name: "Atorva 10", generic_name: "Atorvastatin Calcium", brand: "Zydus Healthcare", dosage_form: "Tablet", strength: "10mg", category: "Cardiac" },
  { name: "Amlokind 5", generic_name: "Amlodipine Besylate", brand: "Mankind Pharma", dosage_form: "Tablet", strength: "5mg", category: "Cardiac" },
  { name: "Amlodipine 5mg", generic_name: "Amlodipine", brand: "Generic", dosage_form: "Tablet", strength: "5mg", category: "Cardiac" },
  { name: "Amitriptyline 25mg", generic_name: "Amitriptyline", brand: "Generic", dosage_form: "Tablet", strength: "25mg", category: "CNS" },
  { name: "Cetzine 10mg", generic_name: "Cetirizine Hydrochloride", brand: "Dr. Reddy's", dosage_form: "Tablet", strength: "10mg", category: "Antihistamine" },
  { name: "Cetirizine 10mg", generic_name: "Cetirizine", brand: "Generic", dosage_form: "Tablet", strength: "10mg", category: "Antihistamine" },
  { name: "Dolo 650", generic_name: "Paracetamol", brand: "Micro Labs", dosage_form: "Tablet", strength: "650mg", category: "Analgesic" },
  { name: "Calpol 500", generic_name: "Paracetamol", brand: "GSK", dosage_form: "Tablet", strength: "500mg", category: "Analgesic" },
  { name: "Azithral 500", generic_name: "Azithromycin", brand: "Alembic Pharmaceuticals", dosage_form: "Tablet", strength: "500mg", category: "Antibiotic" },
  { name: "Montair LC", generic_name: "Montelukast + Levocetirizine", brand: "Cipla", dosage_form: "Tablet", strength: "10mg/5mg", category: "Respiratory" },
  { name: "Cefixime 200mg", generic_name: "Cefixime", brand: "Generic", dosage_form: "Tablet", strength: "200mg", category: "Antibiotic" },
  { name: "Cefuroxime 500mg", generic_name: "Cefuroxime", brand: "Generic", dosage_form: "Tablet", strength: "500mg", category: "Antibiotic" },
  { name: "Allegra 120mg", generic_name: "Fexofenadine", brand: "Sanofi", dosage_form: "Tablet", strength: "120mg", category: "Antihistamine" },
  { name: "Meftal-Spas", generic_name: "Mefenamic Acid + Dicyclomine", brand: "Blue Cross", dosage_form: "Tablet", strength: "500mg/10mg", category: "Antispasmodic" },
  { name: "Ondem 4mg", generic_name: "Ondansetron", brand: "Alkem", dosage_form: "Tablet", strength: "4mg", category: "Antiemetic" },
  { name: "Ecosprin 75", generic_name: "Aspirin", brand: "USV Ltd", dosage_form: "Tablet", strength: "75mg", category: "Antiplatelet" },
  { name: "Rosuvas 10", generic_name: "Rosuvastatin", brand: "Sun Pharma", dosage_form: "Tablet", strength: "10mg", category: "Cardiac" },
  { name: "Clonazepam 0.5mg", generic_name: "Clonazepam", brand: "Generic", dosage_form: "Tablet", strength: "0.5mg", category: "CNS" },
  { name: "Lorazepam 1mg", generic_name: "Lorazepam", brand: "Generic", dosage_form: "Tablet", strength: "1mg", category: "CNS" }
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
   * Fetch catalog items from MedsZop MongoDB database, supplemented by validated benchmark data
   * @param {string} queryStem
   * @returns {Promise<Array<object>>}
   */
  async getCombinedCatalog(queryStem = "") {
    const combined = [...BENCHMARK_CATALOG];
    const seen = new Set(BENCHMARK_CATALOG.map((m) => (m.name || "").toLowerCase()));

    // Dynamically query MedsZop MongoDB Medicine collection if available
    try {
      if (Medicine && Medicine.find) {
        let dbQuery = {};
        if (queryStem && queryStem.length >= 2) {
          const safeStem = queryStem.replace(/[^a-zA-Z0-9]/g, "");
          if (safeStem.length >= 2) {
            dbQuery = {
              $or: [
                { name: { $regex: safeStem, $options: "i" } },
                { generic_name: { $regex: safeStem, $options: "i" } }
              ]
            };
          }
        }
        const dbItems = await Medicine.find(dbQuery).limit(60).lean();
        for (const item of dbItems) {
          const key = (item.name || "").toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            combined.push({
              id: item._id?.toString() || item.id,
              name: item.name,
              generic_name: item.generic_name || item.name,
              brand: item.brand || item.manufacturer || "Generic",
              dosage_form: item.dosage_form || "Tablet",
              strength: item.strength || "",
              category: item.category || "General",
              requiresPrescription: Boolean(item.requires_prescription)
            });
          }
        }
      }
    } catch {
      // Safe fallback to reference catalog if database query fails or during offline test runs
    }

    return combined;
  }

  /**
   * Generate evidence-grounded candidate suggestions for partially visible handwriting
   * @param {string} fragment - Observed raw text / character fragment (e.g. "Met...ol")
   * @param {string|null} strength - Observed strength if legible
   * @param {Array<object>} existingMatches - Preliminary matches provided by Gemini
   * @returns {Promise<Array<object>>} Up to 3 ranked suggestions with explicit visible evidence
   */
  async generateSuggestions(fragment, strength = null, existingMatches = []) {
    if (!fragment || typeof fragment !== "string") return [];

    const cleanFrag = fragment.trim();
    // Safety uncertainty gate: Never invent a medicine when no useful characters are readable
    const usefulChars = cleanFrag.replace(/[^a-zA-Z0-9]/g, "");
    if (usefulChars.length < 2 || /^\?+$/.test(cleanFrag) || /^[_\-~.\s]+$/.test(cleanFrag)) {
      return [];
    }

    const suggestions = [];
    const seenNames = new Set();

    // 1. Ingest valid existing matches from Gemini if evidence-backed
    if (Array.isArray(existingMatches)) {
      for (const em of existingMatches) {
        if (em && em.medicineName && !seenNames.has(em.medicineName.toLowerCase())) {
          seenNames.add(em.medicineName.toLowerCase());
          suggestions.push({
            medicineName: em.medicineName,
            matchType: em.matchType || "PARTIAL_HANDWRITING",
            evidence: em.evidence || `Visible strokes partially resemble ${em.medicineName}`,
            verified: false,
            heuristicMatchScore: 0.75,
            confidenceScore: 0.75,
            scoreDisclaimer: "Heuristic character agreement score, not calibrated clinical probability.",
            genericName: em.medicineName,
            category: "Prescription Formulation"
          });
        }
      }
    }

    // 2. Identify Wildcard Prefix & Suffix (e.g. "Met...ol" -> prefix: "met", suffix: "ol")
    let prefix = "";
    let suffix = "";
    const wildcardMatch = cleanFrag.match(/^([A-Za-z0-9]+)[\.\~]{2,}([A-Za-z0-9]*)$/);

    if (wildcardMatch) {
      prefix = wildcardMatch[1].toLowerCase();
      suffix = (wildcardMatch[2] || "").toLowerCase();
    } else {
      const cleanLetters = cleanFrag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      prefix = cleanLetters.slice(0, 3);
    }

    // 3. Search Database & Supplemented Reference Catalog for Evidence Agreement
    const searchCatalog = await this.getCombinedCatalog(prefix || cleanFrag);
    for (const item of searchCatalog) {
      const itemNameLower = item.name.toLowerCase();
      const genericLower = item.generic_name.toLowerCase();
      const targetName = item.generic_name || item.name;

      if (seenNames.has(targetName.toLowerCase())) continue;

      let score = 0;
      let evidence = "";
      let matchType = "PARTIAL_HANDWRITING";

      // A: Exact prefix & suffix wildcard agreement (e.g. "Met...ol" matches "Metoprolol")
      if (prefix && suffix && (itemNameLower.startsWith(prefix) || genericLower.startsWith(prefix)) && (itemNameLower.endsWith(suffix) || genericLower.endsWith(suffix))) {
        score = 0.92;
        matchType = "PARTIAL_HANDWRITING";
        evidence = `Visible character boundaries '${prefix}...' and '...${suffix}' match '${targetName}'`;
      }
      // B: Prefix agreement (e.g. "Met..." matches "Metformin" or "Metoprolol")
      else if (prefix && prefix.length >= 3 && (itemNameLower.startsWith(prefix) || genericLower.startsWith(prefix))) {
        score = 0.78;
        matchType = "PREFIX_MATCH";
        evidence = `Initial visible cursive letters '${prefix}' agree with '${targetName}'`;
      }
      // C: High character similarity on cleaned stem
      else {
        const sim = Math.max(
          this.calculateSimilarity(cleanFrag, item.name),
          this.calculateSimilarity(cleanFrag, item.generic_name)
        );
        if (sim >= 0.70) {
          score = Number((sim * 0.85).toFixed(2));
          matchType = "CATALOG_FUZZY";
          evidence = `Visible character structure (${Math.round(sim * 100)}% agreement) aligns with '${targetName}'`;
        }
      }

      // D: Strength agreement bonus
      if (score > 0 && strength && item.strength) {
        const cleanObsStrength = strength.toLowerCase().replace(/\s+/g, "");
        const cleanCatStrength = item.strength.toLowerCase().replace(/\s+/g, "");
        if (cleanCatStrength.includes(cleanObsStrength) || cleanObsStrength.includes(cleanCatStrength)) {
          score = Math.min(0.96, score + 0.08);
          evidence += ` with matching ${item.strength} commercial strength`;
        }
      }

      if (score >= 0.65) {
        seenNames.add(targetName.toLowerCase());
        suggestions.push({
          medicineName: targetName,
          genericName: item.generic_name,
          category: item.category,
          matchType,
          evidence,
          verified: false,
          heuristicMatchScore: Number(score.toFixed(2)),
          confidenceScore: Number(score.toFixed(2)),
          scoreDisclaimer: "Heuristic character agreement score, not calibrated clinical probability."
        });
      }
    }

    // 4. Sort descending by evidence score and cap strictly at top 3
    suggestions.sort((a, b) => (b.heuristicMatchScore || b.confidenceScore || 0) - (a.heuristicMatchScore || a.confidenceScore || 0));
    return suggestions.slice(0, 3);
  }

  /**
   * Match an extracted medicine item against Indian catalog candidates
   * @param {object} extractedItem
   * @returns {Promise<object>} enriched item with candidate matches and LASA flags
   */
  async match(extractedItem) {
    const rawFragment = extractedItem.recognizedFragment || extractedItem.sourceText || extractedItem.medicineName || "";
    const cleanQuery = this.normalizeName(rawFragment);
    const lasa = this.checkLasaAlert(rawFragment);

    // Detect if this line represents partial handwriting or difficult cursive
    const isPartial =
      rawFragment.includes("...") ||
      rawFragment.includes("~") ||
      rawFragment.includes("..") ||
      extractedItem.recognitionStatus === "UNCERTAIN";

    const isScribble =
      !rawFragment ||
      rawFragment.trim() === "" ||
      /^\?+$/.test(rawFragment) ||
      extractedItem.recognitionStatus === "ILLEGIBLE";

    // 1. Generate evidence-grounded suggestions
    let possibleMatches = [];
    if (!isScribble) {
      possibleMatches = await this.generateSuggestions(
        rawFragment,
        extractedItem.strength,
        extractedItem.possibleMatches || []
      );
    }

    // Check LASA on suggestions as well
    let triggeredLasa = lasa;
    if (!triggeredLasa && possibleMatches.length > 0) {
      for (const cand of possibleMatches) {
        const candLasa = this.checkLasaAlert(cand.medicineName);
        if (candLasa) {
          triggeredLasa = candLasa;
          break;
        }
      }
    }

    // 2. Search combined catalog for exact or high-confidence match
    let candidates = [];
    if (!isScribble && cleanQuery.length >= 2) {
      const searchCatalog = await this.getCombinedCatalog(cleanQuery);
      searchCatalog.forEach((item, idx) => {
        const simName = this.calculateSimilarity(cleanQuery, this.normalizeName(item.name));
        const simSalt = this.calculateSimilarity(cleanQuery, this.normalizeName(item.generic_name));
        const bestSim = Math.max(simName, simSalt);

        if (bestSim >= 0.6) {
          candidates.push({
            id: item.id || `benchmark-${idx}`,
            name: item.name,
            genericName: item.generic_name,
            brand: item.brand,
            dosageForm: item.dosage_form,
            strength: item.strength,
            requiresPrescription: item.requiresPrescription !== undefined ? item.requiresPrescription : true,
            similarity: bestSim
          });
        }
      });
      candidates.sort((a, b) => b.similarity - a.similarity);
    }

    const topCandidate = candidates[0] || null;
    const uncertaintyReasons = Array.isArray(extractedItem.uncertaintyReasons) ? [...extractedItem.uncertaintyReasons] : [];

    // Evaluate Missing Strength Warning
    const missingStrengthWarning = !extractedItem.strength;
    if (missingStrengthWarning && !isScribble) {
      uncertaintyReasons.push("Dosage strength not visibly legible on prescription");
    }

    // Evaluate LASA alert
    if (triggeredLasa) {
      uncertaintyReasons.push(triggeredLasa.warning);
    }

    // Determine Clinical Recognition Status and Visual State
    let recognitionStatus = extractedItem.recognitionStatus || "PENDING_PHARMACIST";
    let visualState = "AMBER";
    let finalizedMedicineName = extractedItem.medicineName;

    if (isScribble) {
      recognitionStatus = "ILLEGIBLE";
      visualState = "RED";
      finalizedMedicineName = null;
      possibleMatches = []; // Never fabricate on unreadable scribbles
    } else if (isPartial || !finalizedMedicineName || triggeredLasa || missingStrengthWarning) {
      recognitionStatus = "UNCERTAIN";
      visualState = "AMBER";
      finalizedMedicineName = null; // Keep null until verified!
    } else if (topCandidate && topCandidate.similarity >= 0.85) {
      recognitionStatus = "RECOGNIZED_UNVERIFIED";
      visualState = "GREEN";
      finalizedMedicineName = topCandidate.genericName || topCandidate.name;
    } else {
      recognitionStatus = "UNCERTAIN";
      visualState = "AMBER";
      finalizedMedicineName = null;
    }

    return {
      ...extractedItem,
      sourceText: extractedItem.sourceText || rawFragment,
      recognizedFragment: isScribble ? null : rawFragment,
      medicineName: finalizedMedicineName,
      canonicalName: topCandidate ? topCandidate.genericName || topCandidate.name : cleanQuery || null,
      normalizedCandidate: topCandidate ? topCandidate.name : null,
      matchedMedicineId: topCandidate ? topCandidate.id : null,
      matchedGenericName: topCandidate ? topCandidate.genericName : null,
      similarityScore: topCandidate ? topCandidate.similarity : 0,
      candidateMatches: candidates.slice(0, 4),
      possibleMatches,
      lasaAlert: triggeredLasa ? { warning: triggeredLasa.warning, ...triggeredLasa } : null,
      lasaDetails: triggeredLasa,
      missingStrengthWarning,
      visualState,
      recognitionStatus,
      requiresPharmacistReview: true,
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
