const express = require("express");
const router = express.Router();

const Medicine = require("../models/Medicine");

router.post("/", async (req, res) => {
  try {
    const data = require("../data/sampleMedicines.json");

    await Medicine.deleteMany(); // optional (clean old)
    await Medicine.insertMany(data);

    res.json({ message: "Database Seeded Successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Seeding failed" });
  }
});

module.exports = router;
