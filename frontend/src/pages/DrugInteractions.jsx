import React, { useState, useEffect } from 'react';
import useDebounce from '../hooks/useDebounce';
import { ShieldAlert, Search, RefreshCw, AlertTriangle, ShieldCheck, ListPlus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function DrugInteractions() {
  const queryClient = useQueryClient();
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [interactions, setInteractions] = useState([]);

  // Fetch medicines
  const { data: rawMedicines = [] } = useQuery({
    queryKey: ['medicines-list'],
    queryFn: async () => {
      const res = await pharmacyService.getMedicines();
      const data = res.data || res;
      return Array.isArray(data) ? data : [];
    }
  });
  const medicines = rawMedicines;

  // Fetch incident logs
  const { data: rawIncidentLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['interaction-logs'],
    queryFn: async () => {
      const res = await pharmacyService.getDrugInteractionIncidentReport();
      const data = res.data || res;
      return Array.isArray(data) ? data : [];
    }
  });
  const incidentLogs = rawIncidentLogs;

  const handleAddMedicine = (med) => {
    if (selectedMedicines.some(m => m.id === med.id)) {
      toast.error('Medicine already added');
      return;
    }
    setSelectedMedicines([...selectedMedicines, med]);
    setSearchTerm('');
  };

  const handleRemoveMedicine = (id) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.id !== id));
  };

  const checkMutation = useMutation({
    mutationFn: (ids) => pharmacyService.checkDrugInteractions(ids),
    onSuccess: (res) => {
      const data = res.data || res;
      const results = Array.isArray(data) ? data : [];
      setInteractions(results);
      if (results.length > 0) {
        toast.error(`Detected ${results.length} drug-drug interaction(s)!`);
      } else {
        toast.success('No drug interactions detected for this combination.');
      }
      queryClient.invalidateQueries(['interaction-logs']);
    },
    onError: () => {
      toast.error('Failed to perform drug interaction check');
    }
  });

  const handleCheck = () => {
    if (selectedMedicines.length < 2) {
      toast.error('Select at least two medicines to perform check');
      return;
    }
    setInteractions([]);
    const ids = selectedMedicines.map(m => m.id);
    checkMutation.mutate(ids);
  };

  const filteredMedicines = searchTerm.trim() === '' ? [] : medicines.filter(m => 
    m.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    m.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const getSeverityColor = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CONTRAINDICATED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SERIOUS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MONITOR':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Drug Interaction Checker</h2>
        <p className="text-sm text-slate-400">Perform multi-drug analysis to detect contraindicated or dangerous clinical combinations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interaction Picker & Checker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700">Select Drugs for Analysis</h3>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search medicine by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />

              {filteredMedicines.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                  {filteredMedicines.map(med => (
                    <button
                      key={med.id}
                      onClick={() => handleAddMedicine(med)}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-700">{med.name}</span>
                      <span className="text-slate-400 font-mono">{med.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Drugs list */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Analysis List</div>
              <div className="flex flex-wrap gap-2">
                {selectedMedicines.map(med => (
                  <div key={med.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg">
                    <span>{med.name}</span>
                    <button onClick={() => handleRemoveMedicine(med.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {selectedMedicines.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No drugs selected yet. Search and add.</span>
                )}
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={checkMutation.isPending || selectedMedicines.length < 2}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              {checkMutation.isPending ? 'Running Screen...' : 'Analyze Inter-Drug Action'}
            </button>
          </div>

          {/* Checker Results */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700">Analysis Output</h3>
            
            {interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.map((inter, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{inter.drugAName}</span>
                        <span className="text-slate-400 font-bold">&</span>
                        <span className="font-bold text-slate-700">{inter.drugBName}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getSeverityColor(inter.severity)}`}>
                        {inter.severity}
                      </span>
                    </div>
                    {inter.description && <p className="text-xs text-slate-600 leading-relaxed">{inter.description}</p>}
                    {inter.mechanism && <div className="text-[10px] text-slate-500"><span className="font-bold">Mechanism:</span> {inter.mechanism}</div>}
                    {inter.management && <div className="text-[10px] text-red-600 font-medium"><span className="font-bold">Clinical Action:</span> {inter.management}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">Screen cleared. No clinical interaction detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Checker Incident Audit Logs */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Interaction Log</h3>
            <button onClick={() => queryClient.invalidateQueries(['interaction-logs'])} disabled={loadingLogs} className="p-1 text-slate-400 hover:text-slate-600">
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="divide-y divide-slate-50 overflow-auto max-h-[500px]">
            {incidentLogs.map(log => (
              <div key={log.id} className="p-4 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Audit Log #{log.id}</span>
                  <span className="font-mono text-slate-400 text-[10px]">{log.checkedAt}</span>
                </div>
                <div className="text-slate-600">Checked {log.itemsCheckedCount} drugs.</div>
                <div className="text-slate-500">
                  Detected Interactions:{' '}
                  <span className={`font-bold ${log.interactionsDetectedCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {log.interactionsDetectedCount}
                  </span>
                </div>
              </div>
            ))}
            {incidentLogs.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs">No scan history logs yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
