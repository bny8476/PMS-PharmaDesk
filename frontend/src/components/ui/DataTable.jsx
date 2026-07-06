import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function DataTable({ 
  columns, 
  data, 
  loading, 
  className,
  stickyHeader = true,
  striped = true,
  hover = true,
  virtualized = false,
  overflowVisible = false,
  containerHeight = "600px",
  rowHeight = 52,
  onRowClick
}) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualItems = virtualized ? rowVirtualizer.getVirtualItems() : [];
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  return (
    <div 
      ref={virtualized ? parentRef : null}
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 relative", 
        virtualized ? "overflow-y-auto" : overflowVisible ? "overflow-visible" : "overflow-x-auto",
        className
      )}
      style={virtualized ? { maxHeight: containerHeight } : {}}
    >
      <table className="w-full text-sm text-left border-collapse">
        <thead className={cn(
          "text-xs text-white uppercase bg-indigo-900 border-b border-indigo-800",
          stickyHeader && "sticky top-0 z-10"
        )}>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            // Skeleton Loading State
            [...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty State
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">No records found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search term</p>
                </div>
              </td>
            </tr>
          ) : virtualized ? (
            <>
              {paddingTop > 0 && <tr><td style={{ height: `${paddingTop}px` }} colSpan={columns.length} /></tr>}
              {virtualItems.map((virtualRow) => {
                const row = data[virtualRow.index];
                return (
                  <tr 
                    key={row.id || row._id || virtualRow.index} 
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors",
                      (hover || onRowClick) && "hover:bg-blue-50/60",
                      onRowClick ? "cursor-pointer" : "cursor-default",
                      striped && virtualRow.index % 2 !== 0 ? "bg-slate-50" : "bg-white"
                    )}
                  >
                    {columns.map((col, j) => (
                      <td key={j} className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                        {col.accessor ? row[col.accessor] : col.render ? col.render(row, virtualRow.index) : null}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {paddingBottom > 0 && <tr><td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} /></tr>}
            </>
          ) : (
            data.map((row, i) => (
              <tr 
                key={row.id || row._id || i} 
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "transition-colors",
                  (hover || onRowClick) && "hover:bg-blue-50/60",
                  onRowClick ? "cursor-pointer" : "cursor-default",
                  striped && i % 2 !== 0 ? "bg-slate-50" : "bg-white"
                )}
              >
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                    {col.accessor ? row[col.accessor] : col.render ? col.render(row, i) : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.node,
      accessor: PropTypes.string,
      render: PropTypes.func
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  className: PropTypes.string,
  stickyHeader: PropTypes.bool,
  striped: PropTypes.bool,
  hover: PropTypes.bool,
  virtualized: PropTypes.bool,
  containerHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rowHeight: PropTypes.number,
  onRowClick: PropTypes.func
};
