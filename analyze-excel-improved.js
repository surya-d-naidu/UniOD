// analyze-excel-improved.js
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the sample file
const samplePath = join(__dirname, 'OD SHEET.xlsx');
console.log('Reading file from:', samplePath);

try {
  const workbook = XLSX.readFile(samplePath);
  
  // Log all worksheet names
  console.log('All Sheets:', workbook.SheetNames);
  
  // Analyze each sheet
  workbook.SheetNames.forEach(sheetName => {
    console.log('\n=== ANALYZING SHEET:', sheetName, '===');
    const worksheet = workbook.Sheets[sheetName];
    
    // Get sheet range
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log('Sheet Range:', worksheet['!ref']);
    console.log('Number of Rows:', range.e.r + 1);
    console.log('Number of Columns:', range.e.c + 1);
    
    // Convert to JSON to see structure
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Print header row
    console.log('Headers:', data[0]);
    
    // Print a few rows to see the data structure
    console.log('Sample Rows:');
    for (let i = 1; i < Math.min(5, data.length); i++) {
      console.log(`Row ${i}:`, data[i]);
    }
    
    // Check for merged cells
    if (worksheet['!merges']) {
      console.log('Merged Cells:', worksheet['!merges']);
    }
    
    // Check column widths if available
    if (worksheet['!cols']) {
      console.log('Column Widths:', worksheet['!cols']);
    }
    
    // Check for any cell formatting
    console.log('Cell Styles (sample):');
    for (let r = 0; r <= Math.min(2, range.e.r); r++) {
      for (let c = 0; c <= range.e.c; c++) {
        const cell_address = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[cell_address];
        if (cell && cell.s) {
          console.log(`Style for ${cell_address}:`, cell.s);
        }
      }
    }
  });
  
  console.log('\nWorkbook Properties:', workbook.Props || 'None');
} catch (err) {
  console.error('Error analyzing Excel file:', err);
}
