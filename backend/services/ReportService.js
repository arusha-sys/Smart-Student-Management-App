const { ReportFactory } = require('../patterns/factories/ReportFactory');
const { ReportExportContext, PdfExportStrategy, ExcelExportStrategy } = require('../patterns/strategies/ReportExportStrategy');

class ReportService {
  constructor() {
    this.pdfStrategy = new PdfExportStrategy();
    this.excelStrategy = new ExcelExportStrategy();
    this.exportContext = new ReportExportContext(this.pdfStrategy);
  }

  async generateReportData(type, filters = {}) {
    const reportGenerator = ReportFactory.create(type);
    return await reportGenerator.generate(filters);
  }

  async exportReport(type, format = 'pdf', filters = {}) {
    const reportData = await this.generateReportData(type, filters);

    if (format.toLowerCase() === 'excel' || format.toLowerCase() === 'xlsx') {
      this.exportContext.setStrategy(this.excelStrategy);
    } else {
      this.exportContext.setStrategy(this.pdfStrategy);
    }

    return await this.exportContext.execute(reportData.title, reportData.rows, reportData.headers);
  }
}

module.exports = ReportService;
