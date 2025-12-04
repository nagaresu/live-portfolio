const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, '../public/images/portfolio');
const categories = ['live', 'daily'];

// Configuration for thumbnails
const THUMB_WIDTH = 600; // Sufficient for grid columns
const QUALITY = 80;

console.log('🖼️  Starting thumbnail generation...');

let totalProcessed = 0;
let totalSkipped = 0;

categories.forEach(category => {
    const sourceDir = path.join(portfolioDir, category, 'optimized');
    const targetDir = path.join(portfolioDir, category, 'thumbnails');

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    if (!fs.existsSync(sourceDir)) {
        console.log(`⚠️  Source directory not found: ${sourceDir}`);
        return;
    }

    console.log(`\n📂 Processing category: ${category}`);

    const items = fs.readdirSync(sourceDir);

    items.forEach(item => {
        if (!item.match(/\.(jpg|jpeg|png|webp)$/i)) return;

        const sourcePath = path.join(sourceDir, item);
        const targetPath = path.join(targetDir, item);

        // Skip if already exists
        if (fs.existsSync(targetPath)) {
            totalSkipped++;
            return;
        }

        // Process image
        try {
            sharp(sourcePath)
                .resize(THUMB_WIDTH, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .jpeg({ quality: QUALITY, mozjpeg: true })
                .toFile(targetPath)
                .then(info => {
                    console.log(`✓ Created thumbnail for ${item} (${(info.size / 1024).toFixed(1)} KB)`);
                })
                .catch(err => {
                    console.error(`❌ Error processing ${item}:`, err);
                });

            totalProcessed++;
        } catch (err) {
            console.error(`❌ Error reading ${item}:`, err);
        }
    });
});

// Note: Summary stats won't be accurate immediately due to async sharp operations
console.log(`\n🚀 Thumbnail generation queued for ${totalProcessed} images.`);
console.log(`⏩ Skipped ${totalSkipped} existing thumbnails.`);
