const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, '../public/images/portfolio');
const optimizedDir = path.join(portfolioDir, 'optimized');

// Define target directories
const liveDir = path.join(portfolioDir, 'live');
const dailyDir = path.join(portfolioDir, 'daily');
const liveOptimizedDir = path.join(liveDir, 'optimized');
const dailyOptimizedDir = path.join(dailyDir, 'optimized');

// Create directories if they don't exist
[liveDir, dailyDir, liveOptimizedDir, dailyOptimizedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Helper to move file
const moveFile = (src, dest) => {
    try {
        fs.renameSync(src, dest);
        // console.log(`Moved: ${path.basename(src)} -> ${dest}`);
    } catch (err) {
        console.error(`Error moving ${src}:`, err);
    }
};

// 1. Process Original Images (in portfolioDir root)
console.log('📦 Processing original images...');
const files = fs.readdirSync(portfolioDir);
let movedLive = 0;
let movedDaily = 0;

files.forEach(file => {
    const filePath = path.join(portfolioDir, file);

    // Skip directories
    if (fs.statSync(filePath).isDirectory()) return;

    // Skip non-image files (simple check)
    if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) return;

    const isLive = file.toUpperCase().startsWith('DSC');
    const destDir = isLive ? liveDir : dailyDir;

    moveFile(filePath, path.join(destDir, file));

    if (isLive) movedLive++;
    else movedDaily++;
});

console.log(`   Moved ${movedLive} to live/, ${movedDaily} to daily/`);

// 2. Process Optimized Images
console.log('📦 Processing optimized images...');
if (fs.existsSync(optimizedDir)) {
    const optimizedFiles = fs.readdirSync(optimizedDir);
    let movedOptLive = 0;
    let movedOptDaily = 0;

    optimizedFiles.forEach(file => {
        const filePath = path.join(optimizedDir, file);

        if (fs.statSync(filePath).isDirectory()) return;
        if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) return;

        const isLive = file.toUpperCase().startsWith('DSC');
        const destDir = isLive ? liveOptimizedDir : dailyOptimizedDir;

        moveFile(filePath, path.join(destDir, file));

        if (isLive) movedOptLive++;
        else movedOptDaily++;
    });

    console.log(`   Moved ${movedOptLive} to live/optimized/, ${movedOptDaily} to daily/optimized/`);

    // Remove old optimized directory if empty
    if (fs.readdirSync(optimizedDir).length === 0) {
        fs.rmdirSync(optimizedDir);
        console.log('🗑️  Removed empty optimized directory');
    } else {
        console.log('⚠️  Old optimized directory not empty, kept it.');
    }
} else {
    console.log('⚠️  No optimized directory found.');
}

console.log('✅ Migration complete!');
