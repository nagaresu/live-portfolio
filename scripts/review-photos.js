const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ExifReader = require('exifreader');

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_MAX_IMAGES = 80;
const DEFAULT_MODEL = 'gpt-4.1';
const DEFAULT_SELECTION_MODE = 'smart';
const DEFAULT_FEEDBACK_STYLE = 'coaching';
const DEFAULT_REVIEW_MODE = 'deep10';
const JP_VIEWPOINT_TAGS = [
  'Moriyama Daido（粒子感・瞬間の生々しさ）',
  'Kawauchi Rinko（やわらかな光・余韻）',
  'Ninagawa Mika（色彩・熱量）',
  'Okuyama Yoshiyuki（物語性・距離感）',
];
const GLOBAL_VIEWPOINT_TAGS = [
  'Cartier-Bresson（決定的瞬間）',
  'Alex Webb（多層構図・画面内関係）',
  'Mary Ellen Mark（被写体との関係性）',
  'W. Eugene Smith（連作編集・物語）',
  'Dina Litovsky（心理的リアリズム）',
];
const PRO_VIEWPOINT_TAGS = [
  ...JP_VIEWPOINT_TAGS,
  ...GLOBAL_VIEWPOINT_TAGS,
  'Live Practical（ライブ現場の実務最適）',
];
const LIVE_BASELINE_CONSTRAINTS = [
  '配線・機材・柵は完全除去できない場合がある',
  '撮影位置の移動制限がある',
  '観客の頭・手・スマホ写り込みは避けきれない',
  '照明変化が激しく露出は完全固定できない',
];

async function main() {
  let outputDir = '';
  const args = parseArgs(process.argv.slice(2));

  if (!args.dir) {
    printUsage();
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set.');
    process.exit(1);
  }

  const targetDir = path.resolve(args.dir);
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(`Error: directory not found: ${targetDir}`);
    process.exit(1);
  }

  const promptPath = args.promptFile
    ? path.resolve(args.promptFile)
    : path.resolve(__dirname, '../../02_保存版/写真AIコーチ構築/PROMPT_v1.md');

  const prompt = loadPrompt(promptPath);
  const allImagePaths = collectImages(targetDir);
  const imagePaths = await chooseImagesForReview(allImagePaths, args.maxImages, args.selectionMode);
  const images = imagePaths.map((filePath, idx) => {
    const relative = path.relative(targetDir, filePath);
    return {
      id: `P${String(idx + 1).padStart(3, '0')}`,
      no: idx + 1,
      filePath,
      relativePath: relative,
      fileName: path.basename(filePath),
      exifSummary: '',
    };
  });
  await enrichExifSummaries(images);

  if (images.length === 0) {
    console.error('Error: no supported image files found.');
    process.exit(1);
  }

  outputDir = args.output
    ? path.resolve(args.output)
    : path.join(
        targetDir,
        'review-output',
        `${path.basename(targetDir)}_${timestampForFileName(new Date())}`
      );
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Directory: ${targetDir}`);
  console.log(`Images found: ${allImagePaths.length}`);
  console.log(`Images selected: ${images.length}`);
  console.log(`Batch size: ${args.batchSize}`);
  console.log(`Model: ${args.model}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Selection mode: ${args.selectionMode}`);

  const batches = chunk(images, args.batchSize);
  const batchReports = [];

  const imageIndexCsv = ['id,no,file_name,relative_path'];
  for (const img of images) {
    imageIndexCsv.push(
      `${img.id},${img.no},"${escapeCsv(img.fileName)}","${escapeCsv(img.relativePath)}"`
    );
  }
  fs.writeFileSync(path.join(outputDir, 'image-index.csv'), `${imageIndexCsv.join('\n')}\n`, 'utf-8');
  fs.writeFileSync(
    path.join(outputDir, 'selection-summary.md'),
    buildSelectionSummary(allImagePaths, images, args.selectionMode, targetDir),
    'utf-8'
  );
  materializeSelectedImages(images, outputDir);

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    console.log(`\n[Batch ${i + 1}/${batches.length}] Processing ${batch.length} images...`);

    const report = await reviewBatch({
      batch,
      batchIndex: i + 1,
      batchCount: batches.length,
      args,
      prompt,
    });

    batchReports.push(report);
    const batchIndexHeader = [
      `# Batch ${i + 1} 画像対応表`,
      '',
      '| ID | ファイル名 | 相対パス |',
      '|---|---|---|',
      ...batch.map((img) => `| ${img.id} | ${img.fileName} | ${img.relativePath} |`),
      '',
      '# Batch 講評',
      '',
    ].join('\n');
    fs.writeFileSync(
      path.join(outputDir, `batch-${String(i + 1).padStart(2, '0')}.md`),
      `${batchIndexHeader}${report}\n`,
      'utf-8'
    );
  }

  console.log('\n[Synthesis] Creating final combined review...');
  const finalReport = await synthesizeReview({ batchReports, args, prompt });
  const readableReport = await formatReadableReport({ finalReport, args });
  const finalReportPretty = prettifyReportMarkdown(finalReport);
  const readableReportPretty = prettifyReportMarkdown(readableReport);
  const slideMarkdown = await createSlideMarkdown({ readableReport, args });

  const jsonPayload = {
    generatedAt: new Date().toISOString(),
    model: args.model,
    targetDir,
    genre: args.genre,
    intent: args.intent,
    constraints: args.constraints,
    images: images.map((img) => ({
      id: img.id,
      no: img.no,
      fileName: img.fileName,
      relativePath: img.relativePath,
    })),
    batches: batchReports,
    finalReport,
  };

  fs.writeFileSync(path.join(outputDir, 'final-review-raw.md'), finalReport, 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'final-review.md'), readableReportPretty, 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'final-review-readable.md'), readableReportPretty, 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'final-review-compact.md'), finalReportPretty, 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'final-review-slides.md'), slideMarkdown, 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'review.json'), JSON.stringify(jsonPayload, null, 2), 'utf-8');

  console.log('\nDone.');
  console.log(`- Final review: ${path.join(outputDir, 'final-review.md')}`);
  console.log(`- Raw review: ${path.join(outputDir, 'final-review-raw.md')}`);
  console.log(`- Compact review: ${path.join(outputDir, 'final-review-compact.md')}`);
  console.log(`- Readable review: ${path.join(outputDir, 'final-review-readable.md')}`);
  console.log(`- Slide markdown: ${path.join(outputDir, 'final-review-slides.md')}`);
  console.log(`- JSON data: ${path.join(outputDir, 'review.json')}`);
}

