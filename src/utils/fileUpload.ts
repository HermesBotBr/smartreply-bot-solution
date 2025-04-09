
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
    console.log("Current hostname:", host);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed with status:", response.status, errorText);
      throw new Error('Upload failed: ' + response.status);
    }
    
    const data = await response.json();
    
    if (data.success && data.fileUrl) {
      // Return the complete URL including origin
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
