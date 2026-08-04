export const SITE_NAME = 'Mohamed Aiman Portfolio';
export const DEFAULT_SITE_URL = 'https://darkguyaiman.com';
export const DEFAULT_SOCIAL_IMAGE = '/assets/Mohamed Aiman Alter Ego.webp';
export const DEFAULT_SOCIAL_IMAGE_WIDTH = 1024;
export const DEFAULT_SOCIAL_IMAGE_HEIGHT = 935;
export const DEFAULT_SOCIAL_IMAGE_TYPE = 'image/webp';
export const DEFAULT_SOCIAL_IMAGE_ALT = 'Portrait of Mohamed Aiman in graduation attire, black and white with a red stole and tassel';
export const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
export function getSiteUrl(_req) {
    const configured = normalizeSiteUrl(process.env.SITE_URL);
    return configured || DEFAULT_SITE_URL;
}
export function absoluteUrl(siteUrl, pathname) {
    return new URL(pathname.replace(/^\/+/, ''), `${siteUrl.replace(/\/+$/, '')}/`).href;
}
export function serializeJsonLd(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
export function cleanDescription(value) {
    return value
        .replace(/\s+Email:\s.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}
export function truncateDescription(value, maximumLength = 160) {
    const cleaned = cleanDescription(value);
    if (cleaned.length <= maximumLength)
        return cleaned;
    const shortened = cleaned.slice(0, maximumLength - 1);
    const lastSpace = shortened.lastIndexOf(' ');
    return `${shortened.slice(0, lastSpace > maximumLength * 0.7 ? lastSpace : undefined).trimEnd()}…`;
}
export function xmlEscape(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function normalizeSiteUrl(value) {
    if (!value)
        return null;
    try {
        const url = new URL(value.trim());
        if (!['http:', 'https:'].includes(url.protocol))
            return null;
        return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`;
    }
    catch {
        return null;
    }
}
