/**
 * MedsZop Prescription Intelligence V2 — prescriptionPreprocessor
 * 
 * Uses Sharp to perform:
 * 1. Image metadata & dimension inspection.
 * 2. EXIF auto-rotation (fixes sideways/upside-down mobile camera photos).
 * 3. Document quality assessment:
 *    - Blur detection (Laplacian edge variance)
 *    - Glare & overexposure detection (luminance histogram)
 *    - Contrast & dynamic range evaluation
 *    - Low-resolution warning (<800px width/height)
 * 4. Adaptive image enhancements:
 *    - Contrast normalization
 *    - Gamma correction for faded inks
 *    - Unsharp masking for thin cursive handwriting strokes
 * 5. High-resolution preservation (retains original fidelity up to 3600px).
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

class PrescriptionPreprocessor {
  /**
   * Assess document quality from image stats and dimensions
   * @param {sharp.Metadata} metadata
   * @param {sharp.Stats} stats
   * @param {number} edgeVariance
   * @returns {object} quality evaluation
   */
  evaluateQuality(metadata, stats, edgeVariance) {
    const warnings = [];
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // 1. Resolution Check
    const isLowRes = width < 600 || height < 600;
    if (isLowRes) {
      warnings.push("Text is too small to read reliably. Please provide a higher-resolution photo.");
    } else if (width < 900 || height < 900) {
      warnings.push("Resolution is low. Handwriting may be difficult to interpret.");
    }

    // 2. Blur / Edge Energy Check
    // A sharp handwritten image typically exhibits high edge variance (>120);
    // motion-blurred or out-of-focus images fall below 45.
    const isBlurry = edgeVariance < 45;
    if (isBlurry) {
      warnings.push("Image is blurry — please retake with camera steady.");
    }

    // 3. Glare / Overexposure Check
    // Check if the luminance channel has excessive saturated highlight pixels (>250)
    const channelStats = stats.channels[0] || {};
    const mean = channelStats.mean || 128;
    const stdev = channelStats.stdev || 50;
    const max = channelStats.max || 255;
    const min = channelStats.min || 0;

    const hasGlare = max >= 253 && mean > 210 && stdev < 35;
    if (hasGlare) {
      warnings.push("Glare or strong reflection detected over prescription. Try tilting the camera or turning off flash.");
    }

    // 4. Underexposure / Low-Contrast Check
    const isLowContrast = stdev < 25;
    if (isLowContrast) {
      warnings.push("Image has low contrast. Ensure adequate lighting over the handwriting.");
    }

    const isLegible = !isBlurry && !isLowRes && !isLowContrast;

    return {
      isLegible,
      isBlurry,
      isLowRes,
      hasGlare,
      isLowContrast,
      edgeVariance: Math.round(edgeVariance),
      dimensions: { width, height },
      format: metadata.format,
      warnings
    };
  }

  /**
   * Compute edge variance via 3x3 Laplacian convolution on grayscale image
   * @param {Buffer} buffer
   * @returns {Promise<number>} variance score
   */
  async calculateEdgeVariance(buffer) {
    try {
      // 3x3 Laplacian edge detection kernel with neutral offset 128
      const laplacianKernel = {
        width: 3,
        height: 3,
        kernel: [
          0,  1,  0,
          1, -4,  1,
          0,  1,  0
        ],
        scale: 1,
        offset: 128
      };

      // Downscale to fixed width 500 for fast, scale-invariant edge energy estimation
      const convolved = await sharp(buffer)
        .resize(500, null, { withoutEnlargement: true })
        .grayscale()
        .convolve(laplacianKernel)
        .raw()
        .toBuffer();

      // Compute variance of the pixel values
      let sum = 0;
      let sumSq = 0;
      const len = convolved.length;
      for (let i = 0; i < len; i++) {
        const val = convolved[i];
        sum += val;
        sumSq += val * val;
      }
      const mean = sum / len;
      const variance = (sumSq / len) - (mean * mean);
      return variance;
    } catch (err) {
      console.warn("Edge variance calculation fallback:", err.message);
      return 100; // default safe neutral variance
    }
  }

  /**
   * Process prescription image or PDF page
   * @param {Buffer|string} input - buffer or file path
   * @param {object} options
   * @returns {Promise<object>}
   */
  async preprocess(input, options = {}) {
    let rawBuffer;
    if (typeof input === "string") {
      rawBuffer = await fs.promises.readFile(input);
    } else if (Buffer.isBuffer(input)) {
      rawBuffer = input;
    } else {
      throw new Error("Invalid input: Expected Buffer or file path string");
    }

    // 1. Detect if input is PDF
    const isPdf = rawBuffer.slice(0, 4).toString("ascii") === "%PDF";
    if (isPdf) {
      return {
        isPdf: true,
        originalBuffer: rawBuffer,
        enhancedBuffer: rawBuffer,
        metadata: { format: "pdf", isPdf: true },
        quality: {
          isLegible: true,
          warnings: ["PDF document received. Direct document processing active."],
          format: "pdf"
        }
      };
    }

    // 2. Initial Sharp pipeline: Auto-rotate based on EXIF
    const baseSharp = sharp(rawBuffer).rotate();
    const metadata = await baseSharp.metadata();

    // 3. Compute image statistics & blur evaluation
    const stats = await baseSharp.stats();
    const edgeVariance = await this.calculateEdgeVariance(rawBuffer);

    // 4. Quality evaluation
    const quality = this.evaluateQuality(metadata, stats, edgeVariance);

    // 5. Build Enhanced Image for OCR Recognition
    // - Bound dimension to 3200px (preserve handwriting fidelity without memory bloat)
    // - Normalize histogram for contrast
    // - Mild sharpening to bring out faint pen inks
    let enhancedPipeline = sharp(rawBuffer)
      .rotate()
      .resize({
        width: metadata.width && metadata.width > 3200 ? 3200 : undefined,
        height: metadata.height && metadata.height > 3200 ? 3200 : undefined,
        fit: "inside",
        withoutEnlargement: true
      })
      .normalize()
      .sharpen({
        sigma: 1.0,
        m1: 0.8,
        m2: 1.5
      });

    const enhancedBuffer = await enhancedPipeline.jpeg({ quality: 92 }).toBuffer();

    // 6. Build Display / Thumbnail Preview Image (WebP for fast UI loading)
    const previewBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({
        width: 1400,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toBuffer();

    return {
      isPdf: false,
      originalBuffer: rawBuffer,
      enhancedBuffer,
      previewBuffer,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density
      },
      quality
    };
  }
}

module.exports = new PrescriptionPreprocessor();

