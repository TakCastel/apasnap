/**
 * Service to handle on-the-fly image optimization using wsrv.nl
 * Documentation: https://wsrv.nl/docs/
 */

// Grid thumbnails: Small, WebP, lower quality for speed
export const getThumbnailUrl = (url: string): string => {
  // Check if already proxy or blob
  if (url.includes('wsrv.nl') || url.startsWith('blob:')) return url;
  
  // w=500: Width based, let height be auto to preserve aspect ratio for Masonry layout
  // output=webp: Modern efficient format
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=500&output=webp&q=65`;
};

// Lightbox view: Full resolution but optimized format
export const getFullScreenUrl = (url: string): string => {
  if (url.includes('wsrv.nl') || url.startsWith('blob:')) return url;

  // q=85: High quality for viewing
  // output=webp: Faster loading than raw JPEG
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=webp&q=85`;
};