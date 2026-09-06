// frontend/scripts/generate-sitemap.js
// Node.js script to automatically generate sitemap.xml with all live products and categories

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://rockeryprints.in';
const API_BASE = 'https://rockeryxprints.onrender.com/api/v1';
const OUTPUT_PATH = path.resolve(__dirname, '../public/sitemap.xml');

function escapeXml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[Sitemap] Note: Could not fetch from ${url}:`, err.message);
    return null;
  }
}

async function generate() {
  console.log('[Sitemap] Generating complete XML sitemap with dynamic database records...');

  const todayStr = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/shop', priority: '0.9', changefreq: 'daily' },
    { path: '/categories', priority: '0.8', changefreq: 'weekly' },
    { path: '/collections', priority: '0.8', changefreq: 'weekly' },
    { path: '/return-policy', priority: '0.5', changefreq: 'monthly' },
    { path: '/terms-and-conditions', priority: '0.5', changefreq: 'monthly' },
  ];

  // Fetch all products (with high limit to get all)
  const productsRes = await fetchJson(`${API_BASE}/prods/products?limit=500`);
  const products = productsRes?.data?.docs || productsRes?.data?.products || productsRes?.data || [];

  // Fetch all categories
  const categoriesRes = await fetchJson(`${API_BASE}/prods/categories`);
  const categories = categoriesRes?.data || [];

  console.log(`[Sitemap] Fetched ${products.length} products and ${categories.length} categories.`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Static Routes
  for (const route of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${todayStr}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 2. Categories
  for (const cat of categories) {
    if (!cat.slug) continue;
    const lastMod = cat.updatedAt ? new Date(cat.updatedAt).toISOString().split('T')[0] : todayStr;
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/category/${escapeXml(cat.slug)}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  // 3. Products
  for (const prod of products) {
    if (!prod.slug) continue;
    const lastMod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : todayStr;
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/products/${escapeXml(prod.slug)}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;

    if (Array.isArray(prod.images) && prod.images[0]) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(prod.images[0])}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(prod.name || 'Art Print')}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  fs.writeFileSync(OUTPUT_PATH, xml, 'utf8');
  console.log(`[Sitemap] Successfully wrote ${staticRoutes.length + categories.length + products.length} URLs to ${OUTPUT_PATH}`);
}

generate().catch((err) => {
  console.error('[Sitemap] Generation error:', err);
  process.exit(0); // Exit smoothly so build doesn't halt if offline
});
