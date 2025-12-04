const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, '../public/images/portfolio');
const liveDir = path.join(portfolioDir, 'live');
const dailyDir = path.join(portfolioDir, 'daily');
const liveOptimizedDir = path.join(liveDir, 'optimized');
const dailyOptimizedDir = path.join(dailyDir, 'optimized');

// Keywords to identify Live photos
const LIVE_KEYWORDS = [
    'METROCK',
    'GIGANTIC',
    'SONIC',
    'WILD_BUNCH',
    'SWEET_LOVE_SHOWER',
    '1CHANCE',
    'ZENSHYO',
    'KOYABU',
    'JAPAN_JAM',
    'GREENROOM',
    'CHAGU',
    'RISING_SUN',
    'MONSTER_baSH',
    'ROCK_IN_JAPAN',
    'LIVE_2025'
];

// Helper to move file
const moveFile = (src, dest) => {
    try {
        if (fs.existsSync(dest)) {
            console.log(`⚠️  Destination exists, skipping: ${path.basename(src)}`);
            return;
        }
        fs.renameSync(src, dest);
        // console.log(`Moved: ${path.basename(src)}`);
    } catch (err) {
        console.error(`Error moving ${src}:`, err);
    }
};

console.log('📦 Restoring Live photos from Daily...');

// Ensure Live directories exist
if (!fs.existsSync(liveDir)) fs.mkdirSync(liveDir, { recursive: true });
if (!fs.existsSync(liveOptimizedDir)) fs.mkdirSync(liveOptimizedDir, { recursive: true });

let movedOriginals = 0;
let movedOptimized = 0;

// 1. Restore Original Images
if (fs.existsSync(dailyDir)) {
    const files = fs.readdirSync(dailyDir);
    files.forEach(file => {
        const srcPath = path.join(dailyDir, file);
        if (fs.statSync(srcPath).isDirectory()) return;

        // Check if file matches any keyword (case-insensitive)
        const isLive = LIVE_KEYWORDS.some(keyword => file.toLowerCase().includes(keyword.toLowerCase()));

        if (isLive) {
            moveFile(srcPath, path.join(liveDir, file));
            movedOriginals++;
        }
    });
}

// 2. Restore Optimized Images
if (fs.existsSync(dailyOptimizedDir)) {
    const files = fs.readdirSync(dailyOptimizedDir);
    files.forEach(file => {
        const srcPath = path.join(dailyOptimizedDir, file);

        // Check if file matches any keyword (case-insensitive)
        const isLive = LIVE_KEYWORDS.some(keyword => file.toLowerCase().includes(keyword.toLowerCase()));

        if (isLive) {
            moveFile(srcPath, path.join(liveOptimizedDir, file));
            movedOptimized++;
        }
    });
}

console.log(`✅ Restoration complete.`);
console.log(`   Restored ${movedOriginals} original photos.`);
console.log(`   Restored ${movedOptimized} optimized photos.`);
