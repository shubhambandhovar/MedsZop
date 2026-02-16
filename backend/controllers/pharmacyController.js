const Pharmacy = require("../models/Pharmacy");
const Order = require("../models/Order");
const fs = require("fs");
const csv = require("csv-parser");
exports.registerPharmacy = async (req, res) => {
  const pharmacy = await Pharmacy.create({
    ...req.body,
    user_id: req.user.id,
    verified: false
  });

  res.json(pharmacy);
};

exports.getDashboard = async (req, res) => {
  try {
    let pharmacy = await Pharmacy.findOne({ user_id: req.user.id });

    if (!pharmacy && req.user.role === "pharmacy") {
      // Auto-create if missing for pharmacy users
      const User = require("../models/User");
      const user = await User.findById(req.user.id);
      pharmacy = await Pharmacy.create({
        user_id: req.user.id,
        name: user?.name || "My Pharmacy",
        verified: false,
        medicines: []
      });
    }

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy profile not found. Please log in as a pharmacy." });
    }

    // 1. Get truly assigned orders for revenue/stats
    const pharmacyIdStr = pharmacy._id.toString();
    const assignedOrders = await Order.find({ pharmacy_id: pharmacyIdStr });

    // 2. Get pool orders (Global orders that are not yet assigned)
    const poolOrders = await Order.find({ pharmacy_id: null, order_status: "pending" });

    const stats = {
      medicines_count: pharmacy.medicines?.length || 0,
      total_orders: assignedOrders.length,
      pending_orders: assignedOrders.filter(o => o.order_status === "pending").length + poolOrders.length,
      total_revenue: assignedOrders.reduce((sum, o) => sum + o.total, 0)
    };

    res.json({ stats, medicines: pharmacy.medicines, pharmacy });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPharmacyOrders = async (req, res) => {
  try {
    // Find the pharmacy for the logged-in user
    let pharmacy = await Pharmacy.findOne({ user_id: req.user.id });
    if (!pharmacy && req.user.role === "pharmacy") {
      const User = require("../models/User");
      const user = await User.findById(req.user.id);
      pharmacy = await Pharmacy.create({
        user_id: req.user.id,
        name: user?.name || "My Pharmacy",
        verified: false,
        medicines: []
      });
    }
    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy profile not found" });
    }
    // Find orders for this pharmacy
    // Find orders for this pharmacy OR unassigned pool orders
    const orders = await Order.find({
      $or: [
        { pharmacy_id: pharmacy._id.toString() },
        { pharmacy_id: null, order_status: "pending" }
      ]
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.addMedicine = async (req, res) => {
  try {
    let pharmacy = await Pharmacy.findOne({ user_id: req.user.id });

    if (!pharmacy && req.user.role === "pharmacy") {
      const User = require("../models/User");
      const user = await User.findById(req.user.id);
      pharmacy = await Pharmacy.create({
        user_id: req.user.id,
        name: user?.name || "My Pharmacy",
        verified: false,
        medicines: []
      });
    }

    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy profile not found" });
    }

    const {
      name,
      price,
      genericName,
      company,
      mrp,
      description,
      image
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    // Auto-calculate discount if not provided
    let discount = 0;
    if (mrp && price < mrp) {
      discount = Math.round(((mrp - price) / mrp) * 100);
    }

    pharmacy.medicines.push({
      name,
      price,
      genericName,
      company,
      mrp,
      discount,
      description,
      image
    });
    await pharmacy.save();

    res.json({ message: "Medicine added successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });

    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    const medicine = pharmacy.medicines.id(id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });

    // Update fields
    if (updates.name) medicine.name = updates.name;
    if (updates.price) medicine.price = updates.price;
    if (updates.company) medicine.company = updates.company;
    if (updates.genericName) medicine.genericName = updates.genericName;
    if (updates.description) medicine.description = updates.description;
    if (updates.image) medicine.image = updates.image;
    if (updates.mrp) medicine.mrp = updates.mrp;

    // Recalculate discount
    if (updates.mrp || updates.price) {
      const m = updates.mrp || medicine.mrp;
      const p = updates.price || medicine.price;
      if (m && p && m > p) {
        medicine.discount = Math.round(((m - p) / m) * 100);
      } else {
        medicine.discount = 0;
      }
    }

    // Stock management
    if (updates.inStock !== undefined) medicine.inStock = updates.inStock;

    await pharmacy.save();
    res.json({ message: "Medicine updated", medicine });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    pharmacy.medicines.pull(req.params.id);
    await pharmacy.save();

    res.json({ message: "Medicine deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });
    if (!pharmacy) return res.status(404).json({ message: "Pharmacy not found" });

    // Update Pharmacy Fields
    if (updates.store_name) pharmacy.name = updates.store_name;
    if (updates.pharmacist_name) pharmacy.pharmacist_name = updates.pharmacist_name;
    if (updates.address) pharmacy.address = updates.address;
    if (updates.license_number) pharmacy.license_number = updates.license_number;

    await pharmacy.save();

    // Update User Name (for top right display)
    if (updates.pharmacist_name || updates.name) {
      const User = require("../models/User");
      await User.findByIdAndUpdate(req.user.id, {
        name: updates.pharmacist_name || updates.name
      });
    }

    res.json({ message: "Profile updated", pharmacy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkUploadMedicines = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a CSV file" });
  }

  const results = [];
  const errors = [];
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    const pharmacy = await Pharmacy.findOne({ user_id: req.user.id });

    if (!pharmacy) {
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Pharmacy profile not found" });
    }

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          // Process results
          for (const row of results) {
            // Trim keys
            const cleanRow = {};
            Object.keys(row).forEach(key => {
              cleanRow[key.trim()] = row[key].trim();
            });

            // Validate required
            if (!cleanRow.medicine_name || !cleanRow.mrp || !cleanRow.selling_price || !cleanRow.stock_quantity) {
              skippedCount++;
              errors.push(`Skipped: Missing required fields for ${cleanRow.medicine_name || "Unknown row"}`);
              continue;
            }

            // Numeric check
            const mrp = parseFloat(cleanRow.mrp);
            const price = parseFloat(cleanRow.selling_price);
            const stock = parseInt(cleanRow.stock_quantity);

            if (isNaN(mrp) || isNaN(price) || isNaN(stock)) {
              skippedCount++;
              errors.push(`Skipped: Invalid numbers for ${cleanRow.medicine_name}`);
              continue;
            }

            // Expiry check
            let expiryDate = null;
            if (cleanRow.expiry_date) {
              expiryDate = new Date(cleanRow.expiry_date);
              if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
                // Warn but maybe allow? Prompt says "Validate expiry date (must be future date)"
                skippedCount++;
                errors.push(`Skipped: Expiry date must be future for ${cleanRow.medicine_name}`);
                continue;
              }
            }

            // Create object
            const medData = {
              name: cleanRow.medicine_name,
              genericName: cleanRow.composition,
              category: cleanRow.category,
              company: cleanRow.brand_name,
              manufacturer: cleanRow.manufacturer,
              mrp: mrp,
              price: price, // selling_price
              stock: stock,
              expiryDate: expiryDate,
              batchNumber: cleanRow.batch_number,
              requiresPrescription: cleanRow.prescription_required?.toLowerCase() === "yes",
              inStock: stock > 0,
              discount: 0
            };

            if (mrp > price) {
              medData.discount = Math.round(((mrp - price) / mrp) * 100);
            }

            // Check existence
            const existingIndex = pharmacy.medicines.findIndex(
              m => m.name.toLowerCase() === medData.name.toLowerCase()
            );

            if (existingIndex > -1) {
              // Update
              const existing = pharmacy.medicines[existingIndex];
              existing.stock = medData.stock;
              existing.price = medData.price;
              existing.mrp = medData.mrp;
              existing.expiryDate = medData.expiryDate;
              existing.batchNumber = medData.batchNumber;
              existing.inStock = medData.inStock;
              existing.discount = medData.discount;
              updatedCount++;
            } else {
              // Add
              pharmacy.medicines.push(medData);
              addedCount++;
            }
          }

          await pharmacy.save();
          if (req.file.path) fs.unlinkSync(req.file.path);

          res.json({
            message: "Bulk upload processed",
            summary: {
              total: results.length,
              added: addedCount,
              updated: updatedCount,
              skipped: skippedCount,
              errors: errors
            }
          });

        } catch (innerErr) {
          console.error("CSV Processing Error:", innerErr);
          if (req.file.path) fs.unlinkSync(req.file.path);
          res.status(500).json({ error: "Failed to process CSV data" });
        }
      });

  } catch (err) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
};
