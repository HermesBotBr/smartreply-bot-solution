
// Store the base URL here for easy updates
export const NGROK_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:3000' 
  : 'http://localhost:3000';

// Helper function to construct full URLs
export const getNgrokUrl = (path: string): string => {
  return `${NGROK_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
