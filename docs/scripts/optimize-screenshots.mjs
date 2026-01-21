import { mkdir, readdir, stat } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration constants
const SOURCE_DIR = join(__dirname, '../public/screenshots');
const OUTPUT_DIR = join(__dirname, '../public/optimized/screenshots');
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 85;

/**
 * Optimize a single screenshot image
 * @param {string} inputPath - Path to source image
 * @param {string} outputPath - Path for optimized output
 * @returns {Promise<{inputSize: number, outputSize: number}>} File size stats
 */
async function optimizeScreenshot(inputPath, outputPath) {
  // Get input file size
  const inputStats = await stat(inputPath);
  const inputSize = inputStats.size;

  // Process image with Sharp
  await sharp(inputPath)
    .resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 6,
    })
    .toFile(outputPath);

  // Get output file size
  const outputStats = await stat(outputPath);
  const outputSize = outputStats.size;

  return { inputSize, outputSize };
}

/**
 * Main optimization function
 */
async function main() {
  try {
    // Create output directory if it doesn't exist
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Read all files from source directory
    const files = await readdir(SOURCE_DIR);

    // Filter to image files only
    const imageFiles = files.filter((file) => {
      const ext = extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg'].includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('No screenshots found to optimize.');
      return;
    }

    console.log(
      `Optimizing ${imageFiles.length} screenshot${imageFiles.length !== 1 ? 's' : ''}...`,
    );

    let totalInputSize = 0;
    let totalOutputSize = 0;

    // Process each image
    for (const file of imageFiles) {
      const inputPath = join(SOURCE_DIR, file);
      const outputFile = basename(file, extname(file)) + '.webp';
      const outputPath = join(OUTPUT_DIR, outputFile);

      try {
        const { inputSize, outputSize } = await optimizeScreenshot(inputPath, outputPath);
        const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);

        totalInputSize += inputSize;
        totalOutputSize += outputSize;

        console.log(`✓ ${file} → ${outputFile} (${reduction}% reduction)`);
      } catch (error) {
        console.error(`✗ Failed to optimize ${file}: ${error.message}`);
      }
    }

    // Summary
    const totalReduction = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);
    console.log(`\nOptimization complete!`);
    console.log(
      `Total size reduction: ${totalReduction}% (${(totalInputSize / 1024 / 1024).toFixed(2)}MB → ${(totalOutputSize / 1024 / 1024).toFixed(2)}MB)`,
    );
  } catch (error) {
    console.error(`Error during optimization: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
main();
