export const PRODUCTION_WEB_URL = 'https://tinytale.top';
export const PRODUCTION_API_URL = 'https://api.tinytale.top';

export const DEFAULT_WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_URL?.trim() || PRODUCTION_WEB_URL;
export const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || PRODUCTION_API_URL;