function parseArgs(argv) {
  const args = {
    dir: '',
    genre: 'その他',
    intent: '',
    camera: '',
    constraints: '',
    notes: '',
    batchSize: DEFAULT_BATCH_SIZE,
    maxImages: DEFAULT_MAX_IMAGES,
    model: DEFAULT_MODEL,
    selectionMode: DEFAULT_SELECTION_MODE,
    feedbackStyle: DEFAULT_FEEDBACK_STYLE,
    reviewMode: DEFAULT_REVIEW_MODE,
    output: '',
    promptFile: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];

    if (!key.startsWith('--')) {
      continue;
    }

    switch (key) {
      case '--dir':
        args.dir = value || '';
        i += 1;
        break;
      case '--genre':
        args.genre = value || args.genre;
        i += 1;
        break;
      case '--intent':
        args.intent = value || '';
        i += 1;
        break;
      case '--camera':
        args.camera = value || '';
        i += 1;
        break;
      case '--constraints':
        args.constraints = value || '';
        i += 1;
        break;
      case '--notes':
        args.notes = value || '';
        i += 1;
        break;
      case '--batch-size':
        args.batchSize = clampInt(value, DEFAULT_BATCH_SIZE, 1, 40);
        i += 1;
        break;
      case '--max-images':
        args.maxImages = clampInt(value, DEFAULT_MAX_IMAGES, 1, 500);
        i += 1;
        break;
      case '--model':
        args.model = value || DEFAULT_MODEL;
        i += 1;
        break;
      case '--selection-mode':
        args.selectionMode = normalizeSelectionMode(value);
        i += 1;
        break;
      case '--feedback-style':
        args.feedbackStyle = normalizeFeedbackStyle(value);
        i += 1;
        break;
      case '--review-mode':
        args.reviewMode = normalizeReviewMode(value);
        i += 1;
        break;
      case '--output':
        args.output = value || '';
        i += 1;
        break;
      case '--prompt-file':
        args.promptFile = value || '';
        i += 1;
        break;
      default:
        break;
    }
  }

  return args;
}

