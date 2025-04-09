
/**
 * Uploads a file to the external server
 * @param file The file to upload
 * @returns The URL of the uploaded file
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file); // Changed to 'image' as per your API spec
  
  try {
    console.log("Preparing to upload file to external API");
    
    // Use the external API endpoint provided
    const uploadUrl = 'https://projetohermes-dda7e0c8d836.herokuapp.com/upload-image';
    console.log("Uploading file to:", uploadUrl);
    
    // Add a cache-busting parameter to avoid caching issues
    const cacheBuster = new Date().getTime();
    const urlWithCache = `${uploadUrl}?_=${cacheBuster}`;
    
    const response = await fetch(urlWithCache, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header as it's set automatically with the correct boundary for multipart/form-data
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
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
    
    // For more robust handling, try to parse as JSON but fall back to handling text responses
    let data;
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log("API response data:", data);
      } else {
        const textResponse = await response.text();
        console.log("API text response:", textResponse);
        
        // Try to parse the text as JSON in case the content-type header is wrong
        try {
          data = JSON.parse(textResponse);
          console.log("Parsed text response as JSON:", data);
        } catch (parseError) {
          console.error("Could not parse response as JSON:", parseError);
          throw new Error('Server returned an invalid response format');
        }
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error('Error parsing server response');
    }
    
    // Handle the response based on your API format
    if (data && data.url) {
      console.log("File uploaded successfully:", data.url);
      return data.url;
    } else if (data && data.imageUrl) {
      console.log("File uploaded successfully:", data.imageUrl);
      return data.imageUrl;
    } else if (data && data.link) {
      console.log("File uploaded successfully:", data.link);
      return data.link;
    } else if (data && data.fileUrl) {
      console.log("File uploaded successfully:", data.fileUrl);
      return data.fileUrl;
    } else {
      console.error("Unexpected response format:", data);
      throw new Error('Unexpected response format from server');
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}
