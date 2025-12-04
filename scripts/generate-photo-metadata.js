const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const portfolioDir = path.join(__dirname, '../public/images/portfolio');
const metadataPath = path.join(__dirname, '../src/data/photo-metadata.json');

// Load existing metadata to preserve EXIF data
let existingMetadata = [];
if (fs.existsSync(metadataPath)) {
    existingMetadata = require(metadataPath);
}

// Helper to get image dimensions using sips (macOS)
const getDimensions = (filePath) => {
    try {
        const output = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}"`).toString();
        const widthMatch = output.match(/pixelWidth: (\d+)/);
        const heightMatch = output.match(/pixelHeight: (\d+)/);

        if (widthMatch && heightMatch) {
            return {
                width: parseInt(widthMatch[1]),
                height: parseInt(heightMatch[1])
            };
        }
    } catch (err) {
        console.error(`Error getting dimensions for ${filePath}:`, err.message);
    }
    return null;
};

// Categories to scan
const categories = ['live', 'daily'];
const allPhotos = [];

console.log('📸 Generating metadata from folders...');

categories.forEach(category => {
    const categoryDir = path.join(portfolioDir, category);

    const processDirectory = (dir, isOptimizedDir = false) => {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir);

        items.forEach(item => {
            if (item.startsWith('.')) return; // Skip hidden files

            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Recursively process subdirectories
                const isOptimized = item === 'optimized' || isOptimizedDir;
                processDirectory(fullPath, isOptimized);
            } else if (item.match(/\.(jpg|jpeg|png|webp)$/i)) {
                // Skip if this is a file in the parent directory and an optimized version exists
                if (!isOptimizedDir) {
                    const optimizedPath = path.join(dir, 'optimized', item);
                    if (fs.existsSync(optimizedPath)) {
                        console.log(`   Skipping ${item}, using optimized version instead`);
                        return; // Skip this file, use optimized version
                    }
                }

                // Construct web-accessible path
                // fullPath: /Users/.../public/images/portfolio/live/subdir/image.jpg
                // webPath: /images/portfolio/live/subdir/image.jpg
                const relativePath = path.relative(path.join(__dirname, '../public'), fullPath);
                const src = '/' + relativePath.split(path.sep).join('/');

                // Check if we already have metadata for this file (by filename)
                const existing = existingMetadata.find(p => path.basename(p.src) === item);

                let photoData = {
                    src,
                    alt: existing?.alt || `Portfolio photo ${item}`,
                    category, // Set category based on folder
                    orientation: existing?.orientation || 'horizontal',
                    meta: existing?.meta || {}
                };

                // If orientation is missing or we want to re-verify
                if (!existing) {
                    const dims = getDimensions(fullPath);
                    if (dims) {
                        photoData.orientation = dims.height > dims.width ? 'vertical' : 'horizontal';
                    }
                }

                allPhotos.push(photoData);
            }
        });
    };

    console.log(`Processing category: ${category}`);
    processDirectory(categoryDir, false);
});

console.log(`✅ Generated metadata for ${allPhotos.length} photos`);

// Save metadata
fs.writeFileSync(metadataPath, JSON.stringify(allPhotos, null, 2));
console.log(`💾 Saved to ${metadataPath}`);
