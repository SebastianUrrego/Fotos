import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

export default function DragDrop({ files, setFiles }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndAddFiles = (fileList) => {
    setError('');
    const validFiles = [];
    const invalidNames = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png'].includes(ext)) {
        if (!files.some(f => f.name === file.name)) {
          validFiles.push({
            file,
            name: file.name,
            size: file.size,
            preview: URL.createObjectURL(file)
          });
        }
      } else {
        invalidNames.push(file.name);
      }
    }

    if (invalidNames.length > 0) {
      setError(`Formato no válido (solo JPG/PNG): ${invalidNames.slice(0, 3).join(', ')}`);
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[indexToRemove].preview);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className={`relative w-full rounded-2xl border border-dashed flex flex-col items-center justify-center p-16 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-[#27272a] bg-transparent hover:bg-zinc-900/30 hover:border-zinc-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".jpg,.jpeg,.png"
          onChange={handleFileInput}
        />

        <Upload className={`w-10 h-10 mb-4 transition-colors ${
          isDragActive ? 'text-blue-400' : 'text-zinc-500'
        }`} />

        <h3 className="text-lg font-semibold text-zinc-200">
          Haz clic o arrastra tus imágenes aquí
        </h3>
        <p className="text-xs text-zinc-500 mt-1">Soporta JPG y PNG</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-medium flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5"/> Archivos listos ({files.length})</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setFiles([]); files.forEach(f => URL.revokeObjectURL(f.preview)); }}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Borrar todos
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {files.map((item, index) => (
              <div
                key={index}
                className="group relative flex items-center gap-3 p-2 pr-4 rounded-xl surface-clean hover:border-slate-600 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1a1d24] flex-shrink-0">
                  <img src={item.preview} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col max-w-[120px]">
                  <span className="text-xs font-medium text-slate-200 truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-500">{formatBytes(item.size)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-[#232730] border border-[#3b4252] text-slate-400 hover:text-rose-400 hover:border-rose-500/50 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
