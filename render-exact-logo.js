const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. Create pixel-perfect SVG matching user image
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#0284c7" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Squircle Rounded Rect -->
  <rect x="32" y="32" width="448" height="448" rx="112" ry="112" fill="url(#cloudGrad)" filter="url(#glow)" />
  <rect x="32" y="32" width="448" height="448" rx="112" ry="112" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="6" />

  <!-- White Cloud with Arrow -->
  <g fill="#ffffff">
    <!-- Cloud Silhouette -->
    <path d="M380 270c0-11-4-21-10-30-2-3-4-5-7-7-1-1-2-2-4-3 1-5 2-11 2-16 0-44-36-80-80-80-36 0-66 24-76 57-9-6-19-9-31-9-30 0-54 24-54 54 0 4 1 8 2 12-25 8-42 31-42 58 0 33 27 60 60 60h200c44 0 80-36 80-80 0-6-1-11-2-16h2z" />
  </g>

  <!-- Cutout Arrow (Cyan/Blue Arrow inside Cloud) -->
  <g fill="url(#cloudGrad)">
    <!-- Stem -->
    <rect x="234" y="220" width="44" height="60" rx="4" />
    <!-- Pointer -->
    <polygon points="210,270 302,270 256,325" />
  </g>
</svg>`;

// Write SVG icons
const rootDir = 'd:\\IA\\02_Plugins\\ADOBE PREMIERE\\MediaDownloader';
fs.writeFileSync(path.join(rootDir, 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(rootDir, 'website', 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(rootDir, 'com.alexascencio.mediadownloader', 'icons', 'icon.svg'), svgContent);

// 2. High Quality Pure PNG Generator for Favicons
function createPNG(width, height, rgbaBuffer) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    function createChunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const chunkType = Buffer.from(type, 'ascii');
        const crcData = Buffer.concat([chunkType, data]);
        const crc = crc32(crcData);
        const crcBuf = Buffer.alloc(4);
        crcBuf.writeUInt32BE(crc, 0);
        return Buffer.concat([len, chunkType, data, crcBuf]);
    }

    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8;
    ihdrData[9] = 6; // RGBA
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;
    const ihdrChunk = createChunk('IHDR', ihdrData);

    const scanlineLength = width * 4 + 1;
    const rawData = Buffer.alloc(height * scanlineLength);

    for (let y = 0; y < height; y++) {
        const scanlineOffset = y * scanlineLength;
        rawData[scanlineOffset] = 0;
        const rowData = rgbaBuffer.slice(y * width * 4, (y + 1) * width * 4);
        rowData.copy(rawData, scanlineOffset + 1);
    }

    const compressed = zlib.deflateSync(rawData);
    const idatChunk = createChunk('IDAT', compressed);
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
}

function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
}

function renderExactIcon(size) {
    const buf = Buffer.alloc(size * size * 4);
    const cx = size / 2;
    const cy = size / 2;
    const cornerR = size * 0.28; // Squircle roundness

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const dx = Math.abs(x - cx);
            const dy = Math.abs(y - cy);
            const maxBox = cx - cornerR;
            const hx = Math.max(0, dx - maxBox);
            const hy = Math.max(0, dy - maxBox);
            const distBox = Math.sqrt(hx * hx + hy * hy);

            if (distBox <= cornerR) {
                // Vibrant Blue to Cyan Gradient
                const t = y / size;
                const bgR = Math.round(56 * (1 - t) + 2 * t);
                const bgG = Math.round(189 * (1 - t) + 132 * t);
                const bgB = Math.round(248 * (1 - t) + 199 * t);

                buf[idx] = bgR;
                buf[idx + 1] = bgG;
                buf[idx + 2] = bgB;
                buf[idx + 3] = 255;

                // Normalized coordinate for cloud drawing
                const nx = (x - cx) / (size * 0.5);
                const ny = (y - cy) / (size * 0.5);

                // Cloud body geometry
                const inMain = (Math.pow(nx, 2) + Math.pow(ny + 0.12, 2)) < 0.15;
                const inLeft = (Math.pow(nx + 0.28, 2) + Math.pow(ny - 0.02, 2)) < 0.10;
                const inRight = (Math.pow(nx - 0.28, 2) + Math.pow(ny - 0.02, 2)) < 0.09;
                const inBase = (Math.abs(nx) <= 0.38 && ny >= -0.05 && ny <= 0.22);

                if (inMain || inLeft || inRight || inBase) {
                    // Arrow cutout
                    const inArrowStem = (Math.abs(nx) <= 0.08 && ny >= -0.08 && ny <= 0.10);
                    const inArrowHead = (ny >= 0.05 && ny <= 0.25 && Math.abs(nx) <= (0.25 - ny) * 0.9);

                    if (inArrowStem || inArrowHead) {
                        // Blue cutout inside cloud
                        buf[idx] = bgR;
                        buf[idx + 1] = bgG;
                        buf[idx + 2] = bgB;
                    } else {
                        // Crisp White Cloud
                        buf[idx] = 255;
                        buf[idx + 1] = 255;
                        buf[idx + 2] = 255;
                    }
                }
            } else {
                buf[idx] = 0; buf[idx + 1] = 0; buf[idx + 2] = 0; buf[idx + 3] = 0;
            }
        }
    }
    return buf;
}

const fav32 = createPNG(32, 32, renderExactIcon(32));
const fav128 = createPNG(128, 128, renderExactIcon(128));
const fav512 = createPNG(512, 512, renderExactIcon(512));

// Save in all locations
[
    path.join(rootDir, 'favicon.png'),
    path.join(rootDir, 'favicon.ico'),
    path.join(rootDir, 'apple-touch-icon.png'),
    path.join(rootDir, 'website', 'favicon.png'),
    path.join(rootDir, 'website', 'favicon.ico'),
    path.join(rootDir, 'website', 'apple-touch-icon.png'),
    path.join(rootDir, 'com.alexascencio.mediadownloader', 'icons', 'iconNormal.png'),
    path.join(rootDir, 'com.alexascencio.mediadownloader', 'icons', 'iconRollOver.png'),
    path.join(rootDir, 'com.alexascencio.mediadownloader', 'icons', 'iconDarkNormal.png'),
    path.join(rootDir, 'com.alexascencio.mediadownloader', 'icons', 'iconDarkRollOver.png')
].forEach(p => {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (p.includes('apple-touch-icon')) {
        fs.writeFileSync(p, fav128);
    } else {
        fs.writeFileSync(p, fav32);
    }
});

console.log('🎉 Exact logo generated as SVG, ICO, PNG and deployed to website favicon and ZXP plugin!');
