import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Plus, Image as ImageIcon, Grid3X3 } from 'lucide-react';

export default function DragDrop({ files, setFiles }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError]               = useState('');
  const [lightbox, setLightbox]         = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const validateAndAddFiles = (fileList) => {
    setError('');
    const valid = [], invalid = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext  = file.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png'].includes(ext)) {
        if (!files.some((f) => f.name === file.name))
          valid.push({ file, name: file.name, size: file.size, preview: URL.createObjectURL(file) });
      } else {
        invalid.push(file.name);
      }
    }
    if (invalid.length > 0)
      setError(`Formato no soportado (solo JPG/PNG): ${invalid.slice(0, 3).join(', ')}`);
    if (valid.length > 0)
      setFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndAddFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) validateAndAddFiles(e.target.files);
  };

  const removeFile = (e, idx) => {
    e.stopPropagation();
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearAll = (e) => {
    e.stopPropagation();
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  };

  return (
    <div className="w-full space-y-5">

      {/* ── Drop Zone ── */}
      <div
        id="drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className={`dropzone-base flex flex-col items-center justify-center p-12 text-center ${isDragActive ? 'dropzone-active' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".jpg,.jpeg,.png"
          onChange={handleFileInput}
        />

        {/* Upload icon */}
        <div className="mb-5 relative">
          <div
            className="w-16 h-16 rounded-[18px] flex items-center justify-center"
            style={{
              background: isDragActive
                ? 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(20,202,186,0.25))'
                : 'rgba(0,212,255,0.04)',
              border: `1px solid ${isDragActive ? 'rgba(0,212,255,0.50)' : 'rgba(0,212,255,0.10)'}`,
              transition: 'all 0.25s ease',
              boxShadow: isDragActive ? '0 0 32px rgba(0,212,255,0.20)' : 'none'
            }}
          >
            <Upload
              className={`w-7 h-7 transition-colors duration-200 ${isDragActive ? 'animate-float' : ''}`}
              style={{ color: isDragActive ? '#00d4ff' : 'var(--text-3)' }}
            />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #14caba)', boxShadow: '0 0 10px rgba(0,212,255,0.5)' }}
          >
            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        </div>

        <h3 className="text-[16px] font-semibold mb-1.5" style={{ color: isDragActive ? 'var(--text-1)' : 'var(--text-2)' }}>
          {isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra o haz clic para subir'}
        </h3>
        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          Soporta <span style={{ color: '#00d4ff' }}>JPG</span> y <span style={{ color: '#00d4ff' }}>PNG</span>
          {' '}· Múltiples archivos permitidos
        </p>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-[12px] animate-fadeInUp"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#f87171' }} />
          <p className="text-[11px]" style={{ color: '#f87171' }}>{error}</p>
        </div>
      )}

      {/* ── Image Gallery ── */}
      {files.length > 0 && (
        <div className="space-y-4 animate-fadeInUp">

          {/* Gallery header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <Grid3X3 className="w-3.5 h-3.5" style={{ color: '#00d4ff' }} />
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>
                {files.length} imagen{files.length !== 1 ? 'es' : ''} seleccionada{files.length !== 1 ? 's' : ''}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-bold badge-cyan"
              >
                {files.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Add more */}
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                className="text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] transition-all"
                style={{
                  color: '#00d4ff',
                  background: 'rgba(0,212,255,0.06)',
                  border: '1px solid rgba(0,212,255,0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)';
                }}
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                Agregar más
              </button>
              <button
                onClick={clearAll}
                className="text-[11px] font-medium transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={(e) => (e.target.style.color = '#f87171')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-3)')}
              >
                Limpiar todo
              </button>
            </div>
          </div>

          {/* Gallery grid */}
          <div className="gallery-grid">
            {files.map((item, index) => (
              <div
                key={index}
                className="gallery-thumb"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setLightbox(item)}
              >
                <img src={item.preview} alt={item.name} />

                {/* Overlay gradient */}
                <div className="gallery-thumb-overlay">
                  <div style={{ width: '100%' }}>
                    <p className="text-[9px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {item.name.length > 14 ? item.name.substring(0, 12) + '…' : item.name}
                    </p>
                    <p className="text-[8px]" style={{ color: 'rgba(0,212,255,0.8)' }}>
                      {formatBytes(item.size)}
                    </p>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  className="gallery-thumb-remove"
                  onClick={(e) => removeFile(e, index)}
                  title="Eliminar"
                >
                  <X className="w-2.5 h-2.5" strokeWidth={2.5} />
                </button>

                {/* Index badge */}
                <div
                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(2,4,8,0.70)',
                    border: '1px solid rgba(0,212,255,0.25)',
                    fontSize: '8px',
                    fontWeight: 700,
                    color: '#00d4ff',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Add more tile */}
            <div
              onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
              className="gallery-thumb flex flex-col items-center justify-center cursor-pointer"
              style={{
                border: '1.5px dashed rgba(0,212,255,0.15)',
                background: 'rgba(0,212,255,0.02)',
                minHeight: '80px'
              }}
            >
              <Plus className="w-5 h-5 mb-1" style={{ color: 'var(--text-3)' }} />
              <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>Agregar</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,2,6,0.92)', backdropFilter: 'blur(20px)' }}
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-2xl w-full mx-4 animate-fadeInScale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="font-semibold text-[14px]" style={{ color: 'var(--text-1)' }}>{lightbox.name}</h3>
                <p className="text-[11px]" style={{ color: '#00d4ff' }}>{formatBytes(lightbox.size)}</p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="p-2 rounded-[10px] transition-colors"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.15)', boxShadow: '0 0 60px rgba(0,212,255,0.10)' }}>
              <img src={lightbox.preview} alt={lightbox.name} className="w-full h-auto block" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
