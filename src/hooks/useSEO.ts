import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

/**
 * useSEO — lightweight per-page SEO hook.
 * Sets document.title and meta description dynamically
 * so each route has its own crawlable metadata.
 */
export function useSEO({ title, description, canonical, noIndex = false }: SEOOptions) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    if (description) {
      let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!descEl) {
        descEl = document.createElement('meta');
        descEl.name = 'description';
        document.head.appendChild(descEl);
      }
      descEl.content = description;
    }

    // Robots — noIndex pages (dashboard, admin) should not be indexed
    let robotsEl = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robotsEl) {
      robotsEl = document.createElement('meta');
      robotsEl.name = 'robots';
      document.head.appendChild(robotsEl);
    }
    robotsEl.content = noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

    // Canonical
    if (canonical) {
      let canonEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonEl) {
        canonEl = document.createElement('link');
        canonEl.rel = 'canonical';
        document.head.appendChild(canonEl);
      }
      canonEl.href = canonical;
    }
  }, [title, description, canonical, noIndex]);
}
