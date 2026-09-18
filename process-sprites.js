const sharp = require('sharp');
const path = require('path');
const dir = path.join(__dirname, 'public', 'assets', 'sprites');

async function process(input, output) {
  const img = sharp(input);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a > 10 && (r < 240 || g < 240 || b < 240)) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  
  const pad = 20;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(info.width - 1, maxX + pad);
  maxY = Math.min(info.height - 1, maxY + pad);
  
  const { data: rd, info: ri } = await sharp(input)
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize(120, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  for (let j = 0; j < rd.length; j += 4) {
    if (rd[j] > 235 && rd[j+1] > 235 && rd[j+2] > 235) rd[j+3] = 0;
  }
  
  await sharp(rd, { raw: { width: ri.width, height: ri.height, channels: 4 } })
    .png()
    .toFile(output);
}

const files = [
  'alma-idle.png',
  'alma-run-right.png',
  'alma-run-left.png',
  'alma-walk-left.png',
  'alma-jump.png',
  'alma-fall.png',
  'alma-crouch.png',
  'alma-crouch-left.png',
  'alma-crouch-right.png',
];

(async () => {
  for (const f of files) {
    const fp = path.join(dir, f);
    await process(fp, fp);
    console.log(f + ' done');
  }
  console.log('ALL DONE');
})();
