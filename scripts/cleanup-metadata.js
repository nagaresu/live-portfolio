const fs = require('fs');
const path = require('path');

const metadataPath = path.join(__dirname, '../src/data/photo-metadata.json');
const metadata = require(metadataPath);

// Update photos to remove dummy data
const updatedMetadata = metadata.map(photo => {
    const updated = { ...photo };

    // Ensure meta exists
    if (!updated.meta) {
        updated.meta = {};
    }

    // Remove dummy locations - keep only if it starts with GPS or is empty
    if (updated.meta.location && !updated.meta.location.startsWith('GPS:')) {
        updated.meta.location = '';
    }

    return updated;
});

// Save
fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
console.log(`✅ Cleaned up metadata`);
console.log(`   Removed dummy locations (kept ${updatedMetadata.filter(p => p.meta.location).length} with GPS)`);
console.log(`   Photos with dates: ${updatedMetadata.filter(p => p.meta.date).length}`);
