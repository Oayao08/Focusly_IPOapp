/**
 * scripts/create-icon.js
 * Run with: npm run create-icon
 *
 * Generates assets/icon.png (1024×1024) from assets/icon.svg
 * Requires: npm install sharp  (already in package.json)
 */

'use strict';

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const ASSETS  = path.join(__dirname, '..', 'assets');
const SVG_SRC = path.join(ASSETS, 'icon.svg');
const svgBuf  = fs.readFileSync(SVG_SRC);

async function run() {
  console.log('🎨 Generating Flowvity icons…\n');

  // 1024×1024 master PNG (used by Electron + Linux .deb)
  await sharp(svgBuf)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));
  console.log('  ✓ icon.png (1024×1024)');

  // Auxiliary sizes
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  for (const s of sizes) {
    await sharp(svgBuf)
      .resize(s, s)
      .png()
      .toFile(path.join(ASSETS, `icon-${s}.png`));
    console.log(`  ✓ icon-${s}.png`);
  }

  // macOS ICNS source (512×512 used by electron-forge automatically)
  await sharp(svgBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS, 'icon.icns'));
  console.log('  ✓ icon.icns (macOS)');

  // Windows ICO — forge picks up icon.ico automatically
  // We write a 256×256 PNG here; rename to .ico
  // (For a real ICO with multiple resolutions use png-to-ico or electron-icon-builder)
  await sharp(svgBuf)
    .resize(256, 256)
    .png()
    .toFile(path.join(ASSETS, 'icon.ico'));
  console.log('  ✓ icon.ico (Windows — single 256px frame)');

  console.log('\n✅ All icons generated in assets/\n');
}

run().catch(err => {
  console.error('❌ Icon generation failed:', err.message);
  process.exit(1);
});
