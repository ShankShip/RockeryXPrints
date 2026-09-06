// backend/src/controllers/sitemap.controller.js
import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { Collection } from '../models/collection.model.js';

const SITE_URL = 'https://rockeryprints.in';

// Helper to escape special XML characters
function escapeXml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates and streams dynamic sitemap.xml covering:
 * - Core static pages (/, /shop, /categories, /collections, etc.)
 * - Dynamic category pages (/category/:slug)
 * - Dynamic product pages (/products/:slug) with image sitemap extension
 */
export async function generateSitemapXml(req, res) {
  try {
    const [products, categories, collections] = await Promise.all([
      Product.find({}, 'slug updatedAt name images').lean(),
      Category.find({}, 'slug updatedAt name').lean(),
      Collection.find({}, 'slug searchTag updatedAt name').lean()
    ]);

    const staticRoutes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/shop', priority: '0.9', changefreq: 'daily' },
      { path: '/categories', priority: '0.8', changefreq: 'weekly' },
      { path: '/collections', priority: '0.8', changefreq: 'weekly' },
      { path: '/return-policy', priority: '0.5', changefreq: 'monthly' },
      { path: '/terms-and-conditions', priority: '0.5', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // 1. Static Pages
    const todayStr = new Date().toISOString().split('T')[0];
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

    // 3. Products (with Google image sitemap tags)
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

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
