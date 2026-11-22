const ReportService = require('../services/ReportService');

const reportService = new ReportService();

exports.getReportData = async (req, res) => {
  try {
    const { type } = req.params;
    const filters = req.query;
    const data = await reportService.generateReportData(type, filters);
    res.json({ success: true, report: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'pdf', ...filters } = req.query;

    const { buffer, mimeType, filename } = await reportService.exportReport(type, format, filters);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
