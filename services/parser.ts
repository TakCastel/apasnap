
import { MediaItem, MediaType } from '../types';

const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp'];
const ALLOWED_VIDEO_EXT = ['mp4', 'webm', 'mov', 'mkv'];

/**
 * Determines the media type based on file extension
 */
const getMediaType = (filename: string): MediaType => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ALLOWED_IMAGE_EXT.includes(ext || '')) {
    return MediaType.IMAGE;
  }
  if (ALLOWED_VIDEO_EXT.includes(ext || '')) {
    return MediaType.VIDEO;
  }
  return MediaType.UNKNOWN;
};

/**
 * Parses raw HTML string from an Apache Directory listing
 */
export const parseApacheDirectoryHtml = (html: string, baseUrl: string): MediaItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = Array.from(doc.querySelectorAll('a'));
  
  const items: MediaItem[] = [];

  // Ensure baseUrl ends with a slash for construction
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  links.forEach((link, index) => {
    const href = link.getAttribute('href');
    const text = link.textContent?.trim() || '';

    // Ignore "Parent Directory", query params, or empty hrefs
    if (!href || href === '../' || text === 'Parent Directory' || href.includes('?')) {
      return;
    }
    
    // Security: Ignore javascript:, data:, or non-http links if absolute
    if (href.startsWith('javascript:') || href.startsWith('data:')) return;

    // Clean href (remove leading slash if present to append to base)
    const cleanHref = href.startsWith('/') ? href.substring(1) : href;
    
    // Construct full URL
    const fullUrl = href.startsWith('http') ? href : `${cleanBaseUrl}${cleanHref}`;

    const type = getMediaType(cleanHref);

    if (type !== MediaType.UNKNOWN) {
      let size = '';
      let date = '';
      
      const nextNode = link.nextSibling;
      if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
        const metaText = nextNode.textContent || '';
        const parts = metaText.trim().split(/\s+/);
        if (parts.length >= 2) {
          date = `${parts[0]} ${parts[1]}`;
          size = parts[2] || '';
        }
      }

      items.push({
        id: `media-${index}-${Date.now()}`,
        name: decodeURIComponent(cleanHref),
        url: fullUrl,
        type,
        size,
        date
      });
    }
  });

  return items;
};

/**
 * Parses a JSON Manifest (apasnap.json)
 * Format expected: { items: [{ name, url, type, size, date }] }
 */
export const parseManifestJson = (json: any, baseUrl: string): MediaItem[] => {
  if (!json || !Array.isArray(json.items)) return [];
  
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return json.items.map((item: any, index: number) => {
    // Determine type from name if not provided
    const type = item.type || getMediaType(item.name || item.url);
    
    // Handle relative URLs in manifest
    let fullUrl = item.url;
    if (fullUrl && !fullUrl.startsWith('http')) {
        fullUrl = `${cleanBaseUrl}${fullUrl.replace(/^\//, '')}`;
    }

    if (type === MediaType.UNKNOWN) return null;

    return {
      id: `manifest-${index}-${Date.now()}`,
      name: item.name || `File ${index}`,
      url: fullUrl,
      type,
      size: item.size,
      date: item.date
    };
  }).filter((i: any) => i !== null) as MediaItem[];
};

/**
 * MOCK DATA GENERATOR for Demo Mode
 */
export const generateDemoData = (): MediaItem[] => {
  const demoImages = [
    'https://picsum.photos/id/10/800/600',
    'https://picsum.photos/id/11/800/1200',
    'https://picsum.photos/id/12/1200/800',
    'https://picsum.photos/id/13/800/800',
    'https://picsum.photos/id/14/800/600',
    'https://picsum.photos/id/15/600/900',
    'https://picsum.photos/id/16/900/600',
    'https://picsum.photos/id/17/800/800',
    'https://picsum.photos/id/18/1200/900',
    'https://picsum.photos/id/19/800/1200',
  ];

  return demoImages.map((url, i) => ({
    id: `demo-${i}`,
    name: `demo_photo_${i + 1}.jpg`,
    url: url,
    type: MediaType.IMAGE,
    size: `${Math.floor(Math.random() * 500) + 100}K`,
    date: '2023-10-27 14:30'
  }));
};
