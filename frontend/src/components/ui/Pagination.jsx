import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Pagination({ 
  totalRecords, 
  currentPage, 
  pageSize, 
  onPageChange, 
  onPageSizeChange 
}) {
  const totalPages = pageSize === 'All' ? 1 : Math.ceil(totalRecords / pageSize);
  const startRecord = pageSize === 'All' ? (totalRecords > 0 ? 1 : 0) : (currentPage - 1) * pageSize + 1;
  const endRecord = pageSize === 'All' ? totalRecords : Math.min(currentPage * pageSize, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{startRecord}</span> to{' '}
        <span className="font-semibold text-gray-900">{endRecord}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalRecords}</span> records
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Rows per page:</label>
          <select 
            value={pageSize}
            onChange={(e) => onPageSizeChange(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            disabled={!onPageSizeChange}
            className="border border-gray-200 rounded-lg text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
          >
            {[10, 25, 50, 100, 'All'].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <nav className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200",
                currentPage === page 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
              )}
            >
              {page}
            </button>
          ))}

          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </nav>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  totalRecords: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  pageSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func
};
