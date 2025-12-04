const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, '../public/images/portfolio');
const liveDir = path.join(portfolioDir, 'live');
const dailyDir = path.join(portfolioDir, 'daily');
const liveOptimizedDir = path.join(liveDir, 'optimized');
const dailyOptimizedDir = path.join(dailyDir, 'optimized');

// Helper to move file
const moveFile = (src, dest) => {
    try {
        if (fs.existsSync(dest)) {
            console.log(`⚠️  Destination exists, skipping: ${path.basename(src)}`);
            return;
        }
        fs.renameSync(src, dest);
    } catch (err) {
        console.error(`Error moving ${src}:`, err);
    }
};

console.log('📦 Moving all Live photos to Daily...');

// 1. Move Original Images
if (fs.existsSync(liveDir)) {
    const files = fs.readdirSync(liveDir);
    let count = 0;
    files.forEach(file => {
        const srcPath = path.join(liveDir, file);
        if (fs.statSync(srcPath).isDirectory()) return; // Skip optimized folder

        moveFile(srcPath, path.join(dailyDir, file));
        count++;
    });
    console.log(`   Moved ${count} original photos.`);
}

// 2. Move Optimized Images
if (fs.existsSync(liveOptimizedDir)) {
    const files = fs.readdirSync(liveOptimizedDir);
    let count = 0;
    files.forEach(file => {
        const srcPath = path.join(liveOptimizedDir, file);
        moveFile(srcPath, path.join(dailyOptimizedDir, file));
        count++;
    });
    console.log(`   Moved ${count} optimized photos.`);
}

console.log('✅ Move complete. All photos are now in Daily.');
