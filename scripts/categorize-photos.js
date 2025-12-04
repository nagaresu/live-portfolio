const fs = require('fs');
const path = require('path');

const metadataPath = path.join(__dirname, '../src/data/photo-metadata.json');
const metadata = require(metadataPath);

console.log(`📊 Processing ${metadata.length} photos...`);

let liveCount = 0;
let dailyCount = 0;

const updatedMetadata = metadata.map(photo => {
    const filename = path.basename(photo.src);
    let category = 'daily';

    // Check if filename starts with DSC (case insensitive just in case)
    if (filename.toUpperCase().startsWith('DSC')) {
        category = 'live';
        liveCount++;
    } else {
        dailyCount++;
    }

    return {
        ...photo,
        category
    };
});

console.log(`✅ Categorization complete!`);
console.log(`🎸 Live Photos (DSC...): ${liveCount}`);
console.log(`📷 Daily Photos (Others): ${dailyCount}`);

// Save updated metadata
fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
console.log(`💾 Saved to ${metadataPath}`);
