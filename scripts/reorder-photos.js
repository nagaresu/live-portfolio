const fs = require('fs');
const path = require('path');

const metadataPath = path.join(__dirname, '../src/data/photo-metadata.json');
const metadata = require(metadataPath);

// Separate vertical and horizontal photos
const verticalPhotos = metadata.filter(p => p.orientation === 'vertical');
const horizontalPhotos = metadata.filter(p => p.orientation === 'horizontal');

console.log(`📊 Total photos: ${metadata.length}`);
console.log(`📐 Vertical: ${verticalPhotos.length}, Horizontal: ${horizontalPhotos.length}`);

// Create a new order: mix vertical and horizontal photos
// Strategy: Insert 1 vertical photo every 3-4 horizontal photos in the first section
const reordered = [];
let vIndex = 0;
let hIndex = 0;
const targetFirstSection = 60; // Initial load count

// For the first 60 photos, add more vertical photos
let photoCount = 0;
while (photoCount < targetFirstSection && (vIndex < verticalPhotos.length || hIndex < horizontalPhotos.length)) {
    // Add 1 vertical photo
    if (vIndex < verticalPhotos.length) {
        reordered.push(verticalPhotos[vIndex]);
        vIndex++;
        photoCount++;
    }

    // Add 3 horizontal photos
    for (let i = 0; i < 3 && hIndex < horizontalPhotos.length && photoCount < targetFirstSection; i++) {
        reordered.push(horizontalPhotos[hIndex]);
        hIndex++;
        photoCount++;
    }
}

// Add remaining photos in their original order
while (hIndex < horizontalPhotos.length) {
    reordered.push(horizontalPhotos[hIndex]);
    hIndex++;
}

while (vIndex < verticalPhotos.length) {
    reordered.push(verticalPhotos[vIndex]);
    vIndex++;
}

// Verify count
console.log(`✅ Reordered ${reordered.length} photos`);

// Count vertical in first 60
const verticalInFirst60 = reordered.slice(0, 60).filter(p => p.orientation === 'vertical').length;
console.log(`📐 Vertical photos in first 60: ${verticalInFirst60}`);

// Write back to file
fs.writeFileSync(metadataPath, JSON.stringify(reordered, null, 2));

console.log(`✅ Photo order updated!`);
console.log(`📁 Metadata file: ${metadataPath}`);
