import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DragDrop from './components/DragDrop';
import ResultsGrid from './components/ResultsGrid';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Wifi,
  Server,
  Activity,
  Settings
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({
    status: 'idle',
    error: null,
    start_time: 0,
    duration: 0,
    total_tasks: 0,
    completed_tasks: 0
  });
  const [originals, setOriginals] = useState([]);
  const [processed, setProcessed] = useState([]);
  const [serverOnline, setServerOnline] = useState(null);
  const [logMessages, setLogMessages] = useState([]);

  useEffect(() => {
    const pingServer = async () => {
      try {
        await axios.get(`${API_BASE}/results`);
        setServerOnline(true);
      } catch (err) {
        setServerOnline(false);
      }
    };
    pingServer();
  }, []);

  const addLog = (message) => {
    setLogMessages((prev) => [...prev, message].slice(-5));
  };

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API_BASE}/results`);
      setOriginals(response.data.originals || []);
      setProcessed(response.data.processed || []);
    } catch (err) {
      addLog("Error al sincronizar resultados.");
    }
  };

  const pollStatus = (intervalId) => {
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/status`);
        const data = res.data;
        setProcessingStatus(data);

        if (data.status === 'processing') {
          addLog(`Procesando lote: ${data.completed_tasks}/${data.total_tasks}...`);
        }

        if (data.status === 'completed') {
          clearInterval(timer);
          setIsProcessing(false);
          addLog("Procesamiento finalizado.");
          await fetchResults();
        } else if (data.status === 'failed') {
          clearInterval(timer);
          setIsProcessing(false);
          addLog(`Fallo: ${data.error}`);
        }
      } catch (err) {
        clearInterval(timer);
        setIsProcessing(false);
        addLog("Conexión perdida.");
      }
    }, 1000);
  };

  const handleUploadAndProcess = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setIsProcessing(true);
    setLogMessages([]);
    addLog("Iniciando carga...");
    
    const formData = new FormData();
    files.forEach(f => formData.append('files', f.file));

    try {
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsUploading(false);
      addLog("Despachando a MPI...");

      await axios.post(`${API_BASE}/process`);
      
      pollStatus();

    } catch (err) {
      setIsUploading(false);
      setIsProcessing(false);
      addLog(`Error: ${err.message}`);
    }
  };

  const progressPercent = Math.min(Math.round(((processingStatus.completed_tasks || 0) / (processingStatus.total_tasks || 1)) * 100), 100);

  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden font-sans text-slate-300">
      
      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="w-[300px] flex-shrink-0 border-r border-[#1f1f23] bg-[#09090b] flex flex-col p-4 gap-6 overflow-y-auto">
        
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mt-2">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-slate-100 leading-tight">MPI Processor</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Cluster Engine v1.0</p>
          </div>
        </div>

        {/* Backend Status Card */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#0c0c0e] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span>BACKEND</span>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
            {serverOnline === null ? '...' : serverOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Cluster Nodes Card */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#c69255] uppercase px-2">
            <Settings className="w-4 h-4 text-[#c69255]" />
            <span>NODOS DEL CLÚSTER</span>
          </div>
          <div className="rounded-xl border border-zinc-800/80 bg-[#0c0c0e] flex flex-col p-2">
            {['mpi-master', 'worker1', 'worker2'].map((node, i) => (
              <div key={node} className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                  <span className="text-xs font-medium text-zinc-400">{node}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/40 text-blue-400 border border-blue-900/40">
                  {isProcessing ? 'RUN' : 'IDLE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Card */}
        <div className="mt-auto">
          <div className="rounded-xl border border-zinc-800/80 bg-[#0c0c0e] flex flex-col p-4 min-h-[140px]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#c69255] uppercase mb-4">
              <Activity className="w-4 h-4 text-[#c69255]" />
              <span>ACTIVIDAD</span>
            </div>
            <div className="flex-1 font-mono text-[10px] text-zinc-500 space-y-1">
              {logMessages.length === 0 ? (
                <p className="italic">esperando tareas...</p>
              ) : (
                logMessages.map((msg, i) => <div key={i}>{msg}</div>)
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1 overflow-y-auto bg-[#09090b]">
        <div className="max-w-4xl mx-auto w-full p-12 space-y-12">
          
          <header className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Procesamiento de Imágenes</h2>
            <p className="text-sm text-zinc-400">Sube tus archivos y deja que el clúster MPI distribuya el análisis de OpenCV de forma paralela.</p>
          </header>

          {/* Upload Zone */}
          <div className="space-y-6">
            <DragDrop files={files} setFiles={setFiles} />
            
            {files.length > 0 && (
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleUploadAndProcess}
                  disabled={isProcessing || !serverOnline}
                  className={`w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    !serverOnline || isProcessing
                      ? 'bg-[#18181b] text-slate-500 cursor-not-allowed border border-[#27272a]'
                      : 'bg-white hover:bg-slate-200 text-black active:scale-[0.99]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Procesar Imágenes
                    </>
                  )}
                </button>

                {isProcessing && (
                  <div className="w-full h-1 rounded-full bg-[#18181b] overflow-hidden">
                    <div className="h-full bg-white transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Gallery */}
          {originals.length > 0 && (
            <div className="pt-8">
              <ResultsGrid originals={originals} processed={processed} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
