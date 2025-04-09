
/**
 * Uploads a file to the server
 * @param file The file to upload
 * @returns The URL of the uploaded file
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Determine the correct upload URL based on environment
    const host = window.location.hostname;
    let uploadUrl;
    
    // Check if we're on a specific domain or in local/development
    if (host === 'www.hermesbot.com.br' || host.includes('hermes')) {
      // For production environment, use the API path
      uploadUrl = '/api/uploads/upload';
    } else {
      // For local development or other environments
      uploadUrl = '/uploads/upload';
    }
    
    console.log("Uploading file to:", uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", [...response.headers.entries()]);
    
    if (!response.ok) {
      // Try to get response text for debugging
      const responseText = await response.text();
      console.error("Error response:", responseText.slice(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    // Get the content type to ensure we're parsing JSON
    const contentType = response.headers.get('content-type');
    console.log("Response content type:", contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      // Try to get response text for debugging
      const responseText = await response.text();
      console.error("Unexpected content type:", contentType);
      console.error("Response body (first 500 chars):", responseText.slice(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      throw new Error('Server returned an invalid response format');
    }
    
    const data = await response.json();
    
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
