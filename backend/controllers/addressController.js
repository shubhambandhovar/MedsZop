const User = require("../models/User");

// Get all addresses
exports.getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.addresses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add new address
exports.addAddress = async (req, res) => {
    try {
        console.log("Adding address for user:", req.user.id);
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Address payload received:", req.body);
        const { name, mobile, addressLine1, addressLine2, city, state, pincode, landmark, addressType, coordinates } = req.body;

        if (!name || !mobile || !addressLine1 || !city || !state || !pincode) {
            return res.status(400).json({ message: "Missing required address fields" });
        }

        const newAddressData = {
            name: name.trim(),
            mobile: mobile.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: (addressLine2 || "").trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            landmark: (landmark || "").trim(),
            addressType: addressType || "Home",
            coordinates: coordinates || { lat: 0, lon: 0 }
        };

        user.addresses.push(newAddressData);
        await user.save();

        const addedAddress = user.addresses[user.addresses.length - 1];
        console.log("Address added successfully:", addedAddress._id);
        res.status(201).json(addedAddress);
    } catch (err) {
        console.error("Critical Add Address Error:", err);
        res.status(500).json({ message: `Server Error: ${err.message}` });
    }
};
const axios = require("axios");
exports.lookupPincode = async (req, res) => {
    try {
        const { pincode } = req.query;
        if (!pincode) return res.status(400).json({ message: "Pincode is required" });

        const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch pincode details" });
    }
};

exports.searchAddress = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: "Query is required" });

        const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=10`,
            {
                headers: {
                    'User-Agent': 'MedsZop-Healthcare-App/1.0 (contact: support@medszop.com)'
                },
                timeout: 10000
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error("OSM Proxy Error:", error.message);
        res.status(500).json({ error: "Failed to fetch address suggestions" });
    }
};

exports.reverseGeocode = async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) return res.status(400).json({ message: "Lat and Lon are required" });

        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'MedsZop-Healthcare-App/1.0 (contact: support@medszop.com)'
                },
                timeout: 10000
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error("Reverse Geocode Error:", error.message);
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ error: "Location detection timed out" });
        }
        res.status(500).json({ error: "Failed to fetch address from location" });
    }
};
