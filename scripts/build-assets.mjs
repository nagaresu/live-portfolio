// 画像パイプライン（フェーズ2）
// 入力: src/data/photo-metadata.json が指す public/images/portfolio/ 配下の画像
// 出力: public/images/site/display/**（長辺1600・q78）＋ public/images/site/thumbs/**（長辺480・q70）
//       ＋ src/data/photos.v2.json（表示用/サムネのパス・実寸・イベント名・日付・alt）
// 方針:
//   - EXIFは出力しない（.withMetadata()を呼ばない）＝GPS等を除去
//   - .rotate() でEXIF向きを反映してから除去
//   - 既存の入力画像は読み取りのみ。削除・上書きは一切しない（photo-data-no-delete原則）
//   - 冪等: 出力が入力より新しければスキップ。再実行安全
import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUB = path.join(ROOT, 'public');
const META = path.join(ROOT, 'src/data/photo-metadata.json');
const OUT_JSON = path.join(ROOT, 'src/data/photos.v2.json');
const DISPLAY_MAX = 1600;
const THUMB_MAX = 480;
const CONCURRENCY = 8;

function parseEvent(rel) {
    // rel例: live/20250505_JAPAN_JAM_2025/IG_1/xxx.jpg
    const parts = rel.split('/');
    const folder = parts[1] ?? '';
    const m = folder.match(/^(\d{4})(\d{2})(\d{2})_(.+)$/);
    if (!m) return { event: null, date: null };
    const [, y, mo, d, name] = m;
    return { event: name.replace(/_+/g, ' ').trim(), date: `${y}-${mo}-${d}` };
}

async function needsBuild(input, output) {
    try {
        const [si, so] = await Promise.all([fs.stat(input), fs.stat(output)]);
        return si.mtimeMs > so.mtimeMs; // 入力が新しければ再生成
    } catch {
        return true; // 出力が無ければ生成
    }
}

async function processOne(entry) {
    const src = entry.src; // /images/portfolio/live/.../xxx.jpg
    const input = path.join(PUB, src);
    const rel = src.replace('/images/portfolio/', ''); // live/.../xxx.jpg
    const displayRel = `/images/site/display/${rel}`;
    const thumbRel = `/images/site/thumbs/${rel}`;
    const displayOut = path.join(PUB, displayRel);
    const thumbOut = path.join(PUB, thumbRel);

    await fs.mkdir(path.dirname(displayOut), { recursive: true });
    await fs.mkdir(path.dirname(thumbOut), { recursive: true });

    let width, height;
    if (await needsBuild(input, displayOut)) {
        const info = await sharp(input)
            .rotate()
            .resize(DISPLAY_MAX, DISPLAY_MAX, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 78, mozjpeg: true })
            .toFile(displayOut);
        width = info.width; height = info.height;
    } else {
        const m = await sharp(displayOut).metadata();
        width = m.width; height = m.height;
    }
    if (await needsBuild(input, thumbOut)) {
        await sharp(input)
            .rotate()
            .resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 70, mozjpeg: true })
            .toFile(thumbOut);
    }

    const { event, date } = parseEvent(rel);
    const orientation = width >= height ? 'horizontal' : 'vertical';
    const alt = entry.category === 'live'
        ? `${event ? event + ' — ' : ''}live music photography by Keisuke Sunagare`
        : `Daily photograph by Keisuke Sunagare`;

    return { src: displayRel, thumbnail: thumbRel, width, height, category: entry.category, orientation, event, date, alt };
}

async function main() {
    const meta = JSON.parse(await fs.readFile(META, 'utf8'));
    const results = new Array(meta.length);
    let done = 0, built = 0, errors = 0, unparsed = 0;

    for (let i = 0; i < meta.length; i += CONCURRENCY) {
        const batch = meta.slice(i, i + CONCURRENCY);
        const settled = await Promise.allSettled(batch.map(processOne));
        settled.forEach((s, j) => {
            const idx = i + j;
            if (s.status === 'fulfilled') {
                results[idx] = s.value;
                if (s.value.category === 'live' && !s.value.event) unparsed++;
            } else {
                errors++;
                console.error('ERR', meta[idx].src, s.reason?.message);
            }
        });
        done += batch.length;
        if (done % 200 < CONCURRENCY) console.log(`  ${done}/${meta.length}`);
    }

    const clean = results.filter(Boolean);
    await fs.writeFile(OUT_JSON, JSON.stringify(clean, null, 2));
    console.log(`\n完了: ${clean.length}件出力 / エラー${errors} / liveでイベント未判定${unparsed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
