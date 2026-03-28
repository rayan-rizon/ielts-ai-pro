import { Helmet } from 'react-helmet-async';

/**
 * DocumentHead - A reusable SEO component for setting page-specific metadata.
 *
 * This component uses react-helmet-async to dynamically inject <title>,
 * <meta> description, OpenGraph, and Twitter Card tags into the document head.
 *
 * @param {Object} props
 * @param {string} props.title - The page title (required)
 * @param {string} props.description - The meta description (required, max ~160 chars)
 * @param {string} [props.canonicalUrl] - The canonical URL for the page
 * @param {string} [props.image] - OpenGraph/Twitter image URL
 * @param {string} [props.type] - OpenGraph type (default: 'website')
 * @param {Object} [props.structuredData] - JSON-LD structured data object
 */
export default function DocumentHead({
  title,
  description,
  canonicalUrl,
  image = 'https://www.ieltsai.pro/og-image.jpg',
  type = 'website',
  keywords,
  noIndex = false,
  noFollow = false,
  robots,
  structuredData,
}) {
  const siteName = 'IELTS Ai Pro';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const robotsContent =
    robots || `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`;

  return (
    <Helmet data-oid="k59b74f">
      {/* Primary Meta Tags */}
      <title data-oid="kks.s3z">{fullTitle}</title>
      <meta name="description" content={description} data-oid="xq_eme:" />
      <meta name="robots" content={robotsContent} data-oid="head-robots" />
      {keywords && <meta name="keywords" content={keywords} data-oid="head-keywords" />}

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} data-oid="m5uiwjj" />}

      {/* OpenGraph Meta Tags (for social sharing) */}
      <meta property="og:title" content={fullTitle} data-oid="x6zb:zz" />
      <meta property="og:description" content={description || ''} data-oid="-f53ng9" />
      <meta property="og:type" content={type} data-oid="cwkvf-j" />
      <meta property="og:site_name" content={siteName} data-oid="yk6vytg" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} data-oid="7gt-:pm" />}
      {image && (
        <>
          <meta property="og:image" content={image} data-oid="ay8zl_0" />
          <meta property="og:image:width" content="1200" data-oid="2.jetfu" />
          <meta property="og:image:height" content="630" data-oid="b9nqav:" />
          <meta property="og:image:type" content="image/jpeg" data-oid="moru1ru" />
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" data-oid="jakz49u" />
      <meta name="twitter:title" content={fullTitle} data-oid="e47g3p_" />
      <meta name="twitter:description" content={description || ''} data-oid="rb522-w" />
      {image && <meta name="twitter:image" content={image} data-oid="64p9g45" />}

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json" data-oid="7imeqzc">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
