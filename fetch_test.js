import fs from 'fs';

async function scrape() {
  const url = 'https://mapdiamondtools.com/category/diamond-tools';
  const response = await fetch(url);
  const html = await response.text();
  
  fs.writeFileSync('C:\\coding\\catalog\\catalog-web\\temp_diamond_tools.html', html);
  console.log('HTML saved.');
}

scrape().catch(console.error);
