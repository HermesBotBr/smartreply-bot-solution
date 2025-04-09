
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
 * Uploads a file to Mercado Livre's cloud storage via Hermes API
 * @param file The file to upload
 * @param sellerId The seller ID
 * @returns The attachment ID to be used when sending a message
 */
export async function uploadFileToMercadoLivre(file: File, sellerId: string): Promise<string> {
  if (!file || !sellerId) {
    throw new Error("File and seller ID are required");
  }
  
  const formData = new FormData();
  formData.append('File', file);
  formData.append('seller_id', sellerId);
  
  try {
    console.log(`Preparing to upload file to Mercado Livre for seller ${sellerId}`, {
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name
    });
    
    const uploadUrl = 'https://projetohermes-dda7e0c8d836.herokuapp.com/upload';
    console.log("Using upload endpoint:", uploadUrl);
    
    // Add debugging middleware to check what's being sent
    const debugResponse = await fetch(uploadUrl, {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json'
      }
    }).catch(err => {
      console.log("OPTIONS request failed, but this might be expected:", err);
      return null;
    });
    
    if (debugResponse) {
      console.log("OPTIONS response:", debugResponse.status, debugResponse.statusText);
    }
    
    // Log what's in the FormData for debugging (can't directly log FormData content)
    for (const pair of formData.entries()) {
      console.log(`FormData entry: ${pair[0]} = ${pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]}`);
    }
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // Explicitly not setting Content-Type header so browser can set it with boundary
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    console.log("Upload response status:", response.status);
    console.log("Upload response headers:", [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      console.log("Response is not JSON, text:", textResponse);
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("Could not parse response as JSON:", e);
        throw new Error("Invalid response format from server");
      }
    }
    
    console.log("Upload response data:", data);
    
    if (data && data.id) {
      console.log("File uploaded successfully, attachment ID:", data.id);
      return data.id;
    }
    
    throw new Error("Invalid response format: missing attachment ID");
  } catch (error) {
    console.error("Error uploading file to Mercado Livre:", error);
    throw error;
  }
}
