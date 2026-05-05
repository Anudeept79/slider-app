import { useRef, useCallback } from 'react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage:  string;
  /** 0 = After fully visible · 100 = Before fully visible */
  position: number;
  onChange: (pos: number) => void;
  disabled?: boolean;
}

export function ComparisonSlider({
  beforeImage,
  afterImage,
  position,
  onChange,
  disabled,
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);

  const updatePos = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      onChange((x / rect.width) * 100);
    },
    [onChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      updatePos(e.clientX);
    },
    [disabled, updatePos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => { if (dragging.current) updatePos(e.clientX); },
    [updatePos],
  );

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  // After image shows only the RIGHT portion (right of divider)
  const afterClip = `inset(0 0 0 ${position}%)`;

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden">

      {/* ① Before — permanent background */}
      <img
        src={beforeImage} alt="Before"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* ② After — right side of divider */}
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: afterClip }}>
        <img
          src={afterImage} alt="After"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* ③ Full-area pointer capture target */}
      <div
        className="absolute inset-0"
        style={{ cursor: disabled ? 'default' : 'ew-resize' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {/* ④ Divider line */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left:      `${position}%`,
          width:      2,
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.92)',
          boxShadow:  '0 0 10px rgba(255,255,255,0.40)',
        }}
      />

      {/* ⑤ Handle */}
      <div
        className="absolute top-1/2 pointer-events-none z-10"
        style={{
          left:      `${position}%`,
          transform: 'translate(-50%, -50%)',
          width: 42, height: 42,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 14px rgba(0,0,0,0.40), 0 0 0 1.5px rgba(255,255,255,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6.5 5L3 9l3.5 4"  stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.5 5L15 9l-3.5 4" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* ⑥ Corner labels — always dark (overlay images regardless of app theme) */}
      {(['before', 'after'] as const).map((side) => (
        <div
          key={side}
          className="absolute bottom-4 pointer-events-none"
          style={{
            [side === 'before' ? 'left' : 'right']: 16,
            padding:      '4px 9px',
            borderRadius:  6,
            background:   'rgba(0,0,0,0.52)',
            border:       '1px solid rgba(255,255,255,0.10)',
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: '0.08em',
            color:        'rgba(255,255,255,0.85)',
            textTransform: 'uppercase',
          }}
        >
          {side}
        </div>
      ))}

      {/* ⑦ Drag hint at default 50% */}
      {Math.abs(position - 50) < 1.5 && !disabled && (
        <div
          className="absolute top-4 left-1/2 pointer-events-none"
          style={{
            transform:   'translateX(-50%)',
            display:     'flex', alignItems: 'center', gap: 6,
            padding:     '5px 12px',
            borderRadius: 99,
            background:  'rgba(0,0,0,0.44)',
            border:      '1px solid rgba(255,255,255,0.10)',
            fontSize:     11,
            color:       'rgba(255,255,255,0.58)',
            whiteSpace:  'nowrap',
          }}
        >
          <span>←</span><span>Drag to compare</span><span>→</span>
        </div>
      )}
    </div>
  );
}
