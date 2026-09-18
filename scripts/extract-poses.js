#!/usr/bin/env node
/**
 * Extracts the 9 character poses from sprites.png (864x1184, checkerboard background)
 * Uses flood-fill background removal + connected component detection (no blind grid).
 * Outputs: public/assets/sprites/alma-poses.png (uniform grid of poses)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const INPUT = '/root/Juego-Alma/sprites.png';
const OUT_DIR = '/root/Juego-Alma/public/assets/sprites';
const CELL_W = 170;
const CELL_H = 210;
const FIG_MAX_H = 196;
const FIG_MAX_W = 160;

function isBg(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return (mx - mn) <= 14 && mn >= 185; // achromatic + light => checkerboard
}

async function main() {
    const { data, info } = await sharp(INPUT).raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height, C = info.channels;
    console.log(`Image ${W}x${H}, channels ${C}`);

    // 1. Background mask via flood fill from borders (keeps inner whites like eyes)
    const bg = new Uint8Array(W * H);
    const stack = [];
    const push = (x, y) => {
        const p = y * W + x;
        if (bg[p]) return;
        const i = p * C;
        if (!isBg(data[i], data[i + 1], data[i + 2])) return;
        bg[p] = 1;
        stack.push(p);
    };
    for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
    for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
    while (stack.length) {
        const p = stack.pop();
        const x = p % W, y = (p - x) / W;
        if (x > 0) push(x - 1, y);
        if (x < W - 1) push(x + 1, y);
        if (y > 0) push(x, y - 1);
        if (y < H - 1) push(x, y + 1);
    }
    let bgCount = 0;
    for (let i = 0; i < bg.length; i++) if (bg[i]) bgCount++;
    console.log(`Background pixels: ${bgCount} (${(bgCount / (W * H) * 100).toFixed(1)}%)`);

    // 2. Connected components on foreground
    const label = new Int32Array(W * H).fill(-1);
    const comps = [];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const p = y * W + x;
            if (bg[p] || label[p] !== -1) continue;
            const id = comps.length;
            let minX = x, maxX = x, minY = y, maxY = y, area = 0;
            const q = [p];
            label[p] = id;
            while (q.length) {
                const cp = q.pop();
                const cx = cp % W, cy = (cp - cx) / W;
                area++;
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;
                const nb = [];
                if (cx > 0) nb.push(cp - 1);
                if (cx < W - 1) nb.push(cp + 1);
                if (cy > 0) nb.push(cp - W);
                if (cy < H - 1) nb.push(cp + W);
                for (const n of nb) {
                    if (!bg[n] && label[n] === -1) { label[n] = id; q.push(n); }
                }
            }
            comps.push({ id, minX, maxX, minY, maxY, area });
        }
    }

    // 3. Filter real figures (big areas) and sort top-to-bottom, left-to-right
    const figures = comps.filter(c => c.area > 1500)
        .sort((a, b) => (Math.abs(a.minY - b.minY) > 60 ? a.minY - b.minY : a.minX - b.minX));
    console.log(`\nFound ${figures.length} figures (largest components):`);
    figures.forEach((f, i) => {
        console.log(`  #${i}: bbox x[${f.minX}-${f.maxX}] y[${f.minY}-${f.maxY}] ` +
            `size ${f.maxX - f.minX + 1}x${f.maxY - f.minY + 1} area ${f.area}`);
    });

    // 4. Crop each figure with transparent background into a uniform cell
    const cells = [];
    for (let i = 0; i < figures.length; i++) {
        const f = figures[i];
        const pad = 4;
        const left = Math.max(0, f.minX - pad), top = Math.max(0, f.minY - pad);
        const right = Math.min(W - 1, f.maxX + pad), bottom = Math.min(H - 1, f.maxY + pad);
        const cw = right - left + 1, ch = bottom - top + 1;

        const buf = Buffer.alloc(cw * ch * 4);
        for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
                const sp = (top + y) * W + (left + x);
                const si = sp * C, di = (y * cw + x) * 4;
                const a = bg[sp] ? 0 : 255;
                buf[di] = data[si]; buf[di + 1] = data[si + 1]; buf[di + 2] = data[si + 2]; buf[di + 3] = a;
            }
        }
        const outPath = path.join(OUT_DIR, `pose_${String(i).padStart(2, '0')}.png`);
        await sharp(buf, { raw: { width: cw, height: ch, channels: 4 } })
            .png({ compressionLevel: 9 }).toFile(outPath);
        cells.push({ path: outPath, w: cw, h: ch });
    }

    // 5. Composite into uniform cells (scaled to fit, feet at bottom)
    const cols = 3;
    const rows = Math.ceil(cells.length / cols);
    const sheetW = cols * CELL_W, sheetH = rows * CELL_H;
    const layers = [];
    for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const scale = Math.min(FIG_MAX_H / c.h, FIG_MAX_W / c.w, 1);
        const tw = Math.round(c.w * scale), th = Math.round(c.h * scale);
        const col = i % cols, row = Math.floor(i / cols);
        // bottom-center inside the cell
        const left = col * CELL_W + Math.round((CELL_W - tw) / 2);
        const top = row * CELL_H + (CELL_H - th) - 6;
        layers.push({ input: c.path, left, top, width: tw, height: th });
    }

    await sharp({
        create: { width: sheetW, height: sheetH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite(layers).png({ compressionLevel: 9 }).toFile(path.join(OUT_DIR, 'alma-poses.png'));

    console.log(`\nCreated alma-poses.png: ${sheetW}x${sheetH} (${cols}x${rows} cells of ${CELL_W}x${CELL_H}, ${cells.length} poses)`);
    console.log(`Phaser frame index = row * ${cols} + col`);

    // Contact sheet with index labels for visual verification
    const labelLayers = [];
    for (let i = 0; i < figures.length; i++) {
        labelLayers.push({
            input: { text: { text: ` #${i} `, rgba: true, dpi: 96, font: 'sans', fontSize: 34 } },
            left: (i % cols) * CELL_W + 4,
            top: Math.floor(i / cols) * CELL_H + 4,
        });
    }
    await sharp({
        create: { width: sheetW, height: sheetH, channels: 4, background: { r: 30, g: 30, b: 60, alpha: 1 } }
    }).composite([...layers, ...labelLayers]).png().toFile('/root/Juego-Alma/scripts/poses-contact-sheet.png');
    console.log('Contact sheet: scripts/poses-contact-sheet.png');

    cells.forEach(c => fs.unlinkSync(c.path));
}

main().catch(e => { console.error(e); process.exit(1); });