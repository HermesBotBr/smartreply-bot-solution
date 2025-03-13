
// Store the ngrok base URL here for easy updates
export const NGROK_BASE_URL = 'https://e3140bd8b8c4.ngrok.app';

// Helper function to construct full URLs
export const getNgrokUrl = (path: string): string => {
  return `${NGROK_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
