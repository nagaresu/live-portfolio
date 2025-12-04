const fs = require('fs');
const path = require('path');

const metadataPath = path.join(__dirname, '../src/data/photo-metadata.json');
const metadata = require(metadataPath);

// Update all src paths to use optimized images
const updatedMetadata = metadata.map(photo => ({
    ...photo,
    src: photo.src.replace('/images/portfolio/', '/images/portfolio/optimized/')
}));

// Write back to file
fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));

console.log(`✅ Updated ${updatedMetadata.length} photo paths to use optimized images`);
console.log(`📁 Metadata file: ${metadataPath}`);
