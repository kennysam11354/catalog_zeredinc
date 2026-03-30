import fs from 'fs';

async function scrape() {
  const url = 'https://mapdiamondtools.com/sitemap.xml';
  const response = await fetch(url);
  const xml = await response.text();
  
  fs.writeFileSync('C:\\coding\\catalog\\catalog-web\\sitemap.xml', xml);
  console.log('Sitemap saved.');
}

scrape().catch(console.error);
