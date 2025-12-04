const ExifReader = require('exifreader');
const fs = require('fs');
const path = require('path');

const metadataPath = path.join(__dirname, '../src/data/photo-metadata.json');
const metadata = require(metadataPath);
const publicDir = path.join(__dirname, '../public');

console.log(`📸 Extracting EXIF data from ${metadata.length} images...\n`);

let withDate = 0;
let withGPS = 0;
let noExif = 0;

const updatedMetadata = metadata.map((photo, index) => {
    // Get original image path (not optimized)
    const originalPath = photo.src.replace('/optimized', '');
    const imagePath = path.join(publicDir, originalPath);

    try {
        const tags = ExifReader.load(fs.readFileSync(imagePath));

        // Extract date
        let date = null;
        if (tags.DateTimeOriginal?.description) {
            const dateStr = tags.DateTimeOriginal.description;
            // Format: "2018:11:18 09:01:46" -> "2018.11.18"
            date = dateStr.split(' ')[0].replace(/:/g, '.');
            withDate++;
        } else if (tags.DateTime?.description) {
            const dateStr = tags.DateTime.description;
            date = dateStr.split(' ')[0].replace(/:/g, '.');
            withDate++;
        }

        // Extract GPS (if available)
        let location = null;
        if (tags.GPSLatitude?.description && tags.GPSLongitude?.description) {
            // For now, just note that GPS exists
            // We'd need reverse geocoding to convert to location name
            location = `GPS: ${tags.GPSLatitude.description}, ${tags.GPSLongitude.description}`;
            withGPS++;
        }

        // Update metadata
        const updated = { ...photo };
        if (date) {
            updated.meta = {
                ...updated.meta,
                date: date,
            };
        }
        // Keep location as is for now (would need geocoding API for GPS->Location)

        if ((index + 1) % 50 === 0) {
            console.log(`✓ Processed ${index + 1}/${metadata.length}...`);
        }

        return updated;
    } catch (error) {
        noExif++;
        return photo; // Keep original if can't read EXIF
    }
});

console.log(`\n✅ EXIF extraction complete!\n`);
console.log(`📊 Summary:`);
console.log(`   Total images: ${metadata.length}`);
console.log(`   With date/time: ${withDate}`);
console.log(`   With GPS data: ${withGPS}`);
console.log(`   No EXIF data: ${noExif}`);

// Save updated metadata
fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
console.log(`\n✅ Updated metadata saved to: ${metadataPath}`);
