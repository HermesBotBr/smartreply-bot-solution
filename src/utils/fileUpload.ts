
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
    
    // Accept the response even if it has a different format
    // The server returns { message: 'Imagem enviada com sucesso.', file: {...} }
    if (data) {
      // If the server returns a URL, use it
      if (data.url) {
        console.log("File uploaded successfully:", data.url);
        return data.url;
      } 
      // If the server returns a file object with path
      else if (data.file && data.file.path) {
        const imageUrl = `https://projetohermes-dda7e0c8d836.herokuapp.com/${data.file.path}`;
        console.log("File uploaded successfully, constructed URL:", imageUrl);
        return imageUrl;
      }
      // Other possible response formats
      else if (data.imageUrl) {
        console.log("File uploaded successfully:", data.imageUrl);
        return data.imageUrl;
      } 
      else if (data.link) {
        console.log("File uploaded successfully:", data.link);
        return data.link;
      } 
      else if (data.fileUrl) {
        console.log("File uploaded successfully:", data.fileUrl);
        return data.fileUrl;
      }
      
      // If we can't find a URL but the request succeeded, we'll construct one
      const imagePath = data.file?.filename || data.filename || 'uploaded-image';
      const baseUrl = 'https://projetohermes-dda7e0c8d836.herokuapp.com/uploads/';
      const constructedUrl = baseUrl + imagePath;
      console.log("Constructed URL from response:", constructedUrl);
      return constructedUrl;
    }
    
    throw new Error('Unexpected response format from server');
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * Uploads a file to Mercado Livre via Hermes API
 * @param file The file to upload
 * @param sellerId The seller ID
 * @returns The attachment ID from Mercado Livre
 */
export async function uploadFileToMercadoLivre(file: File, sellerId: string): Promise<string> {
  if (!file || !sellerId) {
    throw new Error("File and seller ID are required");
  }

  try {
    console.log("Preparing to upload file to Mercado Livre via Hermes API");
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('seller_id', sellerId);
    
    const uploadUrl = 'https://projetohermes-dda7e0c8d836.herokuapp.com/upload';
    console.log("Uploading to ML via Hermes:", uploadUrl);
    console.log("With seller ID:", sellerId);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // Let the browser set the correct content-type with boundary
    });
    
    console.log("ML Upload response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ML Upload error response:", errorText);
      throw new Error(`ML Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("ML Upload response data:", data);
    
    // Extract the attachment ID from the response
    if (data && data.attachment_id) {
      console.log("ML Upload successful, attachment ID:", data.attachment_id);
      return data.attachment_id;
    } else {
      console.error("Unexpected ML upload response format:", data);
      throw new Error("Mercado Livre upload response did not contain attachment_id");
    }
    
  } catch (error) {
    console.error("Error uploading file to Mercado Livre:", error);
    throw new Error(`Failed to upload file to Mercado Livre: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
