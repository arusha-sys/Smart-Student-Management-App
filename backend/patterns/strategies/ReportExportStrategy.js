// Pattern: Strategy - Encapsulates interchangeable report exporting algorithms (PdfExportStrategy, ExcelExportStrategy)
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

class ReportExportStrategy {
  /**
   * @param {string} title
   * @param {Array<object>} dataRows
   * @param {Array<string>} headers
   * @returns {Promise<{ buffer: Buffer, mimeType: string, filename: string }>}
   */
  async export(title, dataRows, headers) {
    throw new Error('Method export() must be implemented');
  }
}

class PdfExportStrategy extends ReportExportStrategy {
  async export(title, dataRows = [], headers = []) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            buffer: pdfBuffer,
            mimeType: 'application/pdf',
            filename: `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`
          });
        });

        // Header section
        doc.fontSize(18).text('SMART STUDENT MANAGEMENT SYSTEM', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).fillColor('#1e40af').text(title, { align: 'center' });
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1);

        // Table headers
        doc.fillColor('#000000');
        const colWidth = Math.floor((doc.page.width - 60) / Math.max(headers.length, 1));
        let startX = 30;
        let startY = doc.y;

        doc.fontSize(9).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(String(header).toUpperCase(), startX + (i * colWidth), startY, {
            width: colWidth - 5,
            align: 'left'
          });
        });

        doc.moveDown(0.5);
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
        doc.moveDown(0.5);

        // Table rows
        doc.font('Helvetica');
        dataRows.forEach((row) => {
          if (doc.y > doc.page.height - 60) {
            doc.addPage();
          }
          const currentY = doc.y;
          headers.forEach((header, i) => {
            const cellValue = row[header] !== undefined && row[header] !== null ? String(row[header]) : '-';
            doc.text(cellValue, startX + (i * colWidth), currentY, {
              width: colWidth - 5,
              align: 'left'
            });
          });
          doc.moveDown(0.6);
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

class ExcelExportStrategy extends ReportExportStrategy {
  async export(title, dataRows = [], headers = []) {
    return new Promise((resolve, reject) => {
      try {
        const worksheetData = dataRows.map(row => {
          const item = {};
          headers.forEach(h => {
            item[h] = row[h] !== undefined ? row[h] : '';
          });
          return item;
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        resolve({
          buffer: excelBuffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.xlsx`
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

class ReportExportContext {
  constructor(strategy = new PdfExportStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async execute(title, dataRows, headers) {
    return await this.strategy.export(title, dataRows, headers);
  }
}

module.exports = {
  ReportExportStrategy,
  PdfExportStrategy,
  ExcelExportStrategy,
  ReportExportContext
};
