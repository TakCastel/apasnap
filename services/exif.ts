import { MediaItem, MediaType } from '../types';

declare global {
  interface Window {
    EXIF: any;
  }
}

/**
 * Attempts to extract GPS data from an image URL.
 * NOTE: This is heavy and may fail due to CORS. 
 * We use the proxy chain if direct fails to at least try to get the data.
 */
export const extractGpsFromImage = (item: MediaItem): Promise<MediaItem> => {
  return new Promise((resolve) => {
    // If it's not an image or already checked, return
    if (item.type !== MediaType.IMAGE || item.hasCheckedExif) {
      resolve(item);
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    // We try to load the image. 
    // Optimization: In a real backend app, we'd fetch range bytes. 
    // Here we have to rely on the browser loading the image.
    // To avoid downloading the FULL 5MB image just for exif, we are limited by client-side tech.
    // However, EXIF-js usually needs the blob.
    
    img.onload = () => {
      if (window.EXIF) {
        window.EXIF.getData(img, function(this: any) {
          const lat = window.EXIF.getTag(this, "GPSLatitude");
          const latRef = window.EXIF.getTag(this, "GPSLatitudeRef");
          const lng = window.EXIF.getTag(this, "GPSLongitude");
          const lngRef = window.EXIF.getTag(this, "GPSLongitudeRef");
          
          let finalLat = null;
          let finalLng = null;

          if (lat && latRef && lng && lngRef) {
             finalLat = convertDMSToDD(lat, latRef);
             finalLng = convertDMSToDD(lng, lngRef);
          }

          resolve({
            ...item,
            lat: finalLat,
            lng: finalLng,
            hasCheckedExif: true
          });
        });
      } else {
        resolve({ ...item, hasCheckedExif: true });
      }
    };

    img.onerror = () => {
        // Fallback: If direct load fails (CORS), we could try proxy, 
        // but proxying 2000 images is too aggressive for this demo.
        // We just mark as checked.
        resolve({ ...item, hasCheckedExif: true });
    };

    // Use a proxy for the image src if we suspect CORS issues, 
    // but for now try direct or corsproxy to maximize success chance for EXIF
    // Note: allorigins doesn't support binary perfectly for EXIF always, but corsproxy.io does.
    img.src = `https://corsproxy.io/?${encodeURIComponent(item.url)}`;
  });
};

function convertDMSToDD(dms: number[], ref: string) {
    let dd = dms[0] + dms[1] / 60 + dms[2] / (60 * 60);
    if (ref === "S" || ref === "W") {
        dd = dd * -1;
    }
    return dd;
}