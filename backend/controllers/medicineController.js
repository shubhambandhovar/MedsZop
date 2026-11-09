const Medicine = require("../models/Medicine");
const Pharmacy = require("../models/Pharmacy");
const { escapeRegex, parsePagination } = require("../middleware/sanitizeMiddleware");

// GET ALL MEDICINES (Phase 9D Hardened: Safe Regex Escaping & Bounded Pagination)
exports.getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 50, 100);

    let query = {};
    const safeSearch = typeof search === "string" ? escapeRegex(search.trim()) : "";

    if (safeSearch) {
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { generic_name: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } }
      ];
    }
    if (category && typeof category === "string") {
      query.category = category.trim();
    }

    // 1. Fetch Global Medicines
    let globalMedicines = await Medicine.find(query).limit(100).lean();
    globalMedicines = globalMedicines.map(m => ({ ...m, id: m._id.toString() }));

    // 2. Fetch Pharmacy Medicines
    let pharmacyMedicines = [];

    // We fetch pharmacies regardless of category if there's no category or we want to search them
    const pharmacies = await Pharmacy.find({}).select("medicines name _id").lean();

    pharmacies.forEach(p => {
      if (p.medicines) {
        p.medicines.forEach(m => {
          // 1. Search Filter (Safe case-insensitive substring match)
          if (safeSearch) {
            const nameMatch = m.name && m.name.toLowerCase().includes(search.toLowerCase());
            const genericMatch = m.genericName && m.genericName.toLowerCase().includes(search.toLowerCase());
            if (!nameMatch && !genericMatch) return;
          }

          if (category) return; // Skip pharmacy meds if categorical filter is active

          pharmacyMedicines.push({
            _id: m._id.toString(),
            id: m._id.toString(),
            name: m.name,
            generic_name: m.genericName,
            brand: m.company,
            price: (m.mrp && m.mrp > m.price) ? m.mrp : m.price,
            discount_price: (m.mrp && m.mrp > m.price) ? m.price : null,
            image_url: m.image,
            requires_prescription: m.requiresPrescription || false,
            pharmacy_id: p._id.toString(),
            pharmacy_name: p.name,
            in_stock: m.inStock,
            category: m.category
          });
        });
      }
    });

    // Merge results
    const allMedicines = [...globalMedicines, ...pharmacyMedicines];
    const totalCount = allMedicines.length;

    // Apply pagination slice if paginated
    const paginatedMedicines = allMedicines.slice(skip, skip + limit);

    // Standard pagination response headers
    res.setHeader("X-Total-Count", totalCount);
    res.setHeader("X-Page", page);
    res.setHeader("X-Limit", limit);
    res.setHeader("X-Total-Pages", Math.ceil(totalCount / limit) || 1);

    // Return array to preserve full backward compatibility with frontend
    res.json(paginatedMedicines);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET SINGLE MEDICINE
// GET SINGLE MEDICINE
exports.getMedicineById = async (req, res) => {
  try {
    // 1. Check Global Medicines
    let medicine = await Medicine.findById(req.params.id).lean();

    if (medicine) {
      medicine.id = medicine._id.toString();
      return res.json(medicine);
    }

    // 2. Check Pharmacy Medicines if not found
    const pharmacy = await Pharmacy.findOne({ "medicines._id": req.params.id }, { "medicines.$": 1, name: 1 });

    if (pharmacy && pharmacy.medicines && pharmacy.medicines.length > 0) {
      const m = pharmacy.medicines[0];
      medicine = {
        _id: m._id,
        id: m._id,
        name: m.name,
        generic_name: m.genericName,
        brand: m.company,
        brand: m.company,
        price: (m.mrp && m.mrp > m.price) ? m.mrp : m.price,
        discount_price: (m.mrp && m.mrp > m.price) ? m.price : null,
        image_url: m.image,
        requires_prescription: m.requiresPrescription || false,
        description: m.description,
        stock: m.stock !== undefined ? m.stock : (m.inStock ? 100 : 0),
        pharmacy_id: pharmacy._id,
        pharmacy_name: pharmacy.name,
        manufacturer: m.company,
        category: m.category // Also expose category
      };
      return res.json(medicine);
    }

    return res.status(404).json({ message: "Medicine not found" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// CREATE MEDICINE (Admin / Pharmacy)
exports.createMedicine = async (req, res) => {

  try {

    const medicine = await Medicine.create({
      ...req.body,
      pharmacy_id: req.user.id
    });

    res.status(201).json(medicine);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// GET MEDICINE CATEGORIES
exports.getCategories = async (req, res) => {
  try {
    const categories = await Medicine.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
