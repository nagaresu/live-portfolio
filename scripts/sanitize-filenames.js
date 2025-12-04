const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, '../public/images/portfolio');
const categories = ['live', 'daily'];

const sanitizeFilename = (filename) => {
    return filename
        .replace(/\s+/g, '_')       // Replace spaces with underscores
        .replace(/[()]/g, '')       // Remove parentheses
        .replace(/_+/g, '_')        // Collapse multiple underscores
        .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove other special chars
};

console.log('🧹 Sanitizing filenames...');

categories.forEach(category => {
    const categoryDir = path.join(portfolioDir, category);

    const processDirectory = (dir) => {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir);
        let count = 0;

        items.forEach(item => {
            if (item.startsWith('.')) return; // Skip hidden files

            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // Recursively process subdirectories
                processDirectory(fullPath);

                // Rename directory itself if needed
                const safeDirName = sanitizeFilename(item);
                if (item !== safeDirName) {
                    const newDirPath = path.join(dir, safeDirName);
                    if (!fs.existsSync(newDirPath)) {
                        fs.renameSync(fullPath, newDirPath);
                        // console.log(`Renamed Dir: ${item} -> ${safeDirName}`);
                    } else {
                        console.warn(`⚠️  Collision: Directory ${safeDirName} already exists. Skipping rename of ${item}`);
                    }
                }
            } else {
                // Process file
                const safeName = sanitizeFilename(item);
                if (item !== safeName) {
                    const newPath = path.join(dir, safeName);

                    // Handle collision if new name already exists
                    if (fs.existsSync(newPath)) {
                        console.warn(`⚠️  Collision: ${safeName} already exists. Skipping rename of ${item}`);
                        return;
                    }

                    fs.renameSync(fullPath, newPath);
                    count++;
                }
            }
        });
        if (count > 0) {
            console.log(`   Sanitized ${count} files in ${path.relative(portfolioDir, dir)}`);
        }
    };

    console.log(`Processing category: ${category}`);
    processDirectory(categoryDir);
});

console.log('✅ Filename sanitization complete.');
