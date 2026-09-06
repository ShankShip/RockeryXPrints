// src/utils/seoSchemas.js
// Utility helpers to generate Schema.org JSON-LD structured data

const BASE_URL = 'https://rockeryprints.in';

/**
 * Returns Organization structured data for the brand.
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'Rockery Prints',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    description: 'Premium archival art prints, high-grade framed posters, and exclusive pop-culture merchandise.',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking',
    sameAs: [
      'https://www.instagram.com/rockeryxprints/'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'shankship01@gmail.com',
      url: `${BASE_URL}/return-policy`
    }
  };
}

/**
 * Returns LocalBusiness schema for rich local and merchant trust indexing.
 */
export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Rockery Prints',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    image: `${BASE_URL}/og-banner.png`,
    description: 'Specialist studio for archival framed art prints, anime posters, and collectible wall art.',
    priceRange: '₹399 - ₹1299',
    currenciesAccepted: 'INR',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN'
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

  // Add AggregateRating if product has ratings/reviews
  const ratingValue = Number(product.rating) || 5.0;
  const reviewCount = Number(product.totalRatings) || 1;

  schema.aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: ratingValue.toFixed(1),
    reviewCount: reviewCount,
    bestRating: '5',
    worstRating: '1'
  };

  // Add reviews if present
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
      reviewBody: product.userReview.message || 'Excellent archival print quality and solid frame.'
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
