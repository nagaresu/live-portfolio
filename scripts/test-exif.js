const ExifReader = require('exifreader');
const fs = require('fs');
const path = require('path');

const metadataPath = path.join(__dirname, '../src/data/photo-metadata.json');
const metadata = require(metadataPath);
const publicDir = path.join(__dirname, '../public');

// Test with original image (not optimized)
const originalPath = metadata[0].src.replace('/optimized', '');
const testImagePath = path.join(publicDir, originalPath);
console.log(`📸 Testing EXIF extraction with original image: ${originalPath}\n`);

try {
    const tags = ExifReader.load(fs.readFileSync(testImagePath));

    console.log('Available EXIF tags:');
    console.log('- DateTimeOriginal:', tags.DateTimeOriginal?.description || 'N/A');
    console.log('- DateTime:', tags.DateTime?.description || 'N/A');
    console.log('- GPSLatitude:', tags.GPSLatitude?.description || 'N/A');
    console.log('- GPSLongitude:', tags.GPSLongitude?.description || 'N/A');
    console.log('- Make:', tags.Make?.description || 'N/A');
    console.log('- Model:', tags.Model?.description || 'N/A');
    console.log('\nAll GPS-related tags:');
    Object.keys(tags)
        .filter(key => key.startsWith('GPS'))
        .forEach(key => {
            console.log(`  ${key}: ${tags[key].description || tags[key].value}`);
        });

    console.log('\n\n📅 Date/Time related tags:');
    Object.keys(tags)
        .filter(key => key.toLowerCase().includes('date') || key.toLowerCase().includes('time'))
        .forEach(key => {
            console.log(`  ${key}: ${tags[key].description || tags[key].value}`);
        });
} catch (error) {
    console.error('Error reading EXIF:', error.message);
}
