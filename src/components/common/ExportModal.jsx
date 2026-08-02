import { useState } from 'react';

export default function ExportModal({ isOpen, onClose, onExport, type = "Incidents" }) {
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');
  const [category, setCategory] = useState('all');

  if (!isOpen) return null;

  const handleExport = () => {
    onExport({ format, dateRange, category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,30,43,0.65)] backdrop-blur-[3px]"
         role="dialog" aria-modal="true">
      <div className="um-confirm-panel" style={{ textAlign: 'left' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[20px] font-semibold text-[var(--c-stone)] m-0">Export {type}</h2>
          <button onClick={onClose} className="text-[var(--c-stone-muted)] hover:text-[var(--c-brand)] transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-[14px] font-medium text-[var(--c-stone)] mb-2">Export Format</label>
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value)}
            className="w-full bg-[var(--c-bg-subtle)] border border-[var(--c-border)] rounded-[6px] px-3 py-2 text-[var(--c-stone)] focus:border-[var(--c-brand)] focus:outline-none"
          >
            <option value="csv">CSV (Spreadsheet)</option>
            <option value="pdf">PDF Document</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-[14px] font-medium text-[var(--c-stone)] mb-2">Date Range</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-[var(--c-bg-subtle)] border border-[var(--c-border)] rounded-[6px] px-3 py-2 text-[var(--c-stone)] focus:border-[var(--c-brand)] focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="30days">Last 30 Days</option>
            <option value="7days">Last 7 Days</option>
            <option value="today">Today</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-[14px] font-medium text-[var(--c-stone)] mb-2">Category Filter</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[var(--c-bg-subtle)] border border-[var(--c-border)] rounded-[6px] px-3 py-2 text-[var(--c-stone)] focus:border-[var(--c-brand)] focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Medical">Medical</option>
            <option value="Fire">Fire</option>
            <option value="Wildlife">Wildlife</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--c-border)]">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[var(--c-stone)] hover:bg-[var(--c-bg-subtle)] rounded-[6px] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleExport} className="px-4 py-2 text-[14px] font-medium bg-[var(--c-brand)] text-[var(--c-bg-dark)] rounded-[6px] hover:bg-[#00d65b] transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Now
          </button>
        </div>
      </div>
    </div>
  );
}
