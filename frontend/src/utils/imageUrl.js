import axios from 'axios';

export const FALLBACK_LIBRARY_IMAGE = 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80';

/**
 * Normalizes and resolves an image URL to work seamlessly across both local development
 * and live production environments (e.g. Render / Vercel).
 */
export const getImageUrl = (img) => {
  if (!img || typeof img !== 'string') {
    return FALLBACK_LIBRARY_IMAGE;
  }

  // Handle data URIs or full external URLs
  if (img.startsWith('data:')) return img;
  if (img.startsWith('http://') || img.startsWith('https://')) {
    // If a local URL was mistakenly saved in the database while running locally,
    // rewrite it when accessed on the live website.
    const isLiveSite = typeof window !== 'undefined' && 
      !window.location.hostname.includes('localhost') && 
      !window.location.hostname.includes('127.0.0.1');

    if (isLiveSite && img.includes('localhost:5000')) {
      return img.replace('http://localhost:5000', 'https://studyseat-backend.onrender.com');
    }
    return img;
  }

  // Determine backend server base URL
  const isLiveSite = typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') && 
    !window.location.hostname.includes('127.0.0.1');

  let serverBase = '';
  if (isLiveSite) {
    serverBase = 'https://studyseat-backend.onrender.com';
  } else if (axios.defaults.baseURL) {
    serverBase = axios.defaults.baseURL.replace(/\/api\/?$/, '');
  } else if (import.meta.env.VITE_API_URL) {
    serverBase = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  } else {
    serverBase = 'http://localhost:5000';
  }

  // Normalize path to always include /uploads/
  let normalizedPath = img.trim();
  if (!normalizedPath.startsWith('/uploads/') && !normalizedPath.startsWith('uploads/')) {
    normalizedPath = `/uploads/${normalizedPath.replace(/^\/+/, '')}`;
  } else if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }

  return `${serverBase}${normalizedPath}`;
};
