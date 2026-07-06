import React, { useState, useEffect, useRef } from 'react';
import { Camera, ScanBarcode, Send, RefreshCw, AlertCircle, Play, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';
import pharmacyService from '../utils/pharmacyService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function BarcodeScanner() {
  const [barcodeValue, setBarcodeValue] = useState('');
  const [scanModule, setScanModule] = useState('SALES');
  const [scans, setScans] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: (term) => pharmacyService.scanBarcode(term, scanModule, 1),
    onSuccess: (res, term) => {
      if (res.success || res.id) {
        toast.success(`Barcode detected: "${term}" (${res.data?.medicineName || 'Scanned Logged'})`);
        setScans(prev => [res.data || res, ...prev]);
        setBarcodeValue('');
        queryClient.invalidateQueries(['stocks']);
      } else {
        toast.error('Barcode lookup failed');
      }
    },
    onError: () => {
      toast.error('Error logging scanned barcode');
    }
  });

  // USB listener
  useEffect(() => {
    let buffer = '';
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        if (buffer.length > 3) {
          handleScanSubmit(buffer);
          buffer = '';
        }
      } else {
        buffer += e.key;
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [scanModule]);

  const handleScanSubmit = (val = barcodeValue) => {
    const term = val?.trim();
    if (!term) return;
    scanMutation.mutate(term);
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast.success('Camera scan simulation active. Point to barcode.');
    } catch (err) {
      toast.error('Could not access camera. Using simulation mode.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const simulateCameraScan = () => {
    // Generate a random valid sample barcode
    const barcodes = ['8901043000494', '8901234567890', 'BTH9080-VAL', 'NARC-X-441'];
    const idx = Math.floor(Math.random() * barcodes.length);
    setBarcodeValue(barcodes[idx]);
    toast.success('Simulation detected barcode code!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Barcode & QR Scanner</h2>
        <p className="text-sm text-slate-400">Supports hardware USB scanner attachment (plug-and-play listener) or camera capture decoding.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanning Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700">Select Operating Module</h3>
            <div className="grid grid-cols-3 gap-2">
              {['SALES', 'GRN_ENTRY', 'INVENTORY'].map(mod => (
                <button
                  key={mod}
                  onClick={() => setScanModule(mod)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    scanModule === mod
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {mod.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Simulated/Manual Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Barcode / QR Value Input</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan with hardware scanner or enter manually..."
                  value={barcodeValue}
                  onChange={e => setBarcodeValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScanSubmit()}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                />
                <button
                  onClick={() => handleScanSubmit()}
                  disabled={scanMutation.isPending || !barcodeValue}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Submit
                </button>
              </div>
            </div>
          </div>

          {/* Camera Scanning view */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Camera Scanner Feed</h3>
              <div className="flex gap-2">
                {isScanning ? (
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 font-bold rounded-lg text-[10px] transition-colors flex items-center gap-1"
                  >
                    <Square className="w-3 h-3" /> Stop Camera
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-lg text-[10px] transition-colors flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" /> Start Camera
                  </button>
                )}
                {isScanning && (
                  <button
                    onClick={simulateCameraScan}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold rounded-lg text-[10px]"
                  >
                    Simulate Detection
                  </button>
                )}
              </div>
            </div>

            {isScanning ? (
              <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden border border-slate-200">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 animate-pulse" />
              </div>
            ) : (
              <div className="w-full max-w-md aspect-video bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center p-4">
                <ScanBarcode className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-400">Camera feed offline. Click Start Camera to initialize.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Scan ledger history */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Scan Session History</h3>
          </div>
          <div className="divide-y divide-slate-50 overflow-auto max-h-[500px]">
            {scans.map((scan, idx) => (
              <div key={idx} className="p-4 text-xs space-y-1 bg-slate-50/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Module: {scan.scanModule || scanModule}</span>
                  <span className="font-mono text-slate-400 text-[10px]">{scan.scannedAt || 'Just Now'}</span>
                </div>
                <div className="text-slate-600">Code: <span className="font-mono font-bold text-slate-800">{scan.barcodeValue || scan.code}</span></div>
                <div className="text-[10px] text-slate-400">Medicine: {scan.medicineName || 'N/A'}</div>
              </div>
            ))}
            {scans.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs py-10">No barcode scans processed this session.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
