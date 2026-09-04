const CLOUDINARY_HOST = 'res.cloudinary.com';
const CLOUDINARY_CLOUD_NAME = 'c8tgycuw';

export function isApprovedStringImageSource(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;

  try {
    const url = new URL(value);
    const [cloudName] = url.pathname.split('/').filter(Boolean);

    return url.protocol === 'https:' && url.hostname === CLOUDINARY_HOST && cloudName === CLOUDINARY_CLOUD_NAME;
  } catch {
    return false;
  }
}
