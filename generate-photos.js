const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'public/images/portfolio');
const outputPath = path.join(__dirname, 'src/data/photos.json');

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    // Filter for image files and create paths
    const photoList = files
        .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
        .map(file => `/images/portfolio/${file}`);

    fs.writeFileSync(outputPath, JSON.stringify(photoList, null, 2));
    console.log(`Generated ${photoList.length} photos in ${outputPath}`);
});
