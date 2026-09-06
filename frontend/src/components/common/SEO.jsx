// src/components/common/SEO.jsx
// Reusable SEO component wrapping react-helmet-async with OpenGraph, Twitter Cards, Canonical links & JSON-LD
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router';

const SITE_NAME = 'Rockery Prints';
const BASE_URL = 'https://rockeryprints.in';
const DEFAULT_DESCRIPTION =
  'Discover premium brutalist-inspired art prints, high-grade posters, archival matte frames, and exclusive fandom merchandise crafted for modern aesthetics.';
const DEFAULT_IMAGE = `${BASE_URL}/og-banner.png`;

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  keywords,
  noindex = false,
  jsonLd,
}) {
  const location = useLocation();

  // Compute canonical URL
  const currentPath = canonical || location.pathname;
  const canonicalUrl = currentPath.startsWith('http')
    ? currentPath
    : `${BASE_URL}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`;

  // Format title
  const fullTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Premium Brutalist Art Prints, Posters & Fandom Merch`;

  // Parse JSON-LD (supports single object or array)
  const structuredDataList = Array.isArray(jsonLd)
    ? jsonLd.filter(Boolean)
    : jsonLd
    ? [jsonLd]
    : [];

  // Keywords string
  const keywordsContent = Array.isArray(keywords)
    ? keywords.join(', ')
    : keywords || 'art prints, brutalist design, graphic posters, anime prints, gaming merch, wall decor, archival prints, rockery prints';

  return (
    <Helmet>
      {/* Standard Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Crawlers */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) */}
      {structuredDataList.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
