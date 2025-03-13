
// Store the ngrok base URL here for easy updates
export const NGROK_BASE_URL = 'https://seu-app-hermesbot-222accf69f45.herokuapp.com';


// Helper function to construct full URLs
export const getNgrokUrl = (path: string): string => {
  return `${NGROK_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
