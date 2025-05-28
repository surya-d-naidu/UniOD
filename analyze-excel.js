// analyze-excel.js
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the sample file
const samplePath = join(__dirname, 'OD SHEET.xlsx');
const workbook = XLSX.readFile(samplePath);

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get sheet info
console.log('Sheet Name:', sheetName);

// Convert to JSON to see structure
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Print header row
console.log('Headers:', data[0]);

// Print a few rows to see the data structure
console.log('Sample Rows:');
for (let i = 1; i < Math.min(5, data.length); i++) {
  console.log(`Row ${i}:`, data[i]);
}

// Get sheet styling and formatting information
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log('Sheet Range:', worksheet['!ref']);
console.log('Number of Rows:', range.e.r + 1);
console.log('Number of Columns:', range.e.c + 1);

// Check for merged cells
if (worksheet['!merges']) {
  console.log('Merged Cells:', worksheet['!merges']);
}

// Check column widths if available
if (worksheet['!cols']) {
  console.log('Column Widths:', worksheet['!cols']);
}

// Log sheet properties
console.log('Sheet Properties:', workbook.Props);
