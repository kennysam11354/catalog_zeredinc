import fs from 'fs';

async function scrape() {
  const url = 'https://mapdiamondtools.com/product/5-ksp-psa-120-100pcs-box-15013';
  const response = await fetch(url);
  const html = await response.text();
  
  fs.writeFileSync('C:\\coding\\catalog\\catalog-web\\temp_product.html', html);
  console.log('Product HTML saved.');
}

scrape().catch(console.error);
