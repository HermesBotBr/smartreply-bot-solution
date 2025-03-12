
// Store the ngrok base URL here for easy updates
export const NGROK_BASE_URL = 'https://a1adbfc89876.ngrok.app';

// Helper function to construct full URLs
export const getNgrokUrl = (path: string): string => {
  return `${NGROK_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
