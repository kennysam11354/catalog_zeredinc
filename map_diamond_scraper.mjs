import fs from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';

const BASE_URL = 'https://mapdiamondtools.com';
const CATEGORIES = [
  'Abrasives',
  'Chemical',
  'Diamond Tools',
  'Equipment',
  'Safety Products',
  'ETC',
  'Sink Collection',
  'Machines and Parts'
];

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchHtml(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!response.ok) {
      if (response.status === 404) return null; // Empty pagination or category might be 404
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function scrapeCategory(categoryName) {
  const slug = categoryName.toLowerCase().replace(/ /g, '-');
  const productUrls = new Set();
  
  let page = 1;
  while (true) {
    const url = `${BASE_URL}/category/${slug}?per_page=96&page=${page}`;
    console.log(`Fetching category page: ${url}`);
    
    const html = await fetchHtml(url);
    if (!html) break;
    
    const $ = cheerio.load(html);
    
    const links = $('.sf-product-image-link').map((i, el) => $(el).attr('href')).get();
    
    if (links.length === 0) break;
    
    for (const link of links) {
      if (link.startsWith('http')) {
        productUrls.add(link);
      } else {
        productUrls.add(`${BASE_URL}${link}`);
      }
    }
    
    // Check if there is a Next page link
    const nextPage = $('.sf-pagination .next');
    if (nextPage.length === 0 || nextPage.hasClass('disabled')) {
      break;
    }
    
    page++;
    await delay(300);
  }
  
  return Array.from(productUrls);
}

async function scrapeProductPage(url, categories) {
  console.log(`Fetching product: ${url}`);
  const html = await fetchHtml(url);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  
  // Extract SKU from text instead of ld+json as requested
  // Text will be like "SKU: SPRSCG-AP1AT-0003 · #15013"
  const rawSkuText = $('.sf-product-sku').text().trim() || $('.sf-product-sku-label').text().trim();
  let sku = rawSkuText;
  if (sku.startsWith('SKU: ')) {
    sku = sku.slice(5).trim();
  }
  
  // Extract full description (HTML from .sf-description-text)
  // Revert to plain text to match user preferences if needed, or keep HTML
  const descriptionHtml = $('#productLongDesc').html();
  // We can convert HTML to clean text or just store as html.
  // Actually, the previous scraper used clean description or raw? The original zeredinc was clean, but we can store text.
  const descriptionText = $('#productLongDesc').text().trim() || $('#productShortDesc').text().trim();
  
  // Fallback if ld+json is missing
  let title = $('h1').first().text().trim();
  let image = $('.sf-gallery-image-el').first().attr('src');
  
  // Parse ld+json
  const scripts = $('script[type="application/ld+json"]').map((i, el) => $(el).html()).get();
  for (const script of scripts) {
    try {
      const data = JSON.parse(script);
      if (data['@type'] === 'Product') {
        if (data.name) title = data.name;
        if (data.description && !descriptionText) {
          // data.description
        }
        if (data.image) {
          if (Array.isArray(data.image) && data.image.length > 0) {
            image = data.image[0];
          } else if (typeof data.image === 'string') {
            image = data.image;
          }
        }
      }
    } catch(e) { /* ignore parse errors */ }
  }
  
  if (!sku) {
    console.log(`Failed to find SKU for ${url}`);
  }

  return {
    url,
    title,
    sku,
    image,
    description: descriptionText,
    categories
  };
}

async function main() {
  const finalProducts = [];
  const urlToCategories = new Map();
  
  // 1. Gather all Product URLs from all Categories
  for (const category of CATEGORIES) {
    const urls = await scrapeCategory(category);
    console.log(`Found ${urls.length} products in ${category}`);
    
    for (const url of urls) {
      if (!urlToCategories.has(url)) {
        urlToCategories.set(url, new Set());
      }
      urlToCategories.get(url).add(category);
    }
    
    await delay(300);
  }
  
  console.log(`Total unique products to fetch: ${urlToCategories.size}`);
  
  // 2. Fetch each Product Page
  let count = 0;
  for (const [url, catsSet] of urlToCategories.entries()) {
    count++;
    try {
      const product = await scrapeProductPage(url, Array.from(catsSet));
      if (product) {
        finalProducts.push(product);
      }
    } catch (e) {
      console.error(`Failed on ${url}:`, e);
    }
    await delay(200);
    
    if (count % 10 === 0) {
      console.log(`Processed ${count} / ${urlToCategories.size}`);
    }
  }
  
  fs.writeFileSync(path.join(process.cwd(), 'map_products.json'), JSON.stringify(finalProducts, null, 2));
  console.log(`Successfully saved ${finalProducts.length} products to map_products.json`);
}

main().catch(console.error);
