
// Simple utility for handling file uploads

/**
 * Uploads a file to the server
 * @param file The file to upload
 * @returns The URL of the uploaded file
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Create a unique filename based on timestamp and original name
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    
    // For development purposes, we'll store files in localStorage temporarily
    // In production, this should be replaced with a proper file upload endpoint
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store the file in localStorage with a unique key
        localStorage.setItem(`uploaded_file_${uniqueFileName}`, reader.result as string);
        
        // Return the virtual path to the file
        // In a real implementation, this would be the actual URL from the server
        const fileUrl = `/uploads/${uniqueFileName}`;
        console.log("File uploaded virtually as:", fileUrl);
        resolve(fileUrl);
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}
