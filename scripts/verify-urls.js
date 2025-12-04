const fs = require('fs');
const path = require('path');
const http = require('http');

const metadataPath = path.join(__dirname, '../src/data/photo-metadata.json');
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

console.log(`🔍 Verifying ${metadata.length} photos...`);

let checked = 0;
let errors = 0;

const checkUrl = (url) => {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: url,
            method: 'HEAD'
        }, (res) => {
            if (res.statusCode !== 200) {
                console.error(`❌ ${res.statusCode} - ${url}`);
                errors++;
            }
            checked++;
            if (checked % 100 === 0) process.stdout.write('.');
            resolve();
        });

        req.on('error', (e) => {
            console.error(`❌ Network Error - ${url}: ${e.message}`);
            errors++;
            checked++;
            resolve();
        });

        req.end();
    });
};

const run = async () => {
    // Check in chunks to avoid overwhelming the server
    const chunkSize = 50;
    for (let i = 0; i < metadata.length; i += chunkSize) {
        const chunk = metadata.slice(i, i + chunkSize);
        await Promise.all(chunk.map(photo => checkUrl(photo.src)));
    }

    console.log('\n');
    if (errors === 0) {
        console.log('✅ All photos are accessible!');
    } else {
        console.log(`⚠️  Found ${errors} broken links.`);
    }
};

run();
