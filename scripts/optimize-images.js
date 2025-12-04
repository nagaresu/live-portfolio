const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, '../public/images/portfolio');
const categories = ['live', 'daily'];

// Configuration
const MAX_WIDTH = 1920;
const QUALITY = 85;

console.log('🖼️  Starting image optimization...');

let totalProcessed = 0;
let totalSkipped = 0;
let totalOriginalSize = 0;
let totalOptimizedSize = 0;

categories.forEach(category => {
    const sourceDir = path.join(portfolioDir, category);
    const targetDir = path.join(sourceDir, 'optimized');

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    if (!fs.existsSync(sourceDir)) {
        console.log(`⚠️  Source directory not found: ${sourceDir}`);
        return;
    }

    console.log(`\n📂 Processing category: ${category}`);

    // Helper to process a directory recursively
    const processDirectory = (dir, prefix = '') => {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                // Skip the optimized folder itself
                if (item === 'optimized') return;

                // Recurse with updated prefix
                // Sanitize folder name for prefix: remove special chars, replace spaces with underscores
                const cleanFolderName = item.replace(/[^a-zA-Z0-9]/g, '_');
                processDirectory(itemPath, prefix ? `${prefix}_${cleanFolderName}` : cleanFolderName);
            } else {
                if (!item.match(/\.(jpg|jpeg|png|webp)$/i)) return;

                // Construct new filename with prefix if it exists
                const newFilename = prefix ? `${prefix}_${item}` : item;
                const targetPath = path.join(targetDir, newFilename);

                // Skip if already optimized
                if (fs.existsSync(targetPath)) {
                    totalSkipped++;
                    return;
                }

                // Process image
                try {
                    totalOriginalSize += stat.size;

                    sharp(itemPath)
                        .resize(MAX_WIDTH, null, {
                            withoutEnlargement: true,
                            fit: 'inside'
                        })
                        .jpeg({ quality: QUALITY, mozjpeg: true })
                        .toFile(targetPath)
                        .then(info => {
                            totalOptimizedSize += info.size;
                            const reduction = ((stat.size - info.size) / stat.size * 100).toFixed(1);
                            console.log(`✓ Processed ${newFilename} (${reduction}% smaller)`);
                        })
                        .catch(err => {
                            console.error(`❌ Error processing ${newFilename}:`, err);
                        });

                    totalProcessed++;
                } catch (err) {
                    console.error(`❌ Error reading ${item}:`, err);
                }
            }
        });
    };

    processDirectory(sourceDir);
});

// Note: Summary stats won't be accurate immediately due to async sharp operations
console.log(`\n🚀 Optimization queued for ${totalProcessed} images.`);
console.log(`⏩ Skipped ${totalSkipped} existing images.`);
