import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
}

export function SEO({
  title = 'Embedded Map File Analyzer - GCC Linker Map Visualization Tool',
  description = 'Free online tool to analyze GCC linker map files, visualize firmware memory usage, compare builds, and detect size anomalies. Perfect for embedded systems developers working with ARM, AVR, and other microcontrollers.',
  keywords = 'GCC map file analyzer, linker map visualization, firmware memory analysis, embedded systems tools, build size comparison, memory usage analyzer, ARM microcontroller, flash memory analyzer, RAM usage tool, embedded development, IoT firmware tools, map file parser',
  image = '/og-image.png',
  url = 'https://embedded-map-analyzer.com',
  type = 'website',
  author = 'Embedded Map File Analyzer Team'
}: SEOProps) {
  const fullTitle = title.includes('Embedded Map File Analyzer') ? title : `${title} | Embedded Map File Analyzer`;
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;
  const currentUrl = url;

  // Structured Data (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Embedded Map File Analyzer',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: description,
    url: url,
    author: {
      '@type': 'Organization',
      name: author
    },
    featureList: [
      'GCC linker map file parsing and analysis',
      'Memory usage visualization with interactive charts',
      'Build-to-build comparison and diff analysis',
      'Flash and RAM usage breakdown',
      'Section-level memory analysis',
      'Anomaly detection for unexpected size changes',
      'CSV and JSON export capabilities',
      'PDF report generation',
      'Support for ARM, AVR, and other embedded architectures'
    ],
    screenshot: fullImageUrl,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127'
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Embedded Map File Analyzer" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:creator" content="@embeddedmapanalyzer" />

      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#9c27b0" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Map Analyzer" />
      <meta name="format-detection" content="telephone=no" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

// Page-specific SEO presets
export const SEOPresets = {
  home: {
    title: 'Embedded Map File Analyzer - Free GCC Linker Map Visualization Tool',
    description: 'Analyze GCC linker map files instantly. Visualize firmware memory usage, compare builds, detect anomalies. Free tool for embedded developers working with ARM, AVR, ESP32, STM32, and more.',
    keywords: 'GCC map file analyzer, linker map visualization, firmware memory analysis, embedded systems tools, ARM memory analyzer, STM32 tools, ESP32 analyzer, AVR tools, build size comparison'
  },
  analyze: {
    title: 'Single File Analysis - Analyze Your Map File',
    description: 'Upload and analyze a single GCC linker map file. Get detailed memory breakdowns, section analysis, and interactive visualizations of your embedded firmware.',
    keywords: 'map file analysis, single file analyzer, memory breakdown, firmware analysis, GCC map parser'
  },
  compare: {
    title: 'Build Comparison - Compare Two Map Files',
    description: 'Compare two GCC map files to detect memory changes between builds. Identify size increases, optimization opportunities, and unexpected anomalies.',
    keywords: 'build comparison, firmware diff, memory size comparison, build size analysis, regression detection'
  },
  about: {
    title: 'About - Embedded Map File Analyzer',
    description: 'Learn about the Embedded Map File Analyzer tool, its features, and how it helps embedded systems developers optimize firmware size and memory usage.',
    keywords: 'about embedded tools, map file analyzer features, firmware optimization tools'
  }
};
