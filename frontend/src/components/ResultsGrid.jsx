import React, { useState } from 'react';
import { Download, Sliders, LayoutGrid, Eye, Maximize2 } from 'lucide-react';

export default function ResultsGrid({ originals, processed }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeOps, setActiveOps] = useState({});
  const [compareModes, setCompareModes] = useState({});
  const [sliderPositions, setSliderPositions] = useState({});

  const groupedData = originals.map(name => {
    const items = processed.filter(p => p.originalName === name);
    const operations = {};
    items.forEach(item => { operations[item.operation] = item; });
    return { name, originalUrl: `http://localhost:5000/api/download/${name}`, operations };
  });

  const getActiveOp = (imgName) => activeOps[imgName] || 'edges';
  const getCompareMode = (imgName) => compareModes[imgName] || 'slider';
  const getSliderPos = (imgName) => sliderPositions[imgName] !== undefined ? sliderPositions[imgName] : 50;

  const translateOp = (op) => {
    switch (op) {
      case 'grayscale': return 'Escala de Grises';
      case 'blur': return 'Desenfoque Gaussiano';
      case 'edges': return 'Detección de Bordes';
      default: return op;
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-200">Resultados del Clúster</h3>
          <p className="text-xs text-slate-500 mt-1">Imágenes procesadas y listas para descargar.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {groupedData.map((group) => {
          const activeOp = getActiveOp(group.name);
          const compareMode = getCompareMode(group.name);
          const sliderPos = getSliderPos(group.name);
          const activeItem = group.operations[activeOp];
          const processedUrl = activeItem ? activeItem.url : group.originalUrl;

          return (
            <div key={group.name} className="surface-clean rounded-2xl flex flex-col overflow-hidden transition-all duration-200 hover:border-[#3b4252]">
              
              {/* Header inside Card */}
              <div className="px-5 py-4 border-b border-[#232730] flex items-center justify-between bg-[#13161c]">
                <div className="truncate max-w-[50%]">
                  <h4 className="text-sm font-semibold text-slate-200 truncate">{group.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{activeItem ? 'Procesado' : 'Pendiente'}</p>
                </div>

                {/* View Modes (Icon only, subtle) */}
                <div className="flex items-center bg-[#0c0e12] p-1 rounded-lg border border-[#232730]">
                  <button onClick={() => setCompareModes(prev => ({ ...prev, [group.name]: 'single' }))} className={`p-1.5 rounded-md transition-colors ${compareMode === 'single' ? 'bg-[#232730] text-slate-200' : 'text-slate-500 hover:text-slate-300'}`} title="Vista Simple">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setCompareModes(prev => ({ ...prev, [group.name]: 'side-by-side' }))} className={`p-1.5 rounded-md transition-colors ${compareMode === 'side-by-side' ? 'bg-[#232730] text-slate-200' : 'text-slate-500 hover:text-slate-300'}`} title="Lado a Lado">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setCompareModes(prev => ({ ...prev, [group.name]: 'slider' }))} className={`p-1.5 rounded-md transition-colors ${compareMode === 'slider' ? 'bg-[#232730] text-slate-200' : 'text-slate-500 hover:text-slate-300'}`} title="Deslizador">
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Image Area */}
              <div className="relative w-full aspect-video bg-[#0c0e12] group">
                {compareMode === 'single' && (
                  <img src={processedUrl} alt="Filtered" className="w-full h-full object-cover" />
                )}

                {compareMode === 'side-by-side' && (
                  <div className="grid grid-cols-2 w-full h-full divide-x divide-[#232730]">
                    <div className="relative h-full w-full">
                      <img src={group.originalUrl} alt="Original" className="w-full h-full object-cover opacity-90" />
                      <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white backdrop-blur-sm">Original</span>
                    </div>
                    <div className="relative h-full w-full">
                      <img src={processedUrl} alt={activeOp} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white backdrop-blur-sm">{translateOp(activeOp)}</span>
                    </div>
                  </div>
                )}

                {compareMode === 'slider' && (
                  <div className="relative w-full h-full overflow-hidden select-none">
                    <img src={group.originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                    <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white backdrop-blur-sm z-10">Original</span>

                    <div className="absolute inset-y-0 left-0 overflow-hidden border-r border-indigo-500" style={{ width: `${sliderPos}%` }}>
                      <img src={processedUrl} alt={activeOp} className="absolute inset-y-0 left-0 h-full object-cover" style={{ width: '100%', minWidth: '100%', maxWidth: 'none', height: '100%' }} />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-white backdrop-blur-sm z-10">{translateOp(activeOp)}</span>

                    <div className="absolute inset-y-0 w-1 bg-indigo-500 flex items-center justify-center pointer-events-none" style={{ left: `${sliderPos}%` }}>
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center -ml-3 shadow-lg text-[10px] font-bold">↔</div>
                    </div>
                    <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPositions(prev => ({ ...prev, [group.name]: parseInt(e.target.value) }))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
                  </div>
                )}

                {/* Fullscreen btn */}
                <button
                  onClick={() => setSelectedImage({ name: group.name, originalUrl: group.originalUrl, processedUrl, opTitle: translateOp(activeOp) })}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 backdrop-blur-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Footer Controls */}
              <div className="px-5 py-4 bg-[#13161c] border-t border-[#232730] flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Segmented Control (Tabs) */}
                <div className="flex bg-[#0c0e12] p-1 rounded-lg border border-[#232730] w-full sm:w-auto">
                  {['edges', 'blur', 'grayscale'].map((op) => {
                    const itemExists = !!group.operations[op];
                    return (
                      <button
                        key={op}
                        disabled={!itemExists}
                        onClick={() => setActiveOps(prev => ({ ...prev, [group.name]: op }))}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          !itemExists 
                            ? 'text-slate-600 opacity-50 cursor-not-allowed'
                            : activeOp === op 
                            ? 'bg-[#232730] text-slate-200 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1d24]'
                        }`}
                      >
                        {op === 'edges' && 'Bordes'}
                        {op === 'blur' && 'Blur'}
                        {op === 'grayscale' && 'Grises'}
                      </button>
                    );
                  })}
                </div>

                {/* Download */}
                {activeItem && (
                  <a
                    href={activeItem.url}
                    download={activeItem.filename}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-[#232730] transition-colors"
                  >
                    <span className="text-slate-500 pr-2 border-r border-[#232730]">{formatBytes(activeItem.sizeBytes)}</span>
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal is mostly the same but using dark mode colors */}
      {selectedImage && (
        <div className="fixed inset-0 bg-[#0c0e12]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="max-w-6xl w-full flex flex-col space-y-4">
            <div className="flex items-center justify-between text-slate-200">
              <div>
                <h3 className="font-semibold text-lg text-white">{selectedImage.name}</h3>
                <p className="text-xs text-slate-400">{selectedImage.opTitle}</p>
              </div>
              <button onClick={() => setSelectedImage(null)} className="p-2 text-slate-400 hover:text-white transition-colors">✕ Cerrar</button>
            </div>

            <div className="relative w-full aspect-video bg-[#0c0e12] rounded-xl overflow-hidden border border-[#232730]">
              <img src={selectedImage.originalUrl} alt="Original Full" className="absolute inset-0 w-full h-full object-contain opacity-90" />
              <div className="absolute inset-y-0 left-0 overflow-hidden border-r border-indigo-500" style={{ width: `${sliderPositions[selectedImage.name] !== undefined ? sliderPositions[selectedImage.name] : 50}%` }}>
                <img src={selectedImage.processedUrl} alt="Processed Full" className="absolute inset-y-0 left-0 h-full object-contain" style={{ width: '100%', minWidth: '100%', maxWidth: 'none', height: '100%' }} />
              </div>
              <div className="absolute inset-y-0 w-1 bg-indigo-500 flex items-center justify-center pointer-events-none" style={{ left: `${sliderPositions[selectedImage.name] !== undefined ? sliderPositions[selectedImage.name] : 50}%` }}>
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center -ml-4 text-xs font-bold shadow-xl">↔</div>
              </div>
              <input type="range" min="0" max="100" value={sliderPositions[selectedImage.name] !== undefined ? sliderPositions[selectedImage.name] : 50} onChange={(e) => setSliderPositions(prev => ({ ...prev, [selectedImage.name]: parseInt(e.target.value) }))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
