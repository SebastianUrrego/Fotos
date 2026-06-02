import React, { useState } from 'react';
import { Download, Sliders, LayoutGrid, Eye, Maximize2, Sparkles, X } from 'lucide-react';

export default function ResultsGrid({ originals, processed }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeOps,    setActiveOps]    = useState({});
  const [compareModes, setCompareModes] = useState({});
  const [sliderPos,    setSliderPos]    = useState({});

  const groupedData = originals.map((name) => {
    const items = processed.filter((p) => p.originalName === name);
    const operations = {};
    items.forEach((item) => { operations[item.operation] = item; });
    return { name, originalUrl: `http://localhost:5000/api/download/${name}`, operations };
  });

  const getOp      = (n) => activeOps[n]    || 'edges';
  const getMode    = (n) => compareModes[n]  || 'slider';
  const getSlider  = (n) => sliderPos[n]     !== undefined ? sliderPos[n] : 50;

  const opLabel = { edges: 'Bordes', blur: 'Desenfoque', grayscale: 'Grises' };
  const opColor = {
    edges:     { bg: 'rgba(99,102,241,0.12)',  txt: '#818cf8', border: 'rgba(99,102,241,0.25)' },
    blur:      { bg: 'rgba(6,182,212,0.10)',   txt: '#22d3ee', border: 'rgba(6,182,212,0.20)' },
    grayscale: { bg: 'rgba(148,163,184,0.10)', txt: '#94a3b8', border: 'rgba(148,163,184,0.20)' },
  };

  const formatBytes = (b) => {
    if (!b) return '0 B';
    const k = 1024, s = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Section header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: '#818cf8' }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#818cf8' }}>
              Resultados
            </span>
          </div>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-0.025em' }}>
            Galería de resultados
          </h3>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-2)' }}>
            {originals.length} imagen{originals.length !== 1 ? 'es' : ''} procesadas por el clúster
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {groupedData.map((group, gi) => {
          const activeOp  = getOp(group.name);
          const mode      = getMode(group.name);
          const slider    = getSlider(group.name);
          const activeItem  = group.operations[activeOp];
          const processedUrl = activeItem ? activeItem.url : group.originalUrl;

          return (
            <div
              key={group.name}
              className="glass-card flex flex-col overflow-hidden animate-fadeInUp"
              style={{ animationDelay: `${gi * 0.08}s` }}
            >
              {/* Card Header */}
              <div
                className="px-4 py-3.5 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="min-w-0 flex-1">
                  <h4
                    className="text-[13px] font-semibold truncate"
                    style={{ color: 'var(--text-1)', letterSpacing: '-0.01em' }}
                    title={group.name}
                  >
                    {group.name}
                  </h4>
                  <p className="text-[10px] mt-0.5" style={{ color: activeItem ? '#4ade80' : 'var(--text-3)' }}>
                    {activeItem ? '✓ Procesado' : '• Pendiente'}
                  </p>
                </div>

                {/* View mode toggles */}
                <div
                  className="flex items-center gap-0.5 p-1 rounded-[10px]"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}
                >
                  {[
                    { mode: 'single',      Icon: Eye,        title: 'Vista simple' },
                    { mode: 'side-by-side', Icon: LayoutGrid, title: 'Lado a lado' },
                    { mode: 'slider',      Icon: Sliders,    title: 'Comparar con slider' },
                  ].map(({ mode: m, Icon, title }) => (
                    <button
                      key={m}
                      onClick={() => setCompareModes((p) => ({ ...p, [group.name]: m }))}
                      title={title}
                      className="p-1.5 rounded-[8px] transition-all duration-150"
                      style={
                        mode === m
                          ? { background: 'rgba(139,92,246,0.20)', color: '#c084fc' }
                          : { color: 'var(--text-3)' }
                      }
                      onMouseEnter={(e) => { if (mode !== m) e.currentTarget.style.color = 'var(--text-2)'; }}
                      onMouseLeave={(e) => { if (mode !== m) e.currentTarget.style.color = 'var(--text-3)'; }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Area */}
              <div className="relative w-full aspect-video group" style={{ background: '#050508' }}>

                {mode === 'single' && (
                  <img src={processedUrl} alt="Filtered" className="w-full h-full object-cover" />
                )}

                {mode === 'side-by-side' && (
                  <div className="grid grid-cols-2 w-full h-full" style={{ borderRight: '1px solid var(--border)' }}>
                    <div className="relative h-full">
                      <img src={group.originalUrl} alt="Original" className="w-full h-full object-cover" style={{ opacity: 0.9 }} />
                      <span
                        className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-semibold backdrop-blur-sm"
                        style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.8)' }}
                      >
                        Original
                      </span>
                    </div>
                    <div className="relative h-full" style={{ borderLeft: '1px solid rgba(139,92,246,0.3)' }}>
                      <img src={processedUrl} alt={activeOp} className="w-full h-full object-cover" />
                      <span
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-semibold backdrop-blur-sm"
                        style={{ background: 'rgba(139,92,246,0.45)', color: '#e9d5ff' }}
                      >
                        {opLabel[activeOp] || activeOp}
                      </span>
                    </div>
                  </div>
                )}

                {mode === 'slider' && (
                  <div className="relative w-full h-full overflow-hidden select-none">
                    {/* Background: original */}
                    <img src={group.originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.9 }} />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-semibold backdrop-blur-sm z-10"
                      style={{ background: 'rgba(0,0,0,0.60)', color: 'rgba(255,255,255,0.75)' }}>
                      Original
                    </span>

                    {/* Foreground: processed clipped */}
                    <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${slider}%`, borderRight: '2px solid #a855f7' }}>
                      <img src={processedUrl} alt={activeOp}
                        className="absolute inset-y-0 left-0 h-full object-cover"
                        style={{ width: '100%', minWidth: '100%', maxWidth: 'none' }}
                      />
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-semibold backdrop-blur-sm z-10"
                      style={{ background: 'rgba(139,92,246,0.45)', color: '#e9d5ff' }}>
                      {opLabel[activeOp] || activeOp}
                    </span>

                    {/* Slider handle */}
                    <div className="absolute inset-y-0 pointer-events-none z-20"
                      style={{ left: `calc(${slider}% - 1px)` }}>
                      <div className="absolute inset-y-0 w-0.5" style={{ background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.7)' }} />
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                          boxShadow: '0 0 16px rgba(168,85,247,0.6), 0 2px 8px rgba(0,0,0,0.5)',
                          border: '2px solid rgba(255,255,255,0.15)',
                          fontSize: '10px', color: '#fff', fontWeight: 700
                        }}>
                        ↔
                      </div>
                    </div>

                    <input
                      type="range" min="0" max="100" value={slider}
                      onChange={(e) => setSliderPos((p) => ({ ...p, [group.name]: +e.target.value }))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                  </div>
                )}

                {/* Fullscreen button */}
                <button
                  onClick={() => setSelectedImage({ name: group.name, originalUrl: group.originalUrl, processedUrl, opTitle: opLabel[activeOp] || activeOp, img: group.name })}
                  className="absolute top-2.5 right-2.5 p-2 rounded-[10px] opacity-0 group-hover:opacity-100 transition-all duration-200 z-30"
                  style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Footer Controls */}
              <div
                className="px-4 py-3 flex items-center justify-between gap-3"
                style={{ borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)' }}
              >
                {/* Operation Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-[10px]" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>
                  {['edges', 'blur', 'grayscale'].map((op) => {
                    const exists = !!group.operations[op];
                    const col    = opColor[op];
                    return (
                      <button
                        key={op}
                        disabled={!exists}
                        onClick={() => setActiveOps((p) => ({ ...p, [group.name]: op }))}
                        className="op-tab"
                        style={
                          activeOp === op && exists
                            ? { background: col.bg, color: col.txt, borderColor: col.border, boxShadow: `0 0 10px ${col.bg}` }
                            : {}
                        }
                      >
                        {opLabel[op]}
                      </button>
                    );
                  })}
                </div>

                {/* Download */}
                {activeItem && (
                  <a
                    href={activeItem.url}
                    download={activeItem.filename}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all duration-150"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139,92,246,0.12)';
                      e.currentTarget.style.color = '#c084fc';
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'var(--text-2)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                    <span className="opacity-50 text-[9px] ml-1">{formatBytes(activeItem.sizeBytes)}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ FULLSCREEN MODAL ═══ */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-10"
          style={{ background: 'rgba(3,3,10,0.92)', backdropFilter: 'blur(20px)' }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-5xl w-full flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                  {selectedImage.name}
                </h3>
                <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>{selectedImage.opTitle}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[12px] font-semibold transition-colors"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              >
                <X className="w-3.5 h-3.5" /> Cerrar
              </button>
            </div>

            {/* Modal image with slider */}
            <div
              className="relative w-full aspect-video rounded-[16px] overflow-hidden select-none"
              style={{ background: '#050508', border: '1px solid var(--border)' }}
            >
              <img src={selectedImage.originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain" style={{ opacity: 0.9 }} />
              <div className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${getSlider(selectedImage.img)}%`, borderRight: '2px solid #a855f7' }}>
                <img src={selectedImage.processedUrl} alt="Processed"
                  className="absolute inset-y-0 left-0 h-full object-contain"
                  style={{ width: '100%', minWidth: '100%', maxWidth: 'none' }}
                />
              </div>
              <div className="absolute inset-y-0 pointer-events-none z-20"
                style={{ left: `calc(${getSlider(selectedImage.img)}% - 1px)` }}>
                <div className="absolute inset-y-0 w-0.5" style={{ background: '#a855f7', boxShadow: '0 0 10px rgba(168,85,247,0.7)' }} />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    boxShadow: '0 0 20px rgba(168,85,247,0.7)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    fontSize: '12px', color: '#fff', fontWeight: 700
                  }}>
                  ↔
                </div>
              </div>
              <input
                type="range" min="0" max="100"
                value={getSlider(selectedImage.img)}
                onChange={(e) => setSliderPos((p) => ({ ...p, [selectedImage.img]: +e.target.value }))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
