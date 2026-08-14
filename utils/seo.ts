import type { Request } from 'express';

export const SITE_NAME = 'Mohamed Aiman Portfolio';
export const WEB_APP_TITLE = 'Darkguyaiman';
export const DEFAULT_SITE_URL = 'https://darkguyaiman.com';
export const DEFAULT_SOCIAL_IMAGE = '/assets/Mohamed Aiman Alter Ego.webp';
export const DEFAULT_SOCIAL_IMAGE_WIDTH = 1024;
export const DEFAULT_SOCIAL_IMAGE_HEIGHT = 935;
export const DEFAULT_SOCIAL_IMAGE_TYPE = 'image/webp';
export const DEFAULT_SOCIAL_IMAGE_ALT =
  'Portrait of Mohamed Aiman in graduation attire, black and white with a red stole and tassel';
export const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

export interface SeoData {
  siteUrl: string;
  title: string;
  description: string;
  canonical: string;
  image: string;
  imageAlt: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  type: 'website' | 'profile' | 'article';
  robots: string;
  jsonLd: string;
  tags?: string[];
}

export function getSiteUrl(_req: Request): string {
  const configured = normalizeSiteUrl(process.env.SITE_URL);
  return configured || DEFAULT_SITE_URL;
}

export function absoluteUrl(siteUrl: string, pathname: string): string {
  return new URL(pathname.replace(/^\/+/, ''), `${siteUrl.replace(/\/+$/, '')}/`).href;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function cleanDescription(value: string): string {
  return value
    .replace(/\s+Email:\s.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateDescription(value: string, maximumLength = 160): string {
  const cleaned = cleanDescription(value);
  if (cleaned.length <= maximumLength) return cleaned;

  const shortened = cleaned.slice(0, maximumLength - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > maximumLength * 0.7 ? lastSpace : undefined).trimEnd()}…`;
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeSiteUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}
