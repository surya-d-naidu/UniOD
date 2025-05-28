// simple-test.js
try {
  const ExcelJS = require('exceljs');
  console.log('ExcelJS loaded successfully');
  
  const workbook = new ExcelJS.Workbook();
  console.log('Workbook created successfully');
} catch (err) {
  console.error('Error:', err);
}
