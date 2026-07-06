import fs from 'fs';
import path from 'path';
import ExifReader from 'exifreader';

export interface OrganizeResult {
    success: boolean;
    message: string;
    processedFiles: string[];
    errors: string[];
}

export interface Scene {
    start: number;
    end: number;
    name: string;
}

export async function organizePhotos(inputDir: string, logContent: string, dryRun: boolean = false): Promise<OrganizeResult> {
    const processedFiles: string[] = [];
    const errors: string[] = [];

    try {
        // 1. Parse Log
        const { eventName, scenes } = parseLogContent(logContent);
        if (!eventName) {
            return { success: false, message: "Could not determine Event Name from log.", processedFiles, errors };
        }

        const outputDir = path.join(path.dirname(inputDir), 'Delivery');

        // 2. Scan Images
        if (!fs.existsSync(inputDir)) {
            return { success: false, message: `Input directory not found: ${inputDir}`, processedFiles, errors };
        }

        const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png|heic|arw|cr2|nef)$/i.test(f));

        // 3. Process Images
        const images: any[] = [];
        for (const file of files) {
            const filePath = path.join(inputDir, file);
            try {
                // We need to read the file buffer for ExifReader to work reliably in Node environment with all formats
                const fileBuffer = fs.readFileSync(filePath);
                const tags = ExifReader.load(fileBuffer);

                // Get Date
                let dateStr = tags['DateTimeOriginal']?.description;
                if (!dateStr) dateStr = tags['CreateDate']?.description;

                if (!dateStr) {
                    errors.push(`No date found for ${file}`);
                    continue;
                }

                // Parse Date (Format: YYYY:MM:DD HH:MM:SS)
                const [d, t] = dateStr.split(' ');
                const dateParts = d.split(':');
                const timeParts = t.split(':');
                const dateObj = new Date(
                    parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]),
                    parseInt(timeParts[0]), parseInt(timeParts[1]), parseInt(timeParts[2])
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

            } catch (e: any) {
                errors.push(`Failed to read Exif for ${file}: ${e.message}`);
            }
        }

        // Sort images by time
        images.sort((a, b) => a.date.getTime() - b.date.getTime());

        // 4. Match Scenes and Rename
        const sceneCounters: Record<string, number> = {};

        for (const img of images) {
            const scene = findScene(img.date, scenes);
            const sceneName = scene ? scene.name : 'Uncategorized';

            if (!sceneCounters[sceneName]) sceneCounters[sceneName] = 0;
            sceneCounters[sceneName]++;
            const take = String(sceneCounters[sceneName]).padStart(3, '0');

            const yyyy = img.date.getFullYear();
            const mm = String(img.date.getMonth() + 1).padStart(2, '0');
            const dd = String(img.date.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}${mm}${dd}`;

            const newFilename = `${eventName}_${img.camera}_${dateStr}_${sceneName}_${take}${img.ext}`;

            const targetFolder = path.join(outputDir, eventName, sceneName);
            const targetPath = path.join(targetFolder, newFilename);

            processedFiles.push(`${img.originalFile} -> ${sceneName}/${newFilename}`);

            if (!dryRun) {
                fs.mkdirSync(targetFolder, { recursive: true });
                fs.copyFileSync(img.path, targetPath);
            }
        }

        return {
            success: true,
            message: `Processed ${images.length} images.`,
            processedFiles,
            errors
        };

    } catch (e: any) {
        return {
            success: false,
            message: `Critical error: ${e.message}`,
            processedFiles,
            errors
        };
    }
}

function parseLogContent(content: string) {
    const lines = content.split('\n');

    let eventName = 'Event';
    const h1 = lines.find(l => l.startsWith('# '));
    if (h1) {
        eventName = h1.replace('# ', '').trim().replace(/_/g, '');
    }

    const scenes: Scene[] = [];
    let inTable = false;

    for (const line of lines) {
        if (line.includes('|') && line.includes('---')) {
            inTable = true;
            continue;
        }

        if (inTable && line.trim().startsWith('|')) {
            const parts = line.split('|').map(p => p.trim()).filter(p => p);
            if (parts.length >= 3) {
                const startStr = parts[0];
                const endStr = parts[1];
                const name = parts[2];

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

function parseTime(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function findScene(dateObj: Date, scenes: Scene[]) {
    const minutes = dateObj.getHours() * 60 + dateObj.getMinutes();
    return scenes.find(s => minutes >= s.start && minutes < s.end);
}
