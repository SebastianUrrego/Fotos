import React, { useState } from 'react';
import { Download, Sparkles, X, Trash2, ZoomIn, ImageOff } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const OP_META = {
  original:  { label: 'Original',         color: '#7ab8cc', bg: 'rgba(122,184,204,0.10)', border: 'rgba(122,184,204,0.22)' },
  edges:     { label: 'Bordes',           color: '#00d4ff', bg: 'rgba(0,212,255,0.10)',   border: 'rgba(0,212,255,0.28)' },
  blur:      { label: 'Desenfoque',       color: '#5eead4', bg: 'rgba(20,202,186,0.10)',  border: 'rgba(20,202,186,0.25)' },
  grayscale: { label: 'Escala de grises', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.20)' },
  sepia:     { label: 'Filtro Sepia',     color: '#fcd34d', bg: 'rgba(252,211,77,0.10)',  border: 'rgba(252,211,77,0.25)' },
  invert:    { label: 'Negativo',         color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
};

const formatBytes = (b) => {
  if (!b) return '—';
  const k = 1024, s = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
};

/* ── Single Image Card ── */
function ImageCard({ label, url, filename, sizeBytes, opKey, onExpand, delay }) {
  const meta = OP_META[opKey] || OP_META.original;
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || `${label}-${opKey}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error al descargar:', err);
      // Fallback
      window.open(url, '_blank');
    }
  };

  return (
    <div
      className="glass-card flex flex-col overflow-hidden animate-fadeInScale"
      style={{ animationDelay: delay }}
    >
      {/* Image */}
      <div
        className="relative w-full overflow-hidden group"
        style={{ aspectRatio: '4/3', background: '#030608', cursor: 'pointer' }}
        onClick={() => onExpand({ url, label: meta.label, opKey })}
      >
        {!errored ? (
          <img
            src={url}
            alt={meta.label}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease, transform 0.3s ease' }}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ color: 'var(--text-3)' }}>
            <ImageOff className="w-8 h-8" />
            <span className="text-[10px]">Sin imagen</span>
          </div>
        )}

        {/* Loading skeleton */}
        {!loaded && !errored && (
          <div className="absolute inset-0 animate-pulse"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.03), rgba(20,202,186,0.04))' }} />
        )}

        {/* Expand icon */}
        <button
          className="absolute top-2 right-2 p-1.5 rounded-[8px] opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
          style={{ background: 'rgba(0,0,0,0.65)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { e.stopPropagation(); onExpand({ url, label: meta.label, opKey }); }}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Filter badge */}
        <div
          className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold backdrop-blur-sm"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
        >
          {meta.label}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2.5 flex items-center justify-between gap-2"
        style={{ borderTop: `1px solid ${meta.border}`, background: `${meta.bg}` }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold truncate" style={{ color: meta.color }}>
            {meta.label}
          </p>
          {sizeBytes && (
            <p className="text-[9px]" style={{ color: 'var(--text-3)' }}>{formatBytes(sizeBytes)}</p>
          )}
        </div>

        {/* Download button */}
        {url && opKey !== 'original' && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[10px] font-semibold transition-all duration-150 flex-shrink-0"
            style={{ background: 'rgba(0,0,0,0.30)', color: meta.color, border: `1px solid ${meta.border}` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = meta.bg;
              e.currentTarget.style.boxShadow = `0 0 12px ${meta.bg}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.30)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Descargar imagen"
          >
            <Download className="w-3 h-3" />
            <span>Descargar</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function ResultsGrid({ originals, processed, onClear }) {
  const [lightbox, setLightbox] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  /* Build data: for each original, group its processed versions */
  const groups = originals.map((name) => {
    const ops = {};
    processed.filter((p) => p.originalName === name)
             .forEach((item) => { ops[item.operation] = item; });
    return {
      name,
      originalUrl: `${API_BASE}/download/${name}`,
      operations: ops,
    };
  });

  /* Flatten into individual cards: original + each filter */
  const allCards = [];
  groups.forEach((group, gi) => {
    // Original
    allCards.push({
      key:    `${group.name}-original`,
      label:  group.name,
      url:    group.originalUrl,
      opKey:  'original',
      delay:  `${gi * 4 * 0.06}s`,
    });

    // Each processed filter
    ['edges', 'blur', 'grayscale', 'sepia', 'invert'].forEach((op, oi) => {
      const item = group.operations[op];
      allCards.push({
        key:       `${group.name}-${op}`,
        label:     group.name,
        url:       item ? item.url : null,
        filename:  item ? item.filename : null,
        sizeBytes: item ? item.sizeBytes : null,
        opKey:     op,
        available: !!item,
        delay:     `${(gi * 6 + oi + 1) * 0.05}s`,
      });
    });
  });

  const totalImages  = originals.length;
  const totalFilters = processed.length;

  const handleClear = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Section header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: '#00d4ff' }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#00d4ff' }}>
              Resultados del clúster MPI
            </span>
          </div>
          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-0.025em' }}>
            Galería de imágenes procesadas
          </h3>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-2)' }}>
            <span style={{ color: '#00d4ff', fontWeight: 600 }}>{totalImages}</span> imagen{totalImages !== 1 ? 'es' : ''}
            {' '}·{' '}
            <span style={{ color: '#5eead4', fontWeight: 600 }}>{totalFilters}</span> filtros aplicados
          </p>
        </div>

        {/* Clear button */}
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all duration-200"
          style={confirmClear
            ? { background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.40)', boxShadow: '0 0 16px rgba(239,68,68,0.15)' }
            : { background: 'rgba(239,68,68,0.06)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)' }
          }
          onMouseEnter={(e) => { if (!confirmClear) e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
          onMouseLeave={(e) => { if (!confirmClear) e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {confirmClear ? '¿Confirmar limpiar?' : 'Limpiar galería'}
        </button>
      </div>

      <div className="cyber-line" />

      {/* ── Legend ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(OP_META).map(([key, m]) => (
          <div key={key} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold"
            style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
            {m.label}
          </div>
        ))}
      </div>

      {/* ── Images by group ── */}
      {groups.map((group, gi) => (
        <div key={group.name} className="space-y-3">
          {/* Group label */}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(180deg, #00d4ff, #14caba)' }} />
            <h4 className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
              {group.name}
            </h4>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* 6-column grid for original + 5 filters, wrapping beautifully */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Original */}
            <ImageCard
              key={`${group.name}-original`}
              label={group.name}
              url={group.originalUrl}
              opKey="original"
              delay={`${gi * 6 * 0.05}s`}
              onExpand={setLightbox}
            />

            {/* Processed filters */}
            {['edges', 'blur', 'grayscale', 'sepia', 'invert'].map((op, oi) => {
              const item = group.operations[op];
              return (
                <ImageCard
                  key={`${group.name}-${op}`}
                  label={group.name}
                  url={item ? item.url : null}
                  filename={item ? item.filename : null}
                  sizeBytes={item ? item.sizeBytes : null}
                  opKey={op}
                  delay={`${(gi * 6 + oi + 1) * 0.05}s`}
                  onExpand={setLightbox}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Lightbox / Fullscreen modal ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-12"
          style={{ background: 'rgba(0,2,6,0.95)', backdropFilter: 'blur(24px)' }}
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-4xl w-full flex flex-col gap-4 animate-fadeInScale"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    background: OP_META[lightbox.opKey]?.bg || 'rgba(0,212,255,0.10)',
                    color:      OP_META[lightbox.opKey]?.color || '#00d4ff',
                    border:     `1px solid ${OP_META[lightbox.opKey]?.border || 'rgba(0,212,255,0.25)'}`,
                  }}
                >
                  {lightbox.label}
                </div>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold transition-colors"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              >
                <X className="w-3.5 h-3.5" /> Cerrar
              </button>
            </div>

            {/* Full image */}
            <div
              className="relative rounded-[18px] overflow-hidden"
              style={{
                background: '#030608',
                border: `1px solid ${OP_META[lightbox.opKey]?.border || 'rgba(0,212,255,0.15)'}`,
                boxShadow: `0 0 80px ${OP_META[lightbox.opKey]?.bg || 'rgba(0,212,255,0.08)'}`,
              }}
            >
              {lightbox.url ? (
                <img
                  src={lightbox.url}
                  alt={lightbox.label}
                  className="w-full h-auto block max-h-[75vh] object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-3)' }}>
                  <ImageOff className="w-10 h-10" />
                </div>
              )}

              {/* Bottom bar */}
              <div className="absolute bottom-0 inset-x-0 px-5 py-3 flex items-center justify-between"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', backdropFilter: 'blur(4px)' }}>
                <span className="text-[12px] font-semibold" style={{ color: OP_META[lightbox.opKey]?.color || '#00d4ff' }}>
                  {OP_META[lightbox.opKey]?.label || lightbox.opKey} — {lightbox.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
