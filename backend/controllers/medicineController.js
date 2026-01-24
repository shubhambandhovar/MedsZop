const Medicine = require("../models/Medicine");


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

    const medicines = await Medicine.find(query).limit(50);

    res.json(medicines);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET SINGLE MEDICINE
exports.getMedicineById = async (req, res) => {

  try {

    const medicine = await Medicine.findById(req.params.id);

    if (!medicine)
      return res.status(404).json({ message: "Medicine not found" });

    res.json(medicine);

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
