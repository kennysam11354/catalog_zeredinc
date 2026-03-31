/**
 * download_product_images.js
 *
 * Downloads all product images from mapdiamondtools.com to public/products/
 * and updates src/data/products.json to use local paths.
 *
 * Usage:  node download_product_images.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const PRODUCTS_JSON = path.resolve(__dirname, 'src/data/products.json');
const OUTPUT_DIR    = path.resolve(__dirname, 'public/products');

function getFilename(imageUrl) {
  return path.basename(new URL(imageUrl).pathname);
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      return resolve('skip');
    }
    const proto = url.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(destPath);
    const req   = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return download(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve('downloaded')));
    });
    req.on('error', err => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
  let downloaded = 0, skipped = 0, failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p.image || !p.image.startsWith('http')) continue;

    const filename = getFilename(p.image);
    const destPath = path.join(OUTPUT_DIR, filename);

    try {
      const result = await download(p.image, destPath);
      if (result === 'skip') {
        skipped++;
        console.log(`[SKIP ${i+1}/${products.length}] ${filename}`);
      } else {
        downloaded++;
        console.log(`[OK   ${i+1}/${products.length}] ${filename}`);
      }
      // Update to local path
      products[i] = { ...p, image: `/products/${filename}` };
    } catch (err) {
      failed++;
      console.error(`[FAIL ${i+1}/${products.length}] ${p.image} → ${err.message}`);
      // Keep original URL on failure
    }
  }

  // Write updated products.json
  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(products, null, 2), 'utf8');
  console.log(`\nDone. Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`products.json updated with local image paths.`);
}

main().catch(console.error);
