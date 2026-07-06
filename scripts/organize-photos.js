const fs = require('fs');
const path = require('path');
const ExifReader = require('exifreader');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    if (args.length < 2) {
        console.error('Usage: node organize-photos.js <input_folder> <log_file_md> [output_folder]');
        process.exit(1);
    }

    const [inputDir, logFile, outputDirArg] = args;
    const outputDir = outputDirArg || path.join(path.dirname(inputDir), 'Delivery');

    console.log(`Input: ${inputDir}`);
    console.log(`Log: ${logFile}`);
    console.log(`Output: ${outputDir}`);
    if (DRY_RUN) console.log('--- DRY RUN MODE ---');

    // 1. Parse Log File
    const { eventName, scenes } = parseLogFile(logFile);
    console.log(`\nEvent Name: ${eventName}`);
    console.log(`Found ${scenes.length} scenes in log.`);

    // 2. Scan Images
    const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png|heic|arw|cr2|nef)$/i.test(f));
    console.log(`Found ${files.length} images.`);

    // 3. Process Images
    const images = [];
    for (const file of files) {
        const filePath = path.join(inputDir, file);
        try {
            const tags = await ExifReader.load(filePath);

            // Get Date
            let dateStr = tags['DateTimeOriginal']?.description;
            if (!dateStr) dateStr = tags['CreateDate']?.description;

            if (!dateStr) {
                console.warn(`[WARN] No date found for ${file}, skipping.`);
                continue;
            }

            // Parse Date (Format: YYYY:MM:DD HH:MM:SS)
            const [d, t] = dateStr.split(' ');
            const dateParts = d.split(':');
            const timeParts = t.split(':');
            const dateObj = new Date(
                dateParts[0], dateParts[1] - 1, dateParts[2],
                timeParts[0], timeParts[1], timeParts[2]
            );

            // Get Camera
            let camera = tags['Model']?.description || 'UnknownCam';
            camera = camera.replace(/[^a-zA-Z0-9]/g, ''); // Sanitize

            images.push({
                originalFile: file,
                path: filePath,
                date: dateObj,
                camera: camera,
                ext: path.extname(file)
            });

        } catch (e) {
            console.error(`[ERROR] Failed to read Exif for ${file}:`, e.message);
        }
    }

    // Sort images by time
    images.sort((a, b) => a.date - b.date);

    // 4. Match Scenes and Rename
    const sceneCounters = {}; // Track take numbers per scene

    for (const img of images) {
        const scene = findScene(img.date, scenes);
        const sceneName = scene ? scene.name : 'Uncategorized';

        // Initialize counter for this scene if needed
        if (!sceneCounters[sceneName]) sceneCounters[sceneName] = 0;
        sceneCounters[sceneName]++;
        const take = String(sceneCounters[sceneName]).padStart(3, '0');

        // Format Date for filename: YYYYMMDD
        const yyyy = img.date.getFullYear();
        const mm = String(img.date.getMonth() + 1).padStart(2, '0');
        const dd = String(img.date.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`;

        // Construct new filename
        // {EventName}_{Camera}_{Date}_{Scene}_{Take}.ext
        const newFilename = `${eventName}_${img.camera}_${dateStr}_${sceneName}_${take}${img.ext}`;

        // Determine Output Path
        const targetFolder = path.join(outputDir, eventName, sceneName);
        const targetPath = path.join(targetFolder, newFilename);

        console.log(`${img.originalFile} -> ${sceneName}/${newFilename}`);

        if (!DRY_RUN) {
            fs.mkdirSync(targetFolder, { recursive: true });
            fs.copyFileSync(img.path, targetPath);
        }
    }

    console.log('\nDone!');
}

function parseLogFile(logPath) {
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n');

    // Extract Event Name from H1 (# Event Name)
    let eventName = 'Event';
    const h1 = lines.find(l => l.startsWith('# '));
    if (h1) {
        eventName = h1.replace('# ', '').trim().replace(/_/g, ''); // Remove underscores if present to avoid double
    } else {
        // Fallback to filename
        eventName = path.basename(logPath, path.extname(logPath)).replace(/^\d{8}_/, '');
    }

    const scenes = [];
    let inTable = false;

    for (const line of lines) {
        if (line.includes('|') && line.includes('---')) {
            inTable = true;
            continue;
        }

        if (inTable && line.trim().startsWith('|')) {
            // Parse table row: | Start | End | Name |
            const parts = line.split('|').map(p => p.trim()).filter(p => p);
            if (parts.length >= 3) {
                const startStr = parts[0];
                const endStr = parts[1];
                const name = parts[2];

                // We assume the date is the same as the event date (or today). 
                // Since we only have HH:MM, we need to be careful matching with full Date objects.
                // Strategy: We will compare only HH:MM of the image time.

                scenes.push({
                    start: parseTime(startStr),
                    end: parseTime(endStr),
                    name: name
                });
            }
        }
    }

    return { eventName, scenes };
}

// Helper to convert "13:00" to minutes from start of day for easy comparison
function parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function findScene(dateObj, scenes) {
    const minutes = dateObj.getHours() * 60 + dateObj.getMinutes();
    return scenes.find(s => minutes >= s.start && minutes < s.end);
}

main().catch(console.error);
