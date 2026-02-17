const dotenv = require('dotenv');
dotenv.config();

const { fetchAndUploadMedicineImage } = require('./services/imageService');

async function testFetch() {
    console.log("Testing Image Fetch...");
    console.log("Google Key Present:", !!process.env.GOOGLE_SEARCH_API_KEY);
    console.log("Google CX Present:", !!process.env.GOOGLE_SEARCH_CX);
    console.log("Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);

    const medicineName = "Zincovit";
    const brand = "Apex Laboratories";
    const category = "Tablet";

    console.log(`Fetching for: ${medicineName} (${brand})`);

    try {
        const url = await fetchAndUploadMedicineImage(medicineName, brand, category);
        console.log("Result URL:", url);
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testFetch();
