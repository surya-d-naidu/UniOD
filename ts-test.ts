// ts-test.ts
import ExcelJS from 'exceljs';

try {
  console.log('ExcelJS imported as:', typeof ExcelJS);
  
  const workbook = new ExcelJS.Workbook();
  console.log('Workbook created successfully');
  
  // Add a worksheet
  const worksheet = workbook.addWorksheet('Sheet1');
  console.log('Worksheet added successfully');
  
  // Add columns
  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Name', key: 'name' }
  ];
  console.log('Columns added successfully');
  
  // Add a few rows
  worksheet.addRow({ id: 1, name: 'Test User' });
  console.log('Row added successfully');
  
  console.log('Test completed successfully');
} catch (err) {
  console.error('Error:', err);
}
