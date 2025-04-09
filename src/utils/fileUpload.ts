
/**
 * Uploads a file to the server
 * @param file The file to upload
 * @returns The URL of the uploaded file
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Get current URL info for debugging
    const currentUrl = window.location.href;
    const host = window.location.hostname;
    const path = window.location.pathname;
    console.log("Current URL:", currentUrl);
    console.log("Current host:", host);
    console.log("Current path:", path);
    
    // Always use explicit path regardless of environment
    const uploadUrl = '/api/uploads/upload';
    console.log("Uploading file to:", uploadUrl);
    
    // Add a cache-busting parameter to avoid caching issues
    const cacheBuster = new Date().getTime();
    const urlWithCache = `${uploadUrl}?_=${cacheBuster}`;
    
    const response = await fetch(urlWithCache, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Add this to help servers identify AJAX requests
      }
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", [...response.headers.entries()]);
    
    // Get the content type to check format
    const contentType = response.headers.get('content-type');
    console.log("Response content type:", contentType);
    
    if (!response.ok) {
      // Try to get response text for debugging
      const responseText = await response.text();
      console.error("Error response:", responseText.slice(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    if (!contentType || !contentType.includes('application/json')) {
      // Try to get response text for debugging
      const responseText = await response.text();
      console.error("Unexpected content type:", contentType);
      console.error("Response body (first 500 chars):", responseText.slice(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      throw new Error('Server returned an invalid response format');
    }
    
    const data = await response.json();
    console.log("API response data:", data);
    
    if (data.success && data.fileUrl) {
      console.log("File uploaded successfully:", data.fileUrl);
      return data.fileUrl;
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}
