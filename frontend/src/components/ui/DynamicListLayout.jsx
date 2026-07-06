import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, Printer, Download, Filter } from 'lucide-react';
import DataTable from './DataTable';

export default function DynamicListLayout({ 
  title, 
  columns, 
  fetchData, // A mock or real function to load API data
  filters = ['date', 'department', 'status'] 
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Simulate Fetch
  React.useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(fetchData ? fetchData() : []);
      setLoading(false);
    }, 500);
  }, [fetchData]);

  const filteredData = data.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold bg-white shadow-sm">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-900 transition-colors font-semibold shadow-sm">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Dynamic Filters Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap gap-4 items-end">
          {filters.includes('date') && (
            <div className="flex gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 block">From Date</label>
                <input type="date" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 block">To Date</label>
                <input type="date" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          )}
          {filters.includes('department') && (
            <div className="space-y-1.5 ml-4">
               <label className="text-xs font-semibold text-gray-600 block">Department</label>
               <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none w-48 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option>All Departments</option>
                  <option>Orthopedics</option>
                  <option>General Medicine</option>
               </select>
            </div>
          )}
          
          <div className="ml-auto w-72 relative">
             <input autoFocus type="text" placeholder="Search parameters..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white" />
             <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          </div>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-200 font-semibold text-sm transition-colors flex items-center gap-2 h-[38px]">
             <Filter className="w-4 h-4"/> Filter
          </button>
        </div>

        {/* Dynamic Data Table */}
        <div className="p-0">
          {loading ? (
             <div className="h-64 flex items-center justify-center text-gray-500 font-medium">Loading records...</div>
          ) : (
            <DataTable 
               data={filteredData}
               columns={columns}
            />
          )}
        </div>
      </div>
    </div>
  );
}

DynamicListLayout.propTypes = {
  title: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({
    header: PropTypes.string,
    accessor: PropTypes.string,
    render: PropTypes.func,
  })).isRequired,
  fetchData: PropTypes.func,
  filters: PropTypes.arrayOf(PropTypes.string),
};
