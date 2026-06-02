import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle, Plus } from 'lucide-react';

export default function DragDrop({ files, setFiles }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError]               = useState('');
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
        if (!files.some((f) => f.name === file.name)) {
          valid.push({ file, name: file.name, size: file.size, preview: URL.createObjectURL(file) });
        }
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

  const removeFile = (idx) => {
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
    <div className="w-full space-y-4">

      {/* ── Drop Zone ── */}
      <div
        id="drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className={`dropzone-base flex flex-col items-center justify-center p-14 text-center ${isDragActive ? 'dropzone-active' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".jpg,.jpeg,.png"
          onChange={handleFileInput}
        />

        {/* Animated upload icon */}
        <div className="mb-5 relative">
          <div
            className="w-14 h-14 rounded-[16px] flex items-center justify-center"
            style={{
              background: isDragActive
                ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isDragActive ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.07)'}`,
              transition: 'all 0.25s ease',
              boxShadow: isDragActive ? '0 0 24px rgba(139,92,246,0.2)' : 'none'
            }}
          >
            <Upload
              className={`w-6 h-6 transition-colors duration-200 ${isDragActive ? 'animate-float' : ''}`}
              style={{ color: isDragActive ? '#a855f7' : 'var(--text-3)' }}
            />
          </div>
          {/* Corner plus badge */}
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 0 8px rgba(139,92,246,0.5)' }}
          >
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        </div>

        <h3 className="text-[15px] font-semibold mb-1" style={{ color: isDragActive ? 'var(--text-1)' : 'var(--text-2)' }}>
          {isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra o haz clic para subir'}
        </h3>
        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          Soporta <span style={{ color: '#818cf8' }}>JPG</span> y <span style={{ color: '#818cf8' }}>PNG</span>
          {' '}· Múltiples archivos
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

      {/* ── File List ── */}
      {files.length > 0 && (
        <div className="space-y-3 animate-fadeInUp">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>
                {files.length} archivo{files.length !== 1 ? 's' : ''} listos
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold badge-blue">
                {files.length}
              </span>
            </div>
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

          <div className="flex flex-wrap gap-2">
            {files.map((item, index) => (
              <div
                key={index}
                className="group relative flex items-center gap-2.5 px-3 py-2 rounded-[12px] transition-all duration-150 animate-fadeInUp"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  animationDelay: `${index * 0.04}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)';
                  e.currentTarget.style.background = 'rgba(99,102,241,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-[8px] overflow-hidden flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <img
                    src={item.preview}
                    alt=""
                    className="w-full h-full object-cover transition-opacity duration-150"
                    style={{ opacity: 0.8 }}
                    onMouseEnter={(e) => (e.target.style.opacity = '1')}
                    onMouseLeave={(e) => (e.target.style.opacity = '0.8')}
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col max-w-[100px]">
                  <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-1)' }}>
                    {item.name}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>
                    {formatBytes(item.size)}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150"
                  style={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(239,68,68,0.30)',
                    color: '#f87171',
                    boxShadow: '0 0 8px rgba(239,68,68,0.2)'
                  }}
                >
                  <X className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
