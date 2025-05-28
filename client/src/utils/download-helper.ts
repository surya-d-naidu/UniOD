/**
 * Helper utility for handling file downloads
 */

/**
 * Download a file from a URL
 * This function handles the download process more robustly than using window.open()
 * @param url The URL to download the file from
 * @param filename The filename to save the file as
 * @param contentType The content type of the file
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    console.log(`Starting download from ${url}...`);
    
    // Fetch the file with proper error handling
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
      },
      credentials: 'include', // Important: include cookies for authentication
    });
    
    console.log(`Response received with status: ${response.status}`);
    
    // Check for error responses
    if (!response.ok) {
      let errorText = 'Unknown error';
      
      // Try to parse error response
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Try to parse JSON error
          const errorJson = await response.json();
          errorText = errorJson.message || JSON.stringify(errorJson);
        } else {
          // Try to get text error
          errorText = await response.text();
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        errorText = `Failed to parse error response: ${parseError}`;
      }
      
      console.error(`Download failed: Status ${response.status}, Content: ${errorText}`);
      throw new Error(`Download failed with status: ${response.status}. ${errorText}`);
    }
    
    // Get content disposition header to extract filename if not provided
    const contentDisposition = response.headers.get('content-disposition');
    let suggestedFilename: string | null = null;
    
    if (contentDisposition) {
      const filenamePart = contentDisposition.split('filename=')[1];
      if (filenamePart) {
        suggestedFilename = filenamePart.trim().replace(/"/g, '');
      }
    }
    
    // Use provided filename, or suggested from server, or default
    const finalFilename = filename || suggestedFilename || 'OD_SHEET.xlsx';
    console.log(`Using filename: ${finalFilename}`);
    
    // Get the blob from the response
    const blob = await response.blob();
    console.log(`Blob received, size: ${blob.size} bytes, type: ${blob.type}`);
    
    // Check if the blob has valid content
    if (blob.size === 0) {
      throw new Error("Received empty file. Please try again or contact support.");
    }
    
    // Check if we got an Excel file type
    if (!blob.type.includes('spreadsheetml') && 
        !blob.type.includes('ms-excel') && 
        !blob.type.includes('octet-stream')) {
      console.warn(`Unexpected content type: ${blob.type}, but continuing with download attempt`);
    }
    
    // Create a download link and trigger it
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    console.log('Download triggered');
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Download error:', error);
    return Promise.reject(error);
  }
}
