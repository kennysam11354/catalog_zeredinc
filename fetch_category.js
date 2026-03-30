import fs from 'fs';

async function scrape() {
  const url = 'https://mapdiamondtools.com/category/abrasives';
  const response = await fetch(url);
  const html = await response.text();
  
  fs.writeFileSync('C:\\coding\\catalog\\catalog-web\\temp_category.html', html);
  console.log('Category HTML saved.');
}

scrape().catch(console.error);
