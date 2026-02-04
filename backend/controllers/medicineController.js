const Medicine = require("../models/Medicine");


// GET ALL MEDICINES
const Pharmacy = require("../models/Pharmacy");

// GET ALL MEDICINES
exports.getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { generic_name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } }
      ];
    }
    if (category) {
      query.category = category;
    }

    // 1. Fetch Global Medicines
    let globalMedicines = await Medicine.find(query).limit(50).lean();
    globalMedicines = globalMedicines.map(m => ({ ...m, id: m._id.toString() }));

    // 2. Fetch Pharmacy Medicines
    let pharmacyMedicines = [];

    // We fetch pharmacies regardless of category if there's no category or we want to search them
    const pharmacies = await Pharmacy.find({}).select("medicines name _id");

    pharmacies.forEach(p => {
      if (p.medicines) {
        p.medicines.forEach(m => {
          // 1. Search Filter
          if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
            !(m.genericName && m.genericName.toLowerCase().includes(search.toLowerCase()))) {
            return;
          }

          // 2. Category Filter (Optional logic: if searching by category, only include if mapped or allow any for now)
          // For now, if a category is selected, we only show global medicines of that category.
          // IF we wanted to support pharmacy categories, we'd need to add that field to Pharmacy schema.
          // BUT, if no category is selected, we MUST show pharmacy medicines.
          if (category) return; // Skip pharmacy meds if categorical filter is active (until we add categories to them)

          pharmacyMedicines.push({
            _id: m._id.toString(),
            id: m._id.toString(),
            name: m.name,
            generic_name: m.genericName,
            brand: m.company,
            price: m.price,
            discount_price: (m.mrp && m.mrp > m.price) ? m.price : null,
            image_url: m.image,
            requires_prescription: false,
            pharmacy_id: p._id.toString(),
            pharmacy_name: p.name,
            in_stock: m.inStock
          });
        });
      }
    });

    // Merge results
    const allMedicines = [...globalMedicines, ...pharmacyMedicines];
    res.json(allMedicines);

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
        price: m.price,
        discount_price: m.mrp > m.price ? m.price : null,
        image_url: m.image,
        requires_prescription: false,
        description: m.description,
        stock: m.inStock ? 100 : 0, // Mock stock if simplified
        pharmacy_id: pharmacy._id,
        pharmacy_name: pharmacy.name,
        manufacturer: m.company
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
