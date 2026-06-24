/**
 * Mock CDN Image Optimization Helper
 * Simulates enterprise CDN behavior (like Cloudflare Image Resizing, Akamai, or AWS CloudFront)
 * by appending dimension and format queries.
 * In a real environment, the CDN edge servers intercept these and process the images on the fly.
 */
export function getOptimizedImageUrl(url: string, width: number, height?: number, format: 'webp' | 'avif' | 'jpeg' = 'webp'): string {
    if (!url) return '';
    
    // For Unsplash or Picsum which we are using, we can dynamically rewrite the URLs.
    if (url.includes('unsplash.com')) {
        // Unsplash uses Imgix CDN
        const urlObj = new URL(url);
        urlObj.searchParams.set('w', width.toString());
        if (height) urlObj.searchParams.set('h', height.toString());
        urlObj.searchParams.set('fm', format);
        urlObj.searchParams.set('auto', 'compress,format');
        urlObj.searchParams.set('q', '75'); // Optimal quality vs size
        return urlObj.toString();
    }
    
    if (url.includes('picsum.photos')) {
        // Picsum URL format: https://picsum.photos/seed/xxx/width/height
        const parts = url.split('/');
        // Extract the seed part
        if (parts.includes('seed')) {
            const seedIndex = parts.indexOf('seed') + 1;
            const seed = parts[seedIndex];
            return `https://picsum.photos/seed/${seed}/${width}/${height || width}?${format === 'webp' ? 'fmt=webp' : ''}`;
        }
    }
    
    // Fallback for other URLs, append mock query params 
    // (a real CDN would use these or path parameters)
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', width.toString());
    if (height) urlObj.searchParams.set('height', height.toString());
    urlObj.searchParams.set('format', format);
    
    return urlObj.toString();
}
