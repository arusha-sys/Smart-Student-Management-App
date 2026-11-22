import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export default function AlertBanner({ type = 'warning', title, message, actionText, onAction }) {
  const styles = {
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      button: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    danger: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    }
  };

  const current = styles[type] || styles.warning;

  return (
    <div className={`p-4 rounded-xl border ${current.bg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm`}>
      <div className="flex items-start gap-3">
        {current.icon}
        <div>
          {title && <h4 className="font-bold text-sm tracking-tight">{title}</h4>}
          <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed">{message}</p>
        </div>
      </div>
      {actionText && (
        <button
          onClick={onAction}
          className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${current.button}`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
