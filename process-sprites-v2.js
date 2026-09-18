import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'personajes juego alma', 'sprites alma');
const outDir = path.join(__dirname, 'public', 'assets', 'sprites');

fs.mkdirSync(outDir, { recursive: true });

const files = ['al01.png', 'al02.png', 'al03.png', 'al04.png'];
const FRAME_W = 120;
const FRAME_H = 160;
const TOTAL_W = FRAME_W * 4;

// Process each frame and combine into spritesheet
const frames = [];
for (const f of files) {
  const buf = await sharp(path.join(srcDir, f))
    .resize(FRAME_W, FRAME_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  frames.push(buf);
}

// Create spritesheet by compositing all 4 frames side by side
const composite = sharp({
  create: { width: TOTAL_W, height: FRAME_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
});

const layers = frames.map((buf, i) => ({
  input: buf,
  left: i * FRAME_W,
  top: 0
}));

await composite.composite(layers).png().toFile(path.join(outDir, 'alma-walk.png'));
console.log(`alma-walk.png: ${TOTAL_W}x${FRAME_H} (4 frames of ${FRAME_W}x${FRAME_H})`);

// Save idle frame (al02)
await sharp(path.join(srcDir, 'al02.png'))
  .resize(FRAME_W, FRAME_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(path.join(outDir, 'alma-idle.png'));
console.log('alma-idle.png saved (al02)');

console.log('Done!');
