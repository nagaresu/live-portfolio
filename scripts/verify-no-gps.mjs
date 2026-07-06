// public/images/site/ 配下の全jpgにGPS等のEXIFが残っていないかを機械検査する。
// 結果は「GPS付き0件」でなければならない（1件でもあれば原因調査）。
import ExifReader from 'exifreader';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, 'public/images/site');

async function walk(dir) {
    const out = [];
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...await walk(p));
        else if (/\.jpe?g$/i.test(e.name)) out.push(p);
    }
    return out;
}

const files = await walk(DIR);
let gps = 0, anyExif = 0;
for (const f of files) {
    try {
        const tags = ExifReader.load(await fs.readFile(f));
        const keys = Object.keys(tags);
        if (keys.some((k) => k.startsWith('GPS'))) { gps++; console.error('GPS残存:', f); }
        if (keys.length) anyExif++;
    } catch { /* EXIF無し = 問題なし */ }
}
console.log(`検査 ${files.length}件 / GPS付き ${gps}件 / 何らかのEXIF ${anyExif}件`);
process.exit(gps === 0 ? 0 : 1);
