const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getAddresses, addAddress, lookupPincode, searchAddress, reverseGeocode } = require("../controllers/addressController");

router.get("/", auth, getAddresses);
router.post("/", auth, addAddress);
router.get("/pincode", auth, lookupPincode);
router.get("/search", auth, searchAddress);
router.get("/reverse", auth, reverseGeocode);

module.exports = router;
