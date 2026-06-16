const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const SERVER_BASE = API_URL.replace(/\/api\/?$/, '');

export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${SERVER_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function parsePhotoUrls(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
