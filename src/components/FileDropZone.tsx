import { useRef, useState, useCallback } from 'react';
import { UploadCloud, X, RefreshCw } from 'lucide-react';

interface FileDropZoneProps {
  label:    string;
  imageUrl: string | null;
  onUpload: (url: string | null) => void;
  disabled?: boolean;
}

export function FileDropZone({ label, imageUrl, onUpload, disabled }: FileDropZoneProps) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [isDragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      onUpload(URL.createObjectURL(file));
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const zoneClass = [
    'upload-zone',
    isDragOver ? 'drag-over' : '',
    imageUrl   ? 'has-image' : '',
    disabled   ? 'pointer-events-none opacity-50' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={zoneClass}
      style={{ height: 168 }}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => !imageUrl && !disabled && inputRef.current?.click()}
    >
      {imageUrl ? (
        /* ── Loaded state ──────────────────────────────────────────── */
        <>
          <img
            src={imageUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Bottom scrim */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)',
            }}
          />

          {/* Label + buttons */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between"
            style={{ padding: '0 14px 12px' }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>
              {label}
            </span>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* Replace */}
              <button
                title="Replace image"
                disabled={disabled}
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{
                  width: 28, height: 28, borderRadius: 7, border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.12)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              >
                <RefreshCw size={12} color="rgba(255,255,255,0.85)" />
              </button>

              {/* Remove */}
              <button
                title="Remove image"
                disabled={disabled}
                onClick={(e) => { e.stopPropagation(); onUpload(null); }}
                style={{
                  width: 28, height: 28, borderRadius: 7, border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(239,68,68,0.22)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.50)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
              >
                <X size={12} color="rgba(255,255,255,0.90)" />
              </button>
            </div>
          </div>

          {/* Drop-to-replace overlay */}
          {isDragOver && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.20)', backdropFilter: 'blur(4px)' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Drop to replace</span>
            </div>
          )}
        </>
      ) : (
        /* ── Empty state ────────────────────────────────────────────── */
        <div
          className="flex flex-col items-center justify-center h-full select-none"
          style={{ gap: 12 }}
        >
          {/* Icon box — uses theme variable */}
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--col-ghost-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <UploadCloud
              size={18}
              color={isDragOver ? '#8b5cf6' : 'var(--col-text-3)'}
              strokeWidth={1.75}
            />
          </div>

          <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--col-text-2)' }}>
              {label} Image
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--col-text-3)' }}>
              {isDragOver ? 'Drop to upload' : 'Click or drag to upload'}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
