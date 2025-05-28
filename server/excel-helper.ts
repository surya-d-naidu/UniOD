// Import exceljs with named import (works in both CommonJS and ESM)
import ExcelJS from 'exceljs';

// Create a workbook
async function createWorkbook() {
  try {
    // Try the standard way first
    return new ExcelJS.Workbook();
  } catch (err) {
    console.error('Error creating workbook with default approach:', err);
    
    // If that fails, try alternate approaches
    try {
      // @ts-ignore
      if (typeof ExcelJS === 'function') {
        // @ts-ignore
        return new ExcelJS();
      }
      
      // @ts-ignore
      if (ExcelJS && ExcelJS.Workbook) {
        // @ts-ignore
        return new ExcelJS.Workbook();
      }
      
      throw new Error('Could not create workbook, ExcelJS import is not valid');
    } catch (fallbackErr) {
      console.error('Error in fallback workbook creation:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export { createWorkbook };
