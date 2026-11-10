/**
 * Resolves static public asset paths taking into account Vite's base path (e.g. GitHub Pages subpaths).
 *
 * Example:
 *   assetUrl('/subharti-polytechnic-main-building.jpg') -> '/poly/subharti-polytechnic-main-building.jpg' (production)
 *   assetUrl('/subharti-polytechnic-main-building.jpg') -> '/subharti-polytechnic-main-building.jpg' (development)
 */
export const assetUrl = (path) => {
  if (!path) return "";
  if (/^(?:https?:|\/\/|data:)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
};

export default assetUrl;
