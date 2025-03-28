
// Store the base URL here for easy updates
export const NGROK_BASE_URL = (() => {
  // Check if we're in the Lovable preview environment
  const isPreview = typeof window !== 'undefined' && 
    window.location.hostname.includes('preview--smartreply-bot-solution.lovable.app');
  
  if (isPreview) {
    // In preview, use relative URLs to avoid CORS issues
    return '';
  } else {
    // In production and development, use the local server
    // Isso garante que usaremos nosso próprio servidor em vez de tentar acessar hermesbot.com.br
    return window.location.origin;
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
