// esm-test.mjs
import ExcelJS from 'exceljs';

try {
  console.log('ExcelJS imported as:', typeof ExcelJS);
  console.log('ExcelJS properties:', Object.keys(ExcelJS));
  
  const workbook = new ExcelJS.Workbook();
  console.log('Workbook created successfully:', workbook);
} catch (err) {
  console.error('Error:', err);
}
