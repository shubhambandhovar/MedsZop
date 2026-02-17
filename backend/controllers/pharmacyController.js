const Pharmacy = require("../models/Pharmacy");
const Order = require("../models/Order");
const fs = require("fs");
const csv = require("csv-parser");
const { fetchAndUploadMedicineImage } = require("../services/imageService");
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
      image,
      category,
      stock,
      expiryDate,
      batchNumber,
      manufacturer,
      requiresPrescription
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price required" });
    }

    // Auto-calculate discount if not provided
    let discount = 0;
    if (mrp && price < mrp) {
      discount = Math.round(((mrp - price) / mrp) * 100);
    }

    // AI IMAGE FETCH LOGIC
    // If no image provided, we trigger a background job to fetch it
    let isAutoImage = false;
    let finalImage = image;

    if (!finalImage) {
      // We'll start the process but NOT await it to keep response fast?
      // Actually, for single add, waiting 1-2s is better UX than refresh lag.
      // However, user requirement says 'async task', 'never block'.
      // We'll follow the rule strict: Background Process.

      // We push the medicine with empty image first to get an ID.
    }

    const newMedicine = {
      name,
      price,
      genericName,
      company,
      mrp,
      discount,
      description,
      image: finalImage || "", // Placeholder
      category,
      stock: stock || 0,
      expiryDate,
      batchNumber,
      manufacturer,
      requiresPrescription: requiresPrescription || false,
      inStock: stock > 0,
      isAutoImage: false
    };

    pharmacy.medicines.push(newMedicine);
    await pharmacy.save();

    // BACKGROUND TASK: Fetch Image if missing
    if (!finalImage) {
      // We need to find the newly added medicine to update it
      // The last one in the array is usually the new one, but let's be safe
      // Actually, we can just use the ID if we re-fetch? 
      // Mongoose subdocs have _id. We can get it from pharmacy.medicines[length-1]
      const addedMed = pharmacy.medicines[pharmacy.medicines.length - 1];

      // Fire and forget (Async)
      fetchAndUploadMedicineImage(name, company, category)
        .then(async (url) => {
          if (url) {
            // Re-fetch to minimize race conditions
            const freshPharmacy = await Pharmacy.findById(pharmacy._id);
            const medToUpdate = freshPharmacy.medicines.id(addedMed._id);
            if (medToUpdate) {
              medToUpdate.image = url;
              medToUpdate.isAutoImage = true;
              await freshPharmacy.save();
              console.log(`📸 Auto-assigned image for ${name}`);
            }
          }
        })
        .catch(err => console.error("Background Image Fetch Error:", err));
    }

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

    // New fields
    if (updates.category) medicine.category = updates.category;
    if (updates.stock !== undefined) medicine.stock = updates.stock;
    if (updates.expiryDate) medicine.expiryDate = updates.expiryDate;
    if (updates.batchNumber) medicine.batchNumber = updates.batchNumber;
    if (updates.manufacturer) medicine.manufacturer = updates.manufacturer;
    if (updates.requiresPrescription !== undefined) medicine.requiresPrescription = updates.requiresPrescription;

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
    if (updates.inStock !== undefined) {
      medicine.inStock = updates.inStock;
    } else if (updates.stock !== undefined) {
      medicine.inStock = updates.stock > 0;
    }

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
              // Try parsing DD-MM-YYYY first (common in India/Excel)
              const dmyParams = cleanRow.expiry_date.split(/[-/]/);
              if (dmyParams.length === 3 && dmyParams[0].length === 2 && dmyParams[2].length === 4) {
                // Assume DD-MM-YYYY or DD/MM/YYYY
                const day = parseInt(dmyParams[0]);
                const month = parseInt(dmyParams[1]) - 1; // 0-indexed
                const year = parseInt(dmyParams[2]);
                expiryDate = new Date(year, month, day);
              } else {
                // Fallback to standard parsing (YYYY-MM-DD or MM/DD/YYYY)
                expiryDate = new Date(cleanRow.expiry_date);
              }

              // Set to end of day to avoid timezone issues making "today" look like "past"
              if (expiryDate) {
                expiryDate.setHours(23, 59, 59, 999);
              }

              if (!expiryDate || isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
                console.log(`Expiry Invalid: Raw: ${cleanRow.expiry_date}, Parsed: ${expiryDate}`);
                skippedCount++;
                errors.push(`Skipped: Expiry date must be future for ${cleanRow.medicine_name} (Date: ${cleanRow.expiry_date})`);
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

          // ================= BACKGROUND JOB: IMAGE FETCHING =================
          // Identify medicines without images that were just added/updated
          // Ideally we track which ones need images.
          // For simplicity in this flow, we'll scan the pharmacy's medicines 
          // that have NO image and were updated recently? 
          // Or just use the 'results' list we processed.

          process.nextTick(async () => {
            console.log("🚀 Starting Background Image Fetch for Bulk Upload...");
            try {
              const freshPharmacy = await Pharmacy.findOne({ user_id: req.user.id });
              if (!freshPharmacy) return;

              let updatesMade = false;

              // We loop through the CSV results again to find matches in DB
              for (const row of results) {
                const cleanName = row.medicine_name?.trim();
                if (!cleanName) continue;

                // Find in DB
                const med = freshPharmacy.medicines.find(m => m.name.toLowerCase() === cleanName.toLowerCase());

                // If found, has no image, and is NOT manually set (or just check empty)
                // We only fetch if image is missing.
                if (med && !med.image) {
                  const brand = row.brand_name || row.manufacturer || "";
                  const category = row.category || "";

                  // Rate limiting? Google API might block us if 100 requests at once.
                  // We should process sequentially with a small delay.
                  await new Promise(r => setTimeout(r, 1000)); // 1s delay

                  const url = await fetchAndUploadMedicineImage(cleanName, brand, category);
                  if (url) {
                    med.image = url;
                    med.isAutoImage = true;
                    updatesMade = true;
                  }
                }
              }

              if (updatesMade) {
                await freshPharmacy.save();
                console.log("✅ Bulk Image Auto-Fetch Completed & Saved.");
              } else {
                console.log("ℹ️ No images needed fetching or all failed.");
              }
            } catch (bgErr) {
              console.error("Background Bulk Image Error:", bgErr);
            }
          });
          // ==============================================================

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
