
export const NGROK_BASE_URL = (() => {
  // Check if we're in the Lovable preview environment
  const isPreview = typeof window !== 'undefined' && 
    window.location.hostname.includes('preview--smartreply-bot-solution.lovable.app');
  
  // Use the new Heroku URL
  return isPreview ? '' : 'https://projetohermes-dda7e0c8d836.herokuapp.com';
})();

// Helper function to construct full URLs
export const getNgrokUrl = (path: string): string => {
  // If empty base URL (preview environment), use relative paths
  if (NGROK_BASE_URL === '') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  return `${NGROK_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

// Helper function to construct local API URLs
export const getLocalApiUrl = (path: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/api${path.startsWith('/') ? path : `/${path}`}`;
};
