#!/usr/bin/env node
/**
 * Genera el arte del juego en SVG y lo rasteriza a PNG (sharp).
 * - Enemigos: 4 familiares cartoon, con ciclo de andar de 4 fotogramas.
 * - Tiles: suelo con hierba y plataforma de madera.
 * - Fondos: cielo con sol, colinas lejanas y arbustos (parallax 3 capas).
 * - UI: estrella, corazones y botones táctiles.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUT = '/root/Juego-Alma/public/assets/sprites';
fs.mkdirSync(OUT, { recursive: true });

const svgToPng = (svg, file, w, h) =>
    sharp(Buffer.from(svg))
        .resize(w, h)
        .png({ compressionLevel: 9 })
        .toFile(path.join(OUT, file));

// ---------------------------------------------------------------- ENEMIGOS
// Personaje adulto simple, 100x120 por celda, 4 fotogramas de caminar.
function familyMember({ skin, shirt, pants, hair, extra = '' }) {
    const frames = [0, 1, 2, 3].map(i => {
        const swing = Math.sin((i / 4) * Math.PI * 2) * 6;   // piernas
        const armSwing = Math.sin((i / 4) * Math.PI * 2 + 1) * 5;
        return `
      <g transform="translate(50,0)">
        <!-- piernas -->
        <rect x="${-16 + swing * 0.4}" y="86" width="12" height="30" rx="5" fill="${pants}"/>
        <rect x="${4 - swing * 0.4}" y="86" width="12" height="30" rx="5" fill="${pants}"/>
        <ellipse cx="${-10 + swing * 0.4}" cy="117" rx="9" ry="4" fill="#2b2b3a"/>
        <ellipse cx="${10 - swing * 0.4}" cy="117" rx="9" ry="4" fill="#2b2b3a"/>
        <!-- torso -->
        <rect x="-22" y="46" width="44" height="46" rx="14" fill="${shirt}"/>
        <!-- brazos (tono más oscuro para que se distingan del torso) -->
        <rect x="${-35 - armSwing * 0.4}" y="48" width="12" height="36" rx="6" fill="${shirt}"/>
        <rect x="${-35 - armSwing * 0.4}" y="48" width="12" height="36" rx="6" fill="#000000" opacity="0.22"/>
        <rect x="${23 + armSwing * 0.4}" y="48" width="12" height="36" rx="6" fill="${shirt}"/>
        <rect x="${23 + armSwing * 0.4}" y="48" width="12" height="36" rx="6" fill="#000000" opacity="0.22"/>
        <circle cx="${-29 - armSwing * 0.4}" cy="87" r="6.5" fill="${skin}"/>
        <circle cx="${29 + armSwing * 0.4}" cy="87" r="6.5" fill="${skin}"/>
        <!-- cabeza -->
        <circle cx="0" cy="28" r="24" fill="${skin}"/>
        <path d="M-24 22 a24 24 0 0 1 48 0 q-24 -14 -48 0 z" fill="${hair}"/>
        <circle cx="-9" cy="30" r="3.4" fill="#2b2b3a"/>
        <circle cx="9" cy="30" r="3.4" fill="#2b2b3a"/>
        <path d="M-8 40 q8 7 16 0" stroke="#2b2b3a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        ${extra}
      </g>`;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">
      ${frames.map((f, i) => `<g transform="translate(${i * 100},0)">${f}</g>`).join('')}
    </svg>`;
}

const enemies = {
    'enemy-tio': { skin: '#f2c49b', shirt: '#3d7dd6', pants: '#33456b', hair: '#4a3324', extra: '<path d="M-11 36 q11 8 22 0" stroke="#4a3324" stroke-width="4" fill="none" stroke-linecap="round"/>' },
    'enemy-abuelo': { skin: '#e8bb92', shirt: '#8e6fbf', pants: '#4a4a5e', hair: '#cfcfcf', extra: '<path d="M-12 42 q12 9 24 0" stroke="#cfcfcf" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="-12" cy="30" r="9" fill="none" stroke="#4a4a5e" stroke-width="2"/><circle cx="12" cy="30" r="9" fill="none" stroke="#4a4a5e" stroke-width="2"/>' },
    'enemy-primo': { skin: '#f7cfa8', shirt: '#f0a03c', pants: '#3f6bb5', hair: '#2f2118', extra: '<path d="M-25 16 h50 v-6 q0 -8 -10 -8 h-30 q-10 0 -10 8 z" fill="#e0524a"/>' },
    'enemy-mama': { skin: '#f2c49b', shirt: '#4fb783', pants: '#6b4a8f', hair: '#5b3a24', extra: '<path d="M-24 24 q-8 40 -2 62 h8 q-6 -34 -2 -60 z" fill="#5b3a24"/><path d="M24 24 q8 40 2 62 h-8 q6 -34 2 -60 z" fill="#5b3a24"/>' },
};

for (const [name, pal] of Object.entries(enemies)) {
    await svgToPng(familyMember(pal), `${name}.png`, 400, 120);
    console.log(`  ${name}.png (400x120, 4 fotogramas)`);
}

const familyPoses = {
    'enemy-tio': ['#3d7dd6', '#33456b'],
};
await svgToPng(familyMember(enemies['enemy-tio']), 'enemy-family.png', 400, 120);

// ---------------------------------------------------------------- TILES
const ground = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <defs>
    <linearGradient id="dirt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8a5a34"/>
      <stop offset="100%" stop-color="#5c3b21"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#dirt)"/>
  <g fill="#00000022">
    <circle cx="12" cy="34" r="4"/><circle cx="46" cy="46" r="5"/><circle cx="28" cy="56" r="3.5"/>
    <circle cx="54" cy="26" r="3"/>
  </g>
  <path d="M0 12 h64 v-4 a8 8 0 0 0 -8 -8 h-48 a8 8 0 0 0 -8 8 z" fill="#63b04b"/>
  <path d="M0 12 q16 -10 32 0 q16 10 32 0 v6 h-64 z" fill="#4d9a3c"/>
  <g stroke="#3f8a30" stroke-width="2" stroke-linecap="round">
    <path d="M10 12 l-2 -7"/><path d="M24 12 l2 -6"/><path d="M40 12 l-2 -7"/><path d="M56 12 l2 -6"/>
  </g>
</svg>`;

const platform = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32">
  <rect x="0" y="0" width="64" height="32" rx="7" fill="#9c6b3f"/>
  <rect x="0" y="0" width="64" height="18" rx="7" fill="#63b04b"/>
  <rect x="0" y="14" width="64" height="6" fill="#7a5230" opacity="0.55"/>
  <g stroke="#7a5230" stroke-width="2" opacity="0.6">
    <path d="M18 20 v10"/><path d="M44 20 v10"/>
  </g>
</svg>`;

await svgToPng(ground, 'tile-ground.png', 64, 64);
await svgToPng(platform, 'tile-platform.png', 64, 32);
console.log('  tile-ground.png, tile-platform.png');

// ---------------------------------------------------------------- FONDOS
const sky = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7fd4ff"/>
      <stop offset="55%" stop-color="#bfe9ff"/>
      <stop offset="100%" stop-color="#ffe9c4"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sky)"/>
  <circle cx="1080" cy="130" r="64" fill="#fff3b0" opacity="0.95"/>
  <circle cx="1080" cy="130" r="92" fill="#fff3b0" opacity="0.25"/>
</svg>`;

const hills = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <path d="M0 620 q160 -190 320 -60 q120 100 240 -40 q140 -160 300 -40 q120 90 240 -30 q120 -120 180 -60 v400 H0 z" fill="#8fd07a" opacity="0.85"/>
  <path d="M0 680 q200 -130 400 -30 q160 80 320 -30 q200 -120 560 10 v110 H0 z" fill="#6fbb5f" opacity="0.9"/>
</svg>`;

const bushes = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <g fill="#4e9b45">
    <circle cx="140" cy="640" r="70"/><circle cx="210" cy="660" r="50"/>
    <circle cx="600" cy="650" r="80"/><circle cx="680" cy="668" r="52"/>
    <circle cx="1020" cy="636" r="66"/><circle cx="1090" cy="662" r="46"/>
  </g>
  <g fill="#3f8a30" opacity="0.85">
    <rect x="132" y="650" width="16" height="60" rx="6"/>
    <rect x="592" y="658" width="18" height="60" rx="6"/>
    <rect x="1012" y="646" width="16" height="60" rx="6"/>
  </g>
</svg>`;

const cloud = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120">
  <g fill="#ffffff" opacity="0.92">
    <circle cx="70" cy="70" r="40"/><circle cx="120" cy="54" r="52"/><circle cx="176" cy="72" r="36"/>
    <rect x="60" y="76" width="130" height="34" rx="17"/>
  </g>
</svg>`;

await svgToPng(sky, 'bg-layer-1.png', 2560, 1440);
await svgToPng(hills, 'bg-layer-2.png', 2560, 1440);
await svgToPng(bushes, 'bg-layer-3.png', 2560, 1440);
await svgToPng(cloud, 'cloud.png', 240, 120);
console.log('  bg-layer-1/2/3.png, cloud.png');

// ---------------------------------------------------------------- UI
const star = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs><radialGradient id="g" cx="35%" cy="30%">
    <stop offset="0%" stop-color="#fff6c4"/><stop offset="100%" stop-color="#f5b400"/>
  </radialGradient></defs>
  <path d="M32 4 l8.6 17.6 19.4 2.8 -14 13.7 3.3 19.3 -17.3 -9.1 -17.3 9.1 3.3 -19.3 -14 -13.7 19.4 -2.8 z"
        fill="url(#g)" stroke="#c98a00" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`;

const heart = (fill, stroke) => `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M24 42 C6 30 4 20 10 14 c5 -5.4 12 -3 14 3 c2 -6 9 -8.4 14 -3 c6 6 4 16 -14 28 z"
        fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`;

const button = (bg, glyph, glyphColor) => `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs><radialGradient id="b" cx="38%" cy="30%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="100%" stop-color="#000000" stop-opacity="0.18"/>
  </radialGradient></defs>
  <circle cx="64" cy="64" r="58" fill="${bg}" stroke="#ffffff" stroke-opacity="0.7" stroke-width="5"/>
  <circle cx="64" cy="64" r="58" fill="url(#b)"/>
  <text x="64" y="64" text-anchor="middle" dominant-baseline="central"
        font-family="Verdana,DejaVu Sans,sans-serif" font-size="64" font-weight="bold" fill="${glyphColor}">${glyph}</text>
</svg>`;

await svgToPng(star, 'star.png', 64, 64);
await svgToPng(heart('#ff4d6d', '#c9184a'), 'heart-full.png', 48, 48);
await svgToPng(heart('#3a3a4d', '#23232f'), 'heart-empty.png', 48, 48);
await svgToPng(button('#2f3a56', '\u25C0', '#ffffff'), 'btn-left.png', 128, 128);
await svgToPng(button('#2f3a56', '\u25B6', '#ffffff'), 'btn-right.png', 128, 128);
await svgToPng(button('#e94560', '\u25B2', '#ffffff'), 'btn-jump.png', 128, 128);
await svgToPng(button('#3d7dd6', '\u25BC', '#ffffff'), 'btn-crouch.png', 128, 128);
console.log('  UI: star, hearts, botones');

console.log('\nArte generado en ' + OUT);