function printUsage() {
  console.log(`Usage:
node scripts/review-photos.js \\
  --dir "/path/to/photos" \\
  --genre "ライブ" \\
  --intent "熱狂のピークと余韻を見せたい" \\
  --camera "SONY a7 + 24-70mm" \\
  --constraints "暗所、移動制限あり" \\
  --notes "ステージ袖の緊張感も狙った"`);
}

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeSelectionMode(value) {
  const v = (value || '').toLowerCase();
  if (v === 'head') return 'head';
  if (v === 'smart') return 'smart';
  return DEFAULT_SELECTION_MODE;
}

function normalizeFeedbackStyle(value) {
  const v = (value || '').toLowerCase();
  if (v === 'strict') return 'strict';
  if (v === 'coaching') return 'coaching';
  return DEFAULT_FEEDBACK_STYLE;
}

function normalizeReviewMode(value) {
  const v = (value || '').toLowerCase();
  if (v === 'quick') return 'quick';
  if (v === 'deep10') return 'deep10';
  return DEFAULT_REVIEW_MODE;
}

function inferBaselineConstraints(genre, userConstraints) {
  const out = [];
  const g = String(genre || '').trim();
  if (g.includes('ライブ')) {
    out.push(...LIVE_BASELINE_CONSTRAINTS);
  }
  if (userConstraints && userConstraints.trim()) {
    out.push(`ユーザー指定: ${userConstraints.trim()}`);
  }
  if (out.length === 0) {
    out.push('撮影現場の制約を前提に、実行可能な改善案のみ提示する');
  }
  return out;
}

function collectImages(rootDir) {
  const results = [];
  walk(rootDir, results);
  return results.sort((a, b) => {
    try {
      const sa = fs.statSync(a);
      const sb = fs.statSync(b);
      return sa.mtimeMs - sb.mtimeMs;
    } catch (_) {
      return a.localeCompare(b);
    }
  });
}

function walk(currentDir, output) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'review-output') continue;
      walk(fullPath, output);
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) {
      output.push(fullPath);
    }
  }
}

function loadPrompt(promptPath) {
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  const content = fs.readFileSync(promptPath, 'utf-8');
  const systemPrompt = extractSection(content, '## System Prompt');
  const userTemplate = extractSection(content, '## User Prompt Template');

  if (!systemPrompt || !userTemplate) {
    throw new Error(`Prompt file format invalid: ${promptPath}`);
  }

  return { systemPrompt, userTemplate };
}

