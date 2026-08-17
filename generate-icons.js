const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Lightweight Pure Node.js PNG encoder
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

    // IHDR
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // 8 bit depth
    ihdrData[9] = 6; // Color type 6 (RGBA)
    ihdrData[10] = 0; // Compression
    ihdrData[11] = 0; // Filter
    ihdrData[12] = 0; // Interlace
    const ihdrChunk = createChunk('IHDR', ihdrData);

    // IDAT (Scanlines with filter byte 0)
    const scanlineLength = width * 4 + 1;
    const rawData = Buffer.alloc(height * scanlineLength);

    for (let y = 0; y < height; y++) {
        const scanlineOffset = y * scanlineLength;
        rawData[scanlineOffset] = 0; // Filter None
        const rowData = rgbaBuffer.slice(y * width * 4, (y + 1) * width * 4);
        rowData.copy(rawData, scanlineOffset + 1);
    }

    const compressed = zlib.deflateSync(rawData);
    const idatChunk = createChunk('IDAT', compressed);

    // IEND
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
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

// Draw a modern Cloud + Download Arrow + Glow Icon
function generateIconRGBA(size, variant) {
    const buf = Buffer.alloc(size * size * 4);
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.44;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Rounded Square Background
            const cornerR = size * 0.22;
            const hx = Math.max(0, Math.abs(dx) - (cx - cornerR));
            const hy = Math.max(0, Math.abs(dy) - (cy - cornerR));
            const distBox = Math.sqrt(hx * hx + hy * hy);

            if (distBox <= cornerR) {
                // Background Gradient
                const t = y / size;
                let bgR = Math.round(0 + t * 0);
                let bgG = Math.round(120 + t * 90);
                let bgB = Math.round(212 + t * 43); // #0078d4 to #00d2ff

                if (variant === 'dark') {
                    bgR = Math.round(12 + t * 6);
                    bgG = Math.round(14 + t * 8);
                    bgB = Math.round(20 + t * 12);
                } else if (variant === 'rollover') {
                    bgR = Math.round(0 + t * 20);
                    bgG = Math.round(140 + t * 100);
                    bgB = Math.round(230 + t * 25);
                }

                // Border subtle glow
                if (distBox > cornerR - 1.5) {
                    bgR = 0; bgG = 210; bgB = 255;
                }

                buf[idx] = bgR;
                buf[idx + 1] = bgG;
                buf[idx + 2] = bgB;
                buf[idx + 3] = 255;

                // Inner Arrow & Cloud symbol (White or Cyan)
                const nx = (x - cx) / (size * 0.5);
                const ny = (y - cy) / (size * 0.5);

                // Cloud body
                const inCloud1 = (Math.pow(nx + 0.25, 2) + Math.pow(ny + 0.15, 2)) < 0.14;
                const inCloud2 = (Math.pow(nx - 0.25, 2) + Math.pow(ny + 0.15, 2)) < 0.12;
                const inCloud3 = (Math.pow(nx, 2) + Math.pow(ny + 0.25, 2)) < 0.18;
                const inCloudBase = (Math.abs(nx) < 0.45 && Math.abs(ny + 0.05) < 0.15);

                // Download Arrow
                const inArrowStem = (Math.abs(nx) < 0.12 && ny >= -0.1 && ny <= 0.35);
                const inArrowHead = (ny >= 0.25 && ny <= 0.55 && Math.abs(nx) <= (0.55 - ny) * 1.1);

                if (inCloud1 || inCloud2 || inCloud3 || inCloudBase || inArrowStem || inArrowHead) {
                    if (variant === 'dark') {
                        buf[idx] = 0;
                        buf[idx + 1] = 210;
                        buf[idx + 2] = 255; // Cyan symbol on dark
                        buf[idx + 3] = 255;
                    } else {
                        buf[idx] = 255;
                        buf[idx + 1] = 255;
                        buf[idx + 2] = 255; // White symbol on gradient
                        buf[idx + 3] = 255;
                    }
                }
            } else {
                buf[idx] = 0;
                buf[idx + 1] = 0;
                buf[idx + 2] = 0;
                buf[idx + 3] = 0; // Transparent
            }
        }
    }
    return buf;
}

// Generate all icon sizes and variants
const sizes = [16, 23, 32, 48, 64, 128, 512];
const pluginIconsDir = path.join(__dirname, 'com.alexascencio.mediadownloader', 'icons');
const websiteIconsDir = path.join(__dirname, 'website', 'icons');
const rootIconsDir = path.join(__dirname, 'icons');

[pluginIconsDir, websiteIconsDir, rootIconsDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

// CEP Extension Icons
fs.writeFileSync(path.join(pluginIconsDir, 'iconNormal.png'), createPNG(32, 32, generateIconRGBA(32, 'normal')));
fs.writeFileSync(path.join(pluginIconsDir, 'iconRollOver.png'), createPNG(32, 32, generateIconRGBA(32, 'rollover')));
fs.writeFileSync(path.join(pluginIconsDir, 'iconDisabled.png'), createPNG(32, 32, generateIconRGBA(32, 'dark')));
fs.writeFileSync(path.join(pluginIconsDir, 'iconDarkNormal.png'), createPNG(32, 32, generateIconRGBA(32, 'dark')));
fs.writeFileSync(path.join(pluginIconsDir, 'iconDarkRollOver.png'), createPNG(32, 32, generateIconRGBA(32, 'rollover')));

// Website Favicons & Touch Icons
const favicon32 = createPNG(32, 32, generateIconRGBA(32, 'normal'));
const favicon128 = createPNG(128, 128, generateIconRGBA(128, 'normal'));
const favicon512 = createPNG(512, 512, generateIconRGBA(512, 'normal'));

fs.writeFileSync(path.join(__dirname, 'favicon.png'), favicon32);
fs.writeFileSync(path.join(__dirname, 'favicon.ico'), favicon32);
fs.writeFileSync(path.join(__dirname, 'apple-touch-icon.png'), favicon128);

fs.writeFileSync(path.join(__dirname, 'website', 'favicon.png'), favicon32);
fs.writeFileSync(path.join(__dirname, 'website', 'favicon.ico'), favicon32);
fs.writeFileSync(path.join(__dirname, 'website', 'apple-touch-icon.png'), favicon128);

console.log('✅ Generated all PNG icons for CEP Extension & Website Favicon!');
