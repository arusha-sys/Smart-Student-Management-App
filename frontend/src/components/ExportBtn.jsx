import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import api from '../services/api';

export default function ExportBtn({ reportType, filters = {}, label = 'Export Report' }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (format) => {
    setDownloading(true);
    setOpen(false);

    try {
      const response = await api.get(`/reports/${reportType}/export`, {
        params: { format, ...filters },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
      >
        <Download className="w-4 h-4 text-slate-500" />
        <span>{downloading ? 'Exporting...' : label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 focus:outline-none z-30">
          <div className="py-1">
            <button
              onClick={() => handleExport('pdf')}
              className="group flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary-600 w-full text-left"
            >
              <FileText className="w-4 h-4 text-red-500" />
              <span>Export as PDF</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="group flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-600 w-full text-left"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export as Excel / CSV</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