function extractSection(content, marker) {
  const start = content.indexOf(marker);
  if (start < 0) return '';
  const from = content.slice(start + marker.length).trimStart();
  const next = from.search(/^## /m);
  if (next < 0) return from.trim();
  return from.slice(0, next).trim();
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function timestampForFileName(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

function buildUserPrompt(args, batch, batchIndex, batchCount) {
  const styleLine =
    args.feedbackStyle === 'strict'
      ? '口調は率直に。ただし人格否定・嘲笑・断定的侮辱表現は禁止。'
      : '口調はコーチング調（率直 + 敬意）。厳密に採点しつつ、言葉は前向きに。';
  const depthLine =
    args.reviewMode === 'deep10'
      ? '各写真の改善点は短文で済ませず、最低2文で具体化してください。'
      : '各写真の改善点は1文で簡潔に記述してください。';
  const lengthRule =
    args.reviewMode === 'deep10'
      ? '各写真の「強み」「改善点」はそれぞれ40文字以上で書いてください。'
      : '各写真の「強み」「改善点」は簡潔に書いてください。';
  const actionLine =
    args.reviewMode === 'deep10'
      ? '各行で強みを1つ残し、改善点は「理由 + 次アクション」を最低2文で書いてください。'
      : '各行で強みを1つ残し、改善点は「理由 + 次アクション」を1文で書いてください。';
  const constraintLines = inferBaselineConstraints(args.genre, args.constraints);
  return [
    `これは ${batchIndex}/${batchCount} バッチ目です。`,
    `画像枚数: ${batch.length}`,
    '',
    '[撮影情報]',
    `- ジャンル: ${args.genre || 'その他'}`,
    `- 撮影意図（1文）: ${args.intent || '未記入'}`,
    `- 使用機材: ${args.camera || '未記入'}`,
    `- 制約条件: ${args.constraints || '未記入'}`,
    `- 特記事項: ${args.notes || '未記入'}`,
    '',
    '[画像一覧]',
    ...batch.map(
      (img) =>
        `- ${img.id}: ${img.fileName} (${img.relativePath})` +
        (img.exifSummary ? ` / EXIF: ${img.exifSummary}` : '')
    ),
    '',
    `[フィードバック口調] ${styleLine}`,
    `[講評深度] ${depthLine}`,
    '[現場制約]',
    ...constraintLines.map((c) => `- ${c}`),
    '',
    '[プロ視点タグ]',
    '- 日本:',
    ...JP_VIEWPOINT_TAGS.map((tag) => `- ${tag}`),
    '- 海外:',
    ...GLOBAL_VIEWPOINT_TAGS.map((tag) => `- ${tag}`),
    '- 実務:',
    '- Live Practical（ライブ現場の実務最適）',
    'このバッチ内で厳しめに評価してください。',
    '必ず A/B/C 判定を含めてください。',
    '講評の表は、必ず「ID」列を先頭にして P001 形式のIDを記載してください。',
    actionLine,
    '「価値がない」「センスがない」など人を下げる言い回しは禁止です。',
    lengthRule,
    '各評価には「観察根拠（画面内の事実）」と「自信度（High/Mid/Low）」を必ず添えてください。',
    '各評価に必ず視点タグを1つ以上付けてください。',
    'セット全体で、日本の視点タグを最低1つ、海外の視点タグを最低1つ使ってください。',
    '配線・柵・観客写り込みなど、撮影者が除去不能な要素は減点しないでください。',
    '除去不能要素は「制約考慮」に記載し、回避策（角度、タイミング、トリミング、距離）で提案してください。',
    '事実と推測を分けてください。推測を書く場合は「推測:」から書いてください。',
  ].join('\n');
}

async function reviewBatch({ batch, batchIndex, batchCount, args, prompt }) {
  const userIntro = buildUserPrompt(args, batch, batchIndex, batchCount);
  const images = [];
  for (const img of batch) {
    const prepared = await prepareImageForUpload(img.filePath);
    images.push({
      type: 'input_image',
      image_url: `data:${prepared.mime};base64,${prepared.base64}`,
    });
  }

  const text = await callResponsesAPI({
    model: args.model,
    systemPrompt: prompt.systemPrompt,
    userContent: [
      { type: 'input_text', text: `${prompt.userTemplate}\n\n${userIntro}` },
      ...images,
    ],
  });

  return text;
}

async function prepareImageForUpload(filePath) {
  try {
    const buffer = await sharp(filePath)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return { mime: 'image/jpeg', base64: buffer.toString('base64') };
  } catch (_) {
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext || 'jpeg'}`;
    const b64 = fs.readFileSync(filePath, 'base64');
    return { mime, base64: b64 };
  }
}

async function chooseImagesForReview(imagePaths, limit, selectionMode) {
  if (imagePaths.length <= limit) {
    return imagePaths;
  }
  if (selectionMode === 'head') {
    return imagePaths.slice(0, limit);
  }
  return selectSmart(imagePaths, limit);
}

async function selectSmart(imagePaths, limit) {
  const scored = [];
  for (const p of imagePaths) {
    const metrics = await scoreImage(p);
    scored.push({ path: p, ...metrics });
  }

  const bucketCount = Math.min(limit, scored.length);
  const selected = [];
  const selectedHashes = [];

  for (let i = 0; i < bucketCount; i += 1) {
    const start = Math.floor((i * scored.length) / bucketCount);
    const end = Math.max(start + 1, Math.floor(((i + 1) * scored.length) / bucketCount));
    const bucket = scored.slice(start, end).sort((a, b) => b.totalScore - a.totalScore);

    let pick = bucket.find((candidate) => !isTooSimilar(candidate.hashBits, selectedHashes));
    if (!pick) pick = bucket[0];

    if (pick) {
      selected.push(pick.path);
      selectedHashes.push(pick.hashBits);
    }
  }

  const unique = Array.from(new Set(selected));
  if (unique.length >= limit) return unique.slice(0, limit);

  for (const item of scored.sort((a, b) => b.totalScore - a.totalScore)) {
    if (unique.length >= limit) break;
    if (unique.includes(item.path)) continue;
    if (isTooSimilar(item.hashBits, selectedHashes)) continue;
    unique.push(item.path);
    selectedHashes.push(item.hashBits);
  }

  for (const item of scored) {
    if (unique.length >= limit) break;
    if (!unique.includes(item.path)) unique.push(item.path);
  }
  return unique.slice(0, limit);
}

async function scoreImage(filePath) {
  try {
    const { data, info } = await sharp(filePath)
      .rotate()
      .resize(64, 64, { fit: 'cover' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixels = data;
    const width = info.width;
    const height = info.height;

    let sum = 0;
    for (let i = 0; i < pixels.length; i += 1) {
      sum += pixels[i];
    }
    const mean = sum / pixels.length;

    let gradSum = 0;
    for (let y = 0; y < height - 1; y += 1) {
      for (let x = 0; x < width - 1; x += 1) {
        const idx = y * width + x;
        const dx = Math.abs(pixels[idx] - pixels[idx + 1]);
        const dy = Math.abs(pixels[idx] - pixels[idx + width]);
        gradSum += dx + dy;
      }
    }
    const sharpness = gradSum / ((width - 1) * (height - 1));
    const exposureScore = 1 - Math.min(1, Math.abs(mean - 127) / 127);
    const sharpnessScore = Math.min(1, sharpness / 35);
    const hashBits = averageHashBits(pixels);
    const totalScore = sharpnessScore * 0.75 + exposureScore * 0.25;

    return { totalScore, hashBits };
  } catch (_) {
    return { totalScore: 0.1, hashBits: '' };
  }
}

function averageHashBits(pixels) {
  const size = 8;
  const block = 8; // 64x64 -> 8x8
  const vals = [];
  for (let by = 0; by < size; by += 1) {
    for (let bx = 0; bx < size; bx += 1) {
      let sum = 0;
      for (let y = 0; y < block; y += 1) {
        for (let x = 0; x < block; x += 1) {
          const px = bx * block + x;
          const py = by * block + y;
          sum += pixels[py * 64 + px];
        }
      }
      vals.push(sum / (block * block));
    }
  }
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.map((v) => (v >= avg ? '1' : '0')).join('');
}

function isTooSimilar(hashBits, selectedHashes) {
  if (!hashBits) return false;
  for (const h of selectedHashes) {
    if (!h) continue;
    const distance = hammingDistance(hashBits, h);
    if (distance <= 6) {
      return true;
    }
  }
  return false;
}

function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) d += 1;
  }
  return d;
}

function buildSelectionSummary(allImages, selectedImages, mode, targetDir) {
  const selectedPaths = selectedImages.map((img) =>
    typeof img === 'string' ? img : img.filePath
  );
  const selectedSet = new Set(selectedPaths);
  const dropped = allImages.filter((p) => !selectedSet.has(p));
  const lines = [
    '# Selection Summary',
    '',
    `- Mode: ${mode}`,
    `- Total images: ${allImages.length}`,
    `- Selected images: ${selectedPaths.length}`,
    `- Dropped images: ${dropped.length}`,
    '',
    '## Selected (relative paths)',
    ...selectedPaths.map((p) => `- ${path.relative(targetDir, p)}`),
  ];
  return `${lines.join('\n')}\n`;
}

function materializeSelectedImages(images, outputDir) {
  const selectedDir = path.join(outputDir, 'selected-photos');
  fs.mkdirSync(selectedDir, { recursive: true });

  for (const img of images) {
    const ext = path.extname(img.fileName);
    const safeBase = path.basename(img.fileName, ext).replace(/[\\/:*?"<>|]/g, '_');
    const numbered = `${String(img.no).padStart(3, '0')}_${img.id}_${safeBase}${ext}`;
    const toPath = path.join(selectedDir, numbered);
    fs.copyFileSync(img.filePath, toPath);
  }
}

async function enrichExifSummaries(images) {
  for (const img of images) {
    img.exifSummary = await readExifSummary(img.filePath);
  }
}

async function readExifSummary(filePath) {
  try {
    const tags = await ExifReader.load(filePath);
    const shutter = pickExif(tags, ['ExposureTime', 'ShutterSpeedValue']);
    const aperture = pickExif(tags, ['FNumber', 'ApertureValue']);
    const iso = pickExif(tags, ['ISO', 'PhotographicSensitivity']);
    const focal = pickExif(tags, ['FocalLength', 'FocalLengthIn35mmFilm']);
    const parts = [];
    if (shutter) parts.push(`SS ${shutter}`);
    if (aperture) parts.push(`F ${aperture}`);
    if (iso) parts.push(`ISO ${iso}`);
    if (focal) parts.push(`FL ${focal}`);
    return parts.join(', ');
  } catch (_) {
    return '';
  }
}

function pickExif(tags, keys) {
  for (const key of keys) {
    const v = tags[key]?.description;
    if (v) return String(v);
  }
  return '';
}

async function synthesizeReview({ batchReports, args, prompt }) {
  const toneRule =
    args.feedbackStyle === 'strict'
      ? '- 率直な口調。ただし人格否定や侮辱表現は禁止'
      : '- コーチング口調（率直 + 敬意 + 実行可能性）で記述';
  const synthesisInstruction = [
    '以下はバッチ別の講評結果です。',
    'これらを統合し、全セットに対する最終講評を作成してください。',
    '',
    '[撮影情報]',
    `- ジャンル: ${args.genre || 'その他'}`,
    `- 撮影意図（1文）: ${args.intent || '未記入'}`,
    `- 使用機材: ${args.camera || '未記入'}`,
    `- 制約条件: ${args.constraints || '未記入'}`,
    `- 特記事項: ${args.notes || '未記入'}`,
    '',
    '[要件]',
    '- A/B/Cの基準を統一し直す',
    '- 重複削除の優先順位を示す',
    '- 並び順を提示する',
    '- 次回アクション3つは実行可能な命令文にする',
    '- 講評テーブルの先頭列を ID とし、P001 形式のIDを必ず記載する',
    '- Markdownの表は使わない。縦に読める箇条書き形式で出力する',
    '- 各写真で強みを1つは明示する',
    '- 改善点は「理由 + 次アクション」を書く',
    '- 各写真に観察根拠と自信度（High/Mid/Low）を必ず含める',
    `- 各写真に視点タグを付ける（候補: ${PRO_VIEWPOINT_TAGS.join(' / ')}）`,
    '- 全体で「日本タグ1つ以上」「海外タグ1つ以上」を必須にする',
    '- 根拠が弱い場合は断定せず、推測として明示する',
    '- 除去不能な現場要素（配線・柵・観客写り込み）は減点しない',
    '- 代わりに制約前提の改善策を提示する',
    args.reviewMode === 'deep10'
      ? '- deep10モード: 各写真の強み/改善点は十分な具体性で書く（短文で流さない）'
      : '- quickモード: 全体傾向を優先し、簡潔に書く',
    toneRule,
    '',
    '[バッチ講評]',
    ...batchReports.map((report, idx) => `\n### Batch ${idx + 1}\n${report}`),
  ].join('\n');

  return callResponsesAPI({
    model: args.model,
    systemPrompt: prompt.systemPrompt,
    userContent: [{ type: 'input_text', text: synthesisInstruction }],
  });
}

async function formatReadableReport({ finalReport, args }) {
  const instruction = [
    '以下の講評文を、人間が読みやすい実務レポート形式に再編集してください。',
    '原文の評価意図は維持し、情報を削りすぎないこと。',
    '',
    '[出力ルール]',
    '- 日本語',
    '- 見出しを使う',
    '- 各節は短い箇条書きを中心にする',
    '- 各箇条書きは1-2文',
    '- Markdownの表は使わない',
    '- 1行が長くなりすぎないように適度に改行する',
    '- 重要IDは必ず残す',
    '',
    '[必須セクション順]',
    '1. 結論（3行以内）',
    '2. 採用候補TOP5（IDつき）',
    '3. 外す候補TOP5（IDつき）',
    '4. 視点タグ別コメント（日本/海外を分けて記述）',
    '5. 根拠サマリー（観察事実ベースで3-5点）',
    '6. 制約考慮メモ（現場で不可避な要素と対応策）',
    '7. 改善テーマ（3点）',
    '8. 次回撮影チェックリスト（5項目）',
    '9. 次回提出ガイド（何枚・どのバリエーションか）',
    '',
    '[撮影情報]',
    `- ジャンル: ${args.genre || 'その他'}`,
    `- 意図: ${args.intent || '未記入'}`,
    '',
    '[原文]',
    finalReport,
  ].join('\n');

  return callResponsesAPI({
    model: args.model,
    systemPrompt: 'あなたは写真講評を編集するエディター。読みやすさ最優先で再構成する。',
    userContent: [{ type: 'input_text', text: instruction }],
  });
}

async function createSlideMarkdown({ readableReport, args }) {
  const instruction = [
    '以下の講評レポートを、Marp互換のスライドMarkdownに変換してください。',
    '',
    '[出力ルール]',
    '- 先頭に `---` を入れる',
    '- 2ページ目以降は `---` で区切る',
    '- 1ページあたり最大6行',
    '- 箇条書き中心',
    '- 文字数を詰め込みすぎない',
    '',
    '[ページ構成]',
    '1. タイトル',
    '2. 結論',
    '3. 採用候補TOP5',
    '4. 外す候補TOP5',
    '5. 改善テーマ3点',
    '6. 次回撮影チェックリスト',
    '7. 次回アクション3つ',
    '',
    '[タイトル情報]',
    `- ジャンル: ${args.genre || 'その他'}`,
    `- 意図: ${args.intent || '未記入'}`,
    '',
    '[元レポート]',
    readableReport,
  ].join('\n');

  return callResponsesAPI({
    model: args.model,
    systemPrompt: 'あなたは講評内容をスライド化する編集者。短く、明確に整理する。',
    userContent: [{ type: 'input_text', text: instruction }],
  });
}

async function callResponsesAPI({ model, systemPrompt, userContent }) {
  const payload = {
    model,
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: systemPrompt }],
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return extractTextFromOutput(data).trim();
}

function extractTextFromOutput(data) {
  if (!Array.isArray(data.output)) return '';
  const textParts = [];
  for (const item of data.output) {
    if (!Array.isArray(item.content)) continue;
    for (const chunk of item.content) {
      if (chunk.type === 'output_text' && chunk.text) {
        textParts.push(chunk.text);
      }
    }
  }
  return textParts.join('\n');
}

function escapeCsv(value) {
  return String(value).replace(/"/g, '""');
}

function prettifyReportMarkdown(markdown) {
  const noTable = convertTablesToBullets(markdown);
  return wrapLongLines(noTable, 84);
}

function convertTablesToBullets(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    if (isTableLine(lines[i])) {
      const tableLines = [];
      while (i < lines.length && isTableLine(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const converted = tableToBulletBlock(tableLines);
      if (converted) {
        out.push(converted, '');
      }
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function isTableLine(line) {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|');
}

function tableToBulletBlock(tableLines) {
  if (tableLines.length < 2) return tableLines.join('\n');
  const headers = splitTableRow(tableLines[0]);
  if (headers.length === 0) return tableLines.join('\n');

  let rowStart = 1;
  if (/^\|\s*[-:| ]+\|\s*$/.test(tableLines[1].trim())) {
    rowStart = 2;
  }

  const rows = [];
  for (let i = rowStart; i < tableLines.length; i += 1) {
    const cells = splitTableRow(tableLines[i]);
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return '';

  const lines = ['### 評価一覧'];
  for (const cells of rows) {
    const first = `${headers[0] || '項目'}: ${cells[0] || ''}`.trim();
    lines.push(`- ${first}`);
    for (let c = 1; c < headers.length; c += 1) {
      const h = headers[c] || `列${c + 1}`;
      const v = cells[c] || '';
      if (!v) continue;
      lines.push(`  ${h}: ${v}`);
    }
  }
  return lines.join('\n');
}

function splitTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function wrapLongLines(markdown, maxWidth) {
  const lines = markdown.split('\n');
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length <= maxWidth ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('- ') ||
      trimmed.startsWith('```') ||
      trimmed.startsWith('  ') ||
      /^\d+\.\s/.test(trimmed)
    ) {
      out.push(line);
      continue;
    }
    out.push(...softWrap(line, maxWidth));
  }
  return out.join('\n');
}

function softWrap(line, maxWidth) {
  const words = line.split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    if (!cur) {
      cur = w;
      continue;
    }
    if ((cur + ' ' + w).length <= maxWidth) {
      cur += ' ' + w;
    } else {
      out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
}

main().catch((error) => {
  console.error('Failed:', error.message);
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.output) {
      fs.mkdirSync(path.resolve(args.output), { recursive: true });
      fs.writeFileSync(
        path.join(path.resolve(args.output), 'error.txt'),
        `[${new Date().toISOString()}] ${error.message}\n`,
        'utf-8'
      );
    }
  } catch (_) {
    // no-op
  }
  process.exit(1);
});
