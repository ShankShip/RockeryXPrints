// src/utils/imageUtils.js
// Cloudinary on-the-fly image optimization helper

/**
 * Transforms an existing Cloudinary image URL to apply on-the-fly optimization.
 * Automatically injects f_auto (WebP/AVIF depending on browser), q_auto (intelligent quality compression),
 * and responsive width/height resizing.
 *
 * If the URL is not from Cloudinary, or is already optimized, it returns the URL unchanged.
 *
 * @param {string} url - Original full-size image URL
 * @param {object} [options]
 * @param {number} [options.width] - Target width in pixels (e.g. 600, 1200)
 * @param {number} [options.height] - Target height in pixels
 * @param {string} [options.crop='limit'] - Crop mode ('limit' prevents upscaling, 'fill', 'thumb')
 * @param {string} [options.quality='auto'] - Quality level ('auto', 'good', 'eco')
 * @returns {string} Optimized CDN URL
 */
export function getOptimizedImageUrl(url, { width, height, crop = 'limit', quality = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url || '';

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  // Prevent double-applying transformations if already present
  if (url.includes('/image/upload/f_auto') || url.includes('/image/upload/q_auto')) {
    return url;
  }

  // Build Cloudinary transformation string
  const transforms = [`f_auto`, `q_${quality}`];

  if (width) transforms.push(`w_${Math.round(width)}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);

  const transformString = transforms.join(',');

  // Inject transformations immediately after '/image/upload/'
  return url.replace('/image/upload/', `/image/upload/${transformString}/`);
}
