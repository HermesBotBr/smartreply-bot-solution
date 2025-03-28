
// Store the base URL here for easy updates
export const NGROK_BASE_URL = (() => {
  // Check if we're in the Lovable preview environment
  const isPreview = typeof window !== 'undefined' && 
    window.location.hostname.includes('preview--smartreply-bot-solution.lovable.app');
  
  if (isPreview) {
    // In preview, use relative URLs to avoid CORS issues
    return '';
  } else if (process.env.NODE_ENV === 'production') {
    // In production, use the production API URL
    return 'https://www.hermesbot.com.br';
  } else {
    // In development, use localhost
    return 'http://localhost:3000';
  }
})();

// Helper function to construct full URLs
export const getNgrokUrl = (path: string): string => {
  // If empty base URL (preview environment), use relative paths
  if (NGROK_BASE_URL === '') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  return `${NGROK_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
