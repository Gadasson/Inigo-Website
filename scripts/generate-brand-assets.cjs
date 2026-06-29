/**
 * Generates Inigo favicon, apple-touch-icon, and invite OG image.
 * Run: node scripts/generate-brand-assets.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const LOGO_SVG = path.join(ROOT, 'public/images/heart_logo_last.svg');

const INIGO_GREEN = '#6F7B5E';
const INIGO_GREEN_LIGHT = '#A3AF91';
const INIGO_CREAM = '#FAFAF8';

async function generateIcons() {
  const logo = fs.readFileSync(LOGO_SVG);

  const icon32 = await sharp(logo).resize(32, 32, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const icon180 = await sharp(logo).resize(180, 180, { fit: 'contain', background: '#ffffff' }).png().toBuffer();

  await sharp(icon32).toFile(path.join(ROOT, 'src/app/icon.png'));
  await sharp(icon180).toFile(path.join(ROOT, 'src/app/apple-icon.png'));
  await sharp(icon180).toFile(path.join(ROOT, 'public/apple-touch-icon.png'));

  // Multi-size ICO for legacy /favicon.ico (iOS share sheet, older browsers)
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map((size) =>
      sharp(logo).resize(size, size, { fit: 'contain', background: '#ffffff' }).png().toBuffer(),
    ),
  );
  await writeIco(path.join(ROOT, 'src/app/favicon.ico'), pngs, sizes);
}

/** Minimal ICO writer (PNG-embedded) for favicon.ico */
async function writeIco(filePath, pngBuffers, sizes) {
  const images = pngBuffers.map((buf, i) => ({ buf, size: sizes[i] }));
  const headerSize = 6 + images.length * 16;
  let offset = headerSize;
  const entries = images.map(({ buf, size }) => {
    const entry = { size, offset, buf };
    offset += buf.length;
    return entry;
  });

  const total = offset;
  const out = Buffer.alloc(total);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(images.length, 4);

  entries.forEach((e, i) => {
    const base = 6 + i * 16;
    out.writeUInt8(e.size === 256 ? 0 : e.size, base);
    out.writeUInt8(e.size === 256 ? 0 : e.size, base + 1);
    out.writeUInt8(0, base + 2);
    out.writeUInt8(0, base + 3);
    out.writeUInt16LE(1, base + 4);
    out.writeUInt16LE(32, base + 6);
    out.writeUInt32LE(e.buf.length, base + 8);
    out.writeUInt32LE(e.offset, base + 12);
  });

  entries.forEach((e) => e.buf.copy(out, e.offset));
  fs.writeFileSync(filePath, out);
}

async function generateInviteOg() {
  const width = 1200;
  const height = 630;

  const gradientSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${INIGO_CREAM}"/>
          <stop offset="45%" stop-color="#EEF2E8"/>
          <stop offset="100%" stop-color="${INIGO_GREEN_LIGHT}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <text x="600" y="500" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-size="52" font-weight="600" letter-spacing="-0.02em" fill="${INIGO_GREEN}">
        inigo
      </text>
      <text x="600" y="555" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-size="28" font-weight="400" fill="${INIGO_GREEN}" fill-opacity="0.75">
        presence · connection · growth
      </text>
    </svg>
  `;

  const logo = fs.readFileSync(LOGO_SVG);
  const logoPng = await sharp(logo).resize(280, 280, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  const background = await sharp(Buffer.from(gradientSvg)).png().toBuffer();

  const outPath = path.join(ROOT, 'public/static/share/invite.jpg');
  await sharp(background)
    .composite([{ input: logoPng, top: 120, left: Math.round((width - 280) / 2) }])
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toFile(outPath);

  // Keep default.jpg in sync until backend og:image points at invite.jpg
  await sharp(outPath).toFile(path.join(ROOT, 'public/static/share/default.jpg'));

  const stat = fs.statSync(outPath);
  console.log(`invite.jpg: ${Math.round(stat.size / 1024)}KB`);
}

async function main() {
  await generateIcons();
  await generateInviteOg();
  console.log('Brand assets generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
