import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DragDrop from './components/DragDrop';
import ResultsGrid from './components/ResultsGrid';
import {
  Play,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  Activity,
  Cpu,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [files, setFiles]                     = useState([]);
  const [isUploading, setIsUploading]         = useState(false);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [processingStatus, setProcessingStatus] = useState({
    status: 'idle', error: null, start_time: 0,
    duration: 0, total_tasks: 0, completed_tasks: 0
  });
  const [originals, setOriginals]   = useState([]);
  const [processed, setProcessed]   = useState([]);
  const [serverOnline, setServerOnline] = useState(null);
  const [logMessages, setLogMessages]   = useState([]);
  const [processingDone, setProcessingDone] = useState(false);

  /* ── ping backend ── */
  useEffect(() => {
    const pingServer = async () => {
      try {
        await axios.get(`${API_BASE}/results`);
        setServerOnline(true);
      } catch {
        setServerOnline(false);
      }
    };
    pingServer();
    const id = setInterval(pingServer, 8000);
    return () => clearInterval(id);
  }, []);

  const addLog = (msg) =>
    setLogMessages((prev) => [...prev, { msg, ts: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }].slice(-8));

  const fetchResults = async () => {
    try {
      const res = await axios.get(`${API_BASE}/results`);
      setOriginals(res.data.originals || []);
      setProcessed(res.data.processed || []);
    } catch { addLog('Error al sincronizar resultados.'); }
  };

  const pollStatus = () => {
    const timer = setInterval(async () => {
      try {
        const res  = await axios.get(`${API_BASE}/status`);
        const data = res.data;
        setProcessingStatus(data);

        if (data.status === 'processing')
          addLog(`Procesando lote: ${data.completed_tasks}/${data.total_tasks}`);

        if (data.status === 'completed') {
          clearInterval(timer);
          setIsProcessing(false);
          setProcessingDone(true);
          addLog('✓ Procesamiento finalizado');
          await fetchResults();
        } else if (data.status === 'failed') {
          clearInterval(timer);
          setIsProcessing(false);
          addLog(`✗ Error: ${data.error}`);
        }
      } catch {
        clearInterval(timer);
        setIsProcessing(false);
        addLog('Conexión perdida.');
      }
    }, 1000);
  };

  const handleUploadAndProcess = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setIsProcessing(true);
    setProcessingDone(false);
    setLogMessages([]);
    addLog('Iniciando carga...');

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f.file));

    try {
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsUploading(false);
      addLog('Despachando a los nodos MPI...');
      await axios.post(`${API_BASE}/process`);
      pollStatus();
    } catch (err) {
      setIsUploading(false);
      setIsProcessing(false);
      addLog(`Error: ${err.message}`);
    }
  };

  const progressPercent = Math.min(
    Math.round(((processingStatus.completed_tasks || 0) / (processingStatus.total_tasks || 1)) * 100),
    100
  );

  const nodes = ['mpi-master', 'worker1', 'worker2'];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="glass-sidebar w-[280px] flex-shrink-0 flex flex-col p-5 gap-5 overflow-y-auto">

        {/* Brand */}
        <div className="flex items-center gap-3 px-1 mt-1 mb-1">
          <div className="relative w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <Cpu className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-[12px] animate-pulse"
              style={{ boxShadow: '0 0 18px rgba(99,102,241,0.5)', opacity: 0.7 }} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              MPI Processor
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
              Cluster Engine v1.0
            </p>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* Backend Status */}
        <div className="glass-card p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {serverOnline === null ? (
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            ) : serverOnline ? (
              <div className="dot-online" />
            ) : (
              <div className="dot-offline" />
            )}
            <div className="flex items-center gap-1.5">
              {serverOnline ? (
                <Wifi className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
              ) : (
                <WifiOff className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
              )}
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
                Backend
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
            serverOnline === null ? 'badge-amber' :
            serverOnline         ? 'badge-green' : 'badge-red'
          }`}>
            {serverOnline === null ? 'Checking' : serverOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Cluster Nodes */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1 mb-1">
            <Server className="w-3.5 h-3.5" style={{ color: '#c084fc' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#c084fc' }}>
              Nodos del Clúster
            </span>
          </div>
          <div className="glass-card p-2 flex flex-col gap-0.5">
            {nodes.map((node, i) => (
              <div key={node}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150"
                style={{ background: isProcessing ? 'rgba(168,85,247,0.04)' : 'transparent' }}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isProcessing ? 'dot-run' : 'dot-idle'}`} />
                  <span className="text-[12px] font-mono font-medium" style={{ color: 'var(--text-2)' }}>{node}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isProcessing ? 'badge-purple' : 'badge-blue'}`}>
                  {isProcessing ? 'RUN' : 'IDLE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats pill row */}
        {(processingStatus.total_tasks > 0) && (
          <div className="flex gap-2 flex-wrap">
            <div className="glass-card flex-1 p-3 flex flex-col items-center gap-0.5" style={{ minWidth: '60px' }}>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Total</span>
              <span className="text-lg font-bold" style={{ color: '#818cf8' }}>{processingStatus.total_tasks}</span>
            </div>
            <div className="glass-card flex-1 p-3 flex flex-col items-center gap-0.5" style={{ minWidth: '60px' }}>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Listos</span>
              <span className="text-lg font-bold" style={{ color: '#4ade80' }}>{processingStatus.completed_tasks}</span>
            </div>
            {processingStatus.duration > 0 && (
              <div className="glass-card flex-1 p-3 flex flex-col items-center gap-0.5" style={{ minWidth: '60px' }}>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Tiempo</span>
                <span className="text-lg font-bold" style={{ color: '#c084fc' }}>{processingStatus.duration.toFixed(1)}s</span>
              </div>
            )}
          </div>
        )}

        {/* Activity Log */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 px-1 mb-2">
            <Activity className="w-3.5 h-3.5" style={{ color: '#c084fc' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#c084fc' }}>
              Actividad
            </span>
          </div>
          <div className="glass-card p-3.5 flex flex-col gap-1.5 min-h-[120px]" style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {logMessages.length === 0 ? (
              <p className="text-[11px] italic" style={{ color: 'var(--text-3)' }}>Esperando tareas...</p>
            ) : (
              logMessages.map((entry, i) => (
                <div key={i} className="log-line">
                  <span style={{ color: 'var(--text-3)', fontSize: '9px', flexShrink: 0, marginTop: '1px' }}>{entry.ts}</span>
                  <span>{entry.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-8 py-10 space-y-10">

          {/* Header */}
          <header className="space-y-3 animate-fadeInUp">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: '#818cf8' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#818cf8' }}>
                Procesamiento Distribuido
              </span>
            </div>
            <h2 className="text-4xl font-extrabold leading-tight" style={{ letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
              Análisis de{' '}
              <span className="text-gradient">Imágenes</span>
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-2)', maxWidth: '480px' }}>
              Sube tus archivos y deja que el clúster MPI distribuya el análisis
              de OpenCV de forma <strong style={{ color: 'var(--text-1)' }}>paralela y eficiente</strong>.
            </p>
          </header>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border)' }} />

          {/* Upload Zone */}
          <div className="space-y-5 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <DragDrop files={files} setFiles={setFiles} />

            {files.length > 0 && (
              <div className="flex flex-col space-y-3">
                <button
                  id="process-btn"
                  onClick={handleUploadAndProcess}
                  disabled={isProcessing || !serverOnline}
                  className="btn-glow w-full py-3.5 rounded-[14px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2.5"
                  style={
                    !serverOnline || isProcessing
                      ? { background: 'rgba(255,255,255,0.04)', color: 'var(--text-3)', cursor: 'not-allowed', border: '1px solid var(--border)' }
                      : {
                          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                          color: '#fff',
                          border: 'none',
                          boxShadow: '0 0 24px rgba(139,92,246,0.35), 0 4px 16px rgba(99,102,241,0.25)',
                          transform: 'translateY(0)',
                          cursor: 'pointer'
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isProcessing && serverOnline) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.5), 0 8px 24px rgba(99,102,241,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessing && serverOnline) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.35), 0 4px 16px rgba(99,102,241,0.25)';
                    }
                  }}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Procesando en clúster...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Procesar con MPI
                    </>
                  )}
                </button>

                {/* Progress bar */}
                {isProcessing && (
                  <div className="space-y-1.5">
                    <div className="progress-neon">
                      <div className="progress-neon-bar" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                        {processingStatus.completed_tasks} / {processingStatus.total_tasks} tareas
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: '#a855f7' }}>{progressPercent}%</span>
                    </div>
                  </div>
                )}

                {/* Done banner */}
                {processingDone && !isProcessing && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] animate-fadeInUp"
                    style={{
                      background: 'rgba(34,197,94,0.06)',
                      border: '1px solid rgba(34,197,94,0.20)'
                    }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                    <p className="text-[12px]" style={{ color: '#4ade80' }}>
                      ¡Procesamiento completado! Resultados listos abajo.
                    </p>
                    {processingStatus.duration > 0 && (
                      <div className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        <Clock className="w-3 h-3" />
                        {processingStatus.duration.toFixed(2)}s
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          {originals.length > 0 && (
            <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div style={{ height: '1px', background: 'var(--border)', marginBottom: '32px' }} />
              <ResultsGrid originals={originals} processed={processed} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
