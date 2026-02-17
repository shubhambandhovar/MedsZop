const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

// Load env vars if not already loaded (though server.js does it, this is safe)
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
