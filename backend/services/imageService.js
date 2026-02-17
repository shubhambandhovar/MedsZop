const axios = require('axios');
const cloudinary = require('../config/cloudinary');

/**
 * Searches for a medicine image using Google Custom Search API
 * and uploads the best match to Cloudinary.
 * 
 * @param {string} medicineName - Name of the medicine
 * @param {string} brandName - Brand/Company name (optional)
 * @param {string} dosageForm - Tablet, Syrup, etc. (optional)
 * @returns {Promise<string|null>} - The Cloudinary URL or null if failed found
 */
exports.fetchAndUploadMedicineImage = async (medicineName, brandName = "", dosageForm = "") => {
    try {
        const { GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX } = process.env;

        if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_CX) {
            console.warn("⚠️ Missing Google Search API Key or CX. Skipping image fetch.");
            return null;
        }

        // 1. Build Query
        const query = `${medicineName} ${brandName} ${dosageForm} medicine package strip`.trim();
        console.log(`🔍 Searching for image: "${query}"`);

        // 2. Call Google Custom Search API
        // restricting to images, medium size, active safe search
        const googleUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_SEARCH_CX}&key=${GOOGLE_SEARCH_API_KEY}&searchType=image&imgSize=medium&safe=active&num=3`;

        const response = await axios.get(googleUrl);
        const items = response.data.items || [];

        if (items.length === 0) {
            console.log("❌ No images found for:", query);
            return null;
        }

        // 3. Select Best Image
        // Strategy: Prefer images from reputable domains if possible, or just take the first high-res one that looks like a product
        // Filter out obvious stock metrics? (Hard with just metadata)
        // We'll take the first one that is a valid image URL (jpg/png)
        const validImage = items.find(item => {
            const link = item.link.toLowerCase();
            return (link.endsWith('.jpg') || link.endsWith('.jpeg') || link.endsWith('.png') || link.endsWith('.webp')) &&
                !link.includes('placeholder') &&
                !link.includes('default');
        });

        if (!validImage) {
            console.log("❌ No valid image format found.");
            return null;
        }

        const imageUrl = validImage.link;
        console.log(`✅ Found image URL: ${imageUrl}`);

        // 4. Upload to Cloudinary
        // Cloudinary can upload directly from a remote URL!
        // We tag it as 'auto_fetched'
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
            folder: "medicines_auto",
            resource_type: "image",
            tags: ["auto_fetched", "medicine"]
        });

        console.log(`☁️  Uploaded to Cloudinary: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;

    } catch (error) {
        console.error("⚠️ Image Fetch/Upload Failed:", error.message);
        // Fail gracefully - return null to continue without image
        return null;
    }
};
