// test-export.js
import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testExport() {
  console.log('Testing OD Export functionality...');
  
  try {
    // Make a simple test request to the export endpoint
    const response = await fetch('http://localhost:3000/api/admin/export-od-report', {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
      },
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      let errorText = 'Unknown error';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await response.json();
          errorText = errorJson.message || JSON.stringify(errorJson);
        } else {
          errorText = await response.text();
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(`Export failed with status: ${response.status}. ${errorText}`);
    }
    
    // Save the response to a file for examination
    const buffer = await response.buffer();
    const outputPath = join(__dirname, 'export-test-output.xlsx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Export saved to: ${outputPath}`);
    console.log('Export test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExport();
