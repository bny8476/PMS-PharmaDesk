import React from 'react';
import PropTypes from 'prop-types';
import { Search, Calendar, Filter, X } from 'lucide-react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { cn } from '../../utils/cn';

export default function ModuleFilterBar({ 
  onSearch, 
  onFilterChange, 
  onDateChange,
  dateRange = { from: null, to: null },
  filters = [],
  actions = [],
  searchValue = "",
  searchPlaceholder = "Search...",
  hideDateRange = false,
  children
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-4 flex-1">
        {/* Date Ranges */}
        {!hideDateRange && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <ReactDatePicker
                selected={dateRange.from}
                onChange={(date) => onDateChange('from', date)}
                placeholderText="From Date"
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 w-36 transition-all"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <span className="text-gray-400 font-medium">to</span>
            <div className="relative">
              <ReactDatePicker
                selected={dateRange.to}
                onChange={(date) => onDateChange('to', date)}
                placeholderText="To Date"
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 w-36 transition-all"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        )}

        {/* Dynamic Filters */}
        {filters.map((f, i) => (
          <div key={i} className="min-w-[140px]">
            <select
              onChange={(e) => onFilterChange(f.name, e.target.value)}
              className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
            >
              <option value="">All {f.label}</option>
              {f.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}

        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
        
        {children}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm",
              action.variant === 'primary' 
                ? "bg-primary text-white hover:bg-blue-700 shadow-blue-200/50" 
                : action.variant === 'success'
                ? "bg-green-600 text-white hover:bg-green-700 shadow-green-200/50"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-gray-100"
            )}
          >
            {action.icon && <action.icon className="w-4 h-4" />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

ModuleFilterBar.propTypes = {
  onSearch: PropTypes.func,
  onFilterChange: PropTypes.func,
  onDateChange: PropTypes.func,
  dateRange: PropTypes.shape({
    from: PropTypes.instanceOf(Date),
    to: PropTypes.instanceOf(Date),
  }),
  filters: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })).isRequired,
  })),
  actions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    onClick: PropTypes.func.isRequired,
    variant: PropTypes.oneOf(['primary', 'success', 'default']),
  })),
  searchValue: PropTypes.string,
  searchPlaceholder: PropTypes.string,
};
