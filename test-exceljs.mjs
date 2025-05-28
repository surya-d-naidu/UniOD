// test-exceljs.mjs
// Try different ways to import ExcelJS

// Import approach 1: Default import
import ExcelJS from 'exceljs';

console.log('ExcelJS object:', typeof ExcelJS, Object.keys(ExcelJS));

// Create a workbook
try {
  // Approach 1: Using default import
  const workbook = new ExcelJS.Workbook();
  
  console.log('Created workbook successfully:', workbook);
} catch (err) {
  console.error('Error creating workbook:', err);
}
