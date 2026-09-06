// src/utils/seoSchemas.js
// Utility helpers to generate Schema.org JSON-LD structured data

const BASE_URL = 'https://rockeryprints.in';

/**
 * Returns Organization structured data for the brand.
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Rockery Prints',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    description: 'Premium brutalist-inspired art prints, high-grade posters, and exclusive pop-culture merchandise.',
    sameAs: [
      'https://www.instagram.com/rockeryprints'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: `${BASE_URL}/return-policy`
    }
  };
}

/**
 * Returns WebSite structured data with SearchAction for sitelinks search box.
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Rockery Prints',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/shop?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * Generates Product structured data conforming to schema.org/Product.
 * Used for Google rich results, price, and availability.
 */
export function getProductSchema(product) {
  if (!product) return null;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [`${BASE_URL}/og-banner.png`];

  const price = product.sellingPrice || product.mrp || 0;
  const isAvailable = (product.stock ?? 1) > 0;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description: product.description || `Buy ${product.name} at Rockery Prints. High-grade archival print.`,
    sku: product.sku || product._id,
    brand: {
      '@type': 'Brand',
      name: 'Rockery Prints'
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/products/${product.slug || product._id}`,
      priceCurrency: 'INR',
      price: price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Rockery Prints'
      }
    }
  };

  // Add reviews / ratings if present
  if (product.userReview && product.userReview.rating) {
    schema.review = {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: product.userReview.rating,
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Verified Customer'
      },
      reviewBody: product.userReview.message || 'Excellent print quality and finish.'
    };
  }

  return schema;
}

/**
 * Generates BreadcrumbList structured data for search result breadcrumb navigation.
 * @param {Array<{ name: string, path: string }>} crumbs
 */
export function getBreadcrumbSchema(crumbs = []) {
  if (!crumbs.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.path.startsWith('http') ? crumb.path : `${BASE_URL}${crumb.path}`
    }))
  };
}
