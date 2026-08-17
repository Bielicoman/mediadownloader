const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. Official Premiere + Download Arrow SVG Logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Adobe Premiere Pro Deep Navy Background with Blue Border -->
  <rect x="24" y="24" width="464" height="464" rx="104" ry="104" fill="#00005b" stroke="#0066ff" stroke-width="20" />
  
  <!-- Classic Premiere Typography 'Pr' -->
  <text x="75" y="325" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="220" font-weight="900" fill="#99c2ff" letter-spacing="-6">Pr</text>
  
  <!-- Sleek Cyan Download Arrow & Dock Platform -->
  <g fill="#00d2ff" transform="translate(365, 235)">
    <path d="M-18 -65 h36 v70 h32 L0 68 L-50 5 h32 Z" />
    <rect x="-46" y="86" width="92" height="16" rx="5" />
  </g>
</svg>`;

const rootDir = 'd:\\IA\\02_Plugins\\ADOBE PREMIERE\\MediaDownloader';

// Write SVG icons
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

function renderOfficialPrIcon(size) {
    const buf = Buffer.alloc(size * size * 4);
    const cx = size / 2;
    const cy = size / 2;
    const cornerR = size * 0.22; // Squircle roundness

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
                // Outer Border or Dark Blue Background
                const isBorder = (distBox > cornerR - Math.max(1.5, size * 0.04));
                let bgR = 0;
                let bgG = 0;
                let bgB = 91; // #00005b

                if (isBorder) {
                    bgR = 0; bgG = 102; bgB = 255; // #0066ff
                }

                buf[idx] = bgR;
                buf[idx + 1] = bgG;
                buf[idx + 2] = bgB;
                buf[idx + 3] = 255;

                // Normalized coordinate for 'P' and 'r' and Download Arrow
                const nx = (x - cx) / (size * 0.5);
                const ny = (y - cy) / (size * 0.5);

                // Draw 'P'
                // Stem of P
                const inPStem = (nx >= -0.75 && nx <= -0.55 && ny >= -0.45 && ny <= 0.45);
                // Top loop of P
                const inPLoopTop = (nx >= -0.75 && nx <= -0.22 && ny >= -0.45 && ny <= -0.28);
                const inPLoopBottom = (nx >= -0.75 && nx <= -0.22 && ny >= -0.12 && ny <= 0.05);
                const inPLoopRight = (nx >= -0.36 && nx <= -0.20 && ny >= -0.45 && ny <= 0.05);
                const inP = inPStem || inPLoopTop || inPLoopBottom || inPLoopRight;

                // Draw 'r'
                // Stem of r
                const inRStem = (nx >= -0.15 && nx <= 0.02 && ny >= -0.15 && ny <= 0.45);
                // Hook of r
                const inRHook = (nx >= -0.15 && nx <= 0.20 && ny >= -0.15 && ny <= -0.01);
                const inR = inRStem || inRHook;

                if (inP || inR) {
                    buf[idx] = 153;     // #99c2ff
                    buf[idx + 1] = 194;
                    buf[idx + 2] = 255;
                }

                // Draw Download Arrow on the right
                const inArrowStem = (nx >= 0.35 && nx <= 0.49 && ny >= -0.38 && ny <= 0.10);
                const inArrowHead = (ny >= 0.05 && ny <= 0.35 && Math.abs(nx - 0.42) <= (0.35 - ny) * 0.9);
                const inArrowBase = (nx >= 0.25 && nx <= 0.59 && ny >= 0.42 && ny <= 0.52);

                if (inArrowStem || inArrowHead || inArrowBase) {
                    buf[idx] = 0;       // #00d2ff
                    buf[idx + 1] = 210;
                    buf[idx + 2] = 255;
                }
            } else {
                buf[idx] = 0; buf[idx + 1] = 0; buf[idx + 2] = 0; buf[idx + 3] = 0;
            }
        }
    }
    return buf;
}

const fav32 = createPNG(32, 32, renderOfficialPrIcon(32));
const fav128 = createPNG(128, 128, renderOfficialPrIcon(128));
const fav512 = createPNG(512, 512, renderOfficialPrIcon(512));

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

console.log('🎉 Official Adobe Premiere + Download Arrow icon generated as SVG, ICO, PNG and deployed to website favicon and ZXP plugin!');
