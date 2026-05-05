import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Download, Loader2, AlertCircle, Sun, Moon } from 'lucide-react';
import { FileDropZone }     from './components/FileDropZone';
import { ComparisonSlider } from './components/ComparisonSlider';
import { useVideoExport }   from './hooks/useVideoExport';

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
const spring    = { type: 'spring' as const, stiffness: 280, damping: 26, mass: 0.8 };

export default function App() {
  // ── theme ────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? !window.matchMedia('(prefers-color-scheme: light)').matches
      : true,
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // ── image state ──────────────────────────────────────────────────────────
  const [beforeImage,    setBeforeImage]    = useState<string | null>(null);
  const [afterImage,     setAfterImage]     = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isAnimating,    setIsAnimating]    = useState(false);
  const rafRef = useRef<number | null>(null);

  const bothLoaded = !!(beforeImage && afterImage);

  const { canvasRef, isExporting, exportError, exportVideo, videoFormat } = useVideoExport({
    beforeImage: beforeImage ?? '',
    afterImage:  afterImage  ?? '',
    onProgress:  setSliderPosition,
  });

  const handleBeforeUpload = useCallback((url: string | null) => {
    if (beforeImage?.startsWith('blob:')) URL.revokeObjectURL(beforeImage);
    setBeforeImage(url);
    if (!url) setSliderPosition(50);
  }, [beforeImage]);

  const handleAfterUpload = useCallback((url: string | null) => {
    if (afterImage?.startsWith('blob:')) URL.revokeObjectURL(afterImage);
    setAfterImage(url);
    if (!url) setSliderPosition(50);
  }, [afterImage]);

  // ── play animation (ping-pong, mirrors export timeline) ─────────────────
  const playAnimation = useCallback(() => {
    if (isAnimating || isExporting) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setIsAnimating(true);
    setSliderPosition(100);

    const KF = { holdBefore: 400, toAfter: 2400, holdAfter: 2800,
                 toBefore: 4800, holdBefore2: 5100, toAfter2: 6300 };
    let startTime: number | null = null;

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const ms = ts - startTime;

      let pos: number;
      if      (ms <= KF.holdBefore)  pos = 100;
      else if (ms <= KF.toAfter)     pos = (1 - easeInOut((ms - KF.holdBefore)  / 2000)) * 100;
      else if (ms <= KF.holdAfter)   pos = 0;
      else if (ms <= KF.toBefore)    pos =      easeInOut((ms - KF.holdAfter)   / 2000)  * 100;
      else if (ms <= KF.holdBefore2) pos = 100;
      else if (ms <= KF.toAfter2)    pos = (1 - easeInOut((ms - KF.holdBefore2) / 1200)) * 100;
      else                           pos = 0;

      setSliderPosition(pos);

      if (ms < KF.toAfter2 + 400) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsAnimating(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [isAnimating, isExporting]);

  const resetSlider = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsAnimating(false);
    setSliderPosition(50);
  }, []);

  const disabled = isAnimating || isExporting;

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', padding: '72px 20px 80px' }}>
      <div style={{ width: '100%', maxWidth: 880 }}>

        {/* ══════════════════════════════════════════
            Header
        ══════════════════════════════════════════ */}
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          style={{ textAlign: 'center', marginBottom: 44, position: 'relative' }}
        >
          {/* Theme toggle — top-right of header */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setIsDark(d => !d)}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ position: 'absolute', right: 0, top: 0 }}
          >
            {isDark
              ? <Sun  size={15} strokeWidth={1.75} />
              : <Moon size={15} strokeWidth={1.75} />
            }
          </button>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 6, marginBottom: 20,
            background:   'var(--col-badge-bg)',
            border:       '1px solid var(--col-badge-border)',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: 'var(--col-badge-text)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%',
                           background: 'var(--col-badge-text)', opacity: 0.8 }} />
            Image Comparison
          </div>

          {/* Headline */}
          <h1 style={{
            margin: '0 0 14px',
            fontSize: 'clamp(36px, 6vw, 54px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            color: 'var(--col-text-1)',
          }}>
            Before &{' '}
            <span style={{
              background: 'linear-gradient(90deg, #a78bfa 0%, #8b5cf6 50%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
              backgroundClip: 'text',
            }}>
              After
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            margin: 0, fontSize: 15, lineHeight: 1.65,
            color: 'var(--col-text-2)', maxWidth: 340, marginInline: 'auto',
          }}>
            Compare images with an interactive slider.<br />
            Export the reveal as a polished video.
          </p>
        </motion.header>

        {/* ══════════════════════════════════════════
            Upload row
        ══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}
        >
          <FileDropZone label="Before" imageUrl={beforeImage} onUpload={handleBeforeUpload} disabled={disabled} />
          <FileDropZone label="After"  imageUrl={afterImage}  onUpload={handleAfterUpload}  disabled={disabled} />
        </motion.div>

        {/* ══════════════════════════════════════════
            Main area
        ══════════════════════════════════════════ */}
        <AnimatePresence mode="wait">

          {/* Empty placeholder */}
          {!bothLoaded && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative', width: '100%', aspectRatio: '16/9',
                borderRadius: 12, overflow: 'hidden',
                background: 'var(--col-empty)',
                border: '1px solid var(--col-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 10,
              }}
            >
              {/* Dot-grid canvas — Framer canvas aesthetic */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, var(--col-dot) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }} />
              {/* Vignette over grid */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse 65% 65% at 50% 50%, transparent 25%, var(--col-empty) 100%)',
              }} />
              <p style={{
                position: 'relative', margin: 0,
                fontSize: 13, color: 'var(--col-text-3)', textAlign: 'center', lineHeight: 1.6,
              }}>
                {!beforeImage && !afterImage ? 'Upload both images to start comparing'
                  : !beforeImage ? 'Upload the Before image to continue'
                  : 'Upload the After image to continue'}
              </p>
            </motion.div>
          )}

          {/* Comparison view */}
          {bothLoaded && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ ...spring, delay: 0.05 }}
              style={{ marginTop: 10 }}
            >
              {/* ── Control bar ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 10,
                background: 'var(--col-controls)',
                border: '1px solid var(--col-border)',
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost" onClick={playAnimation} disabled={disabled}>
                    {isAnimating
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Play    size={14} style={{ fill: 'currentColor' }} />
                    }
                    {isAnimating ? 'Playing…' : 'Play'}
                  </button>

                  <button className="btn btn-ghost" onClick={resetSlider} disabled={isExporting}>
                    <RotateCcw size={14} />
                    Reset
                  </button>
                </div>

                <button
                  className={`btn ${isExporting ? 'btn-danger' : 'btn-primary'}`}
                  onClick={exportVideo}
                  disabled={disabled}
                >
                  {isExporting ? (
                    <><Loader2 size={14} className="animate-spin" /> Downloading…</>
                  ) : (
                    <><Download size={14} /> Export {videoFormat?.label ?? 'Video'}</>
                  )}
                </button>
              </div>

              {/* ── Error banner ── */}
              <AnimatePresence>
                {exportError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 8, marginBottom: 10,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.22)',
                      fontSize: 13, color: 'rgba(248,113,113,0.95)',
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    {exportError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Slider frame (gradient border wrapper) ── */}
              <div style={{
                borderRadius: 12, padding: 1,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.55) 0%, rgba(255,255,255,0.08) 45%, rgba(139,92,246,0.30) 100%)',
                boxShadow: isDark
                  ? '0 24px 64px rgba(0,0,0,0.55)'
                  : '0 8px 32px rgba(0,0,0,0.12)',
              }}>
                <div style={{
                  width: '100%', aspectRatio: '16/9',
                  borderRadius: 11, overflow: 'hidden',
                  background: 'var(--col-surface-2)',
                  position: 'relative',
                }}>
                  <ComparisonSlider
                    beforeImage={beforeImage!}
                    afterImage={afterImage!}
                    position={sliderPosition}
                    onChange={setSliderPosition}
                    disabled={disabled}
                  />
                </div>
              </div>

              {/* ── Position track ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginTop: 12, padding: '0 2px',
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--col-text-3)',
                               whiteSpace: 'nowrap' }}>Before</span>

                <div style={{
                  flex: 1, height: 2, borderRadius: 99,
                  background: 'var(--col-track)', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${sliderPosition}%`,
                    background: 'rgba(139,92,246,0.55)',
                    borderRadius: 99,
                    transition: (isAnimating || isExporting) ? 'none' : 'width 0.04s linear',
                  }} />
                </div>

                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--col-text-3)',
                               whiteSpace: 'nowrap' }}>After</span>

                <span style={{
                  fontSize: 11, fontWeight: 500,
                  fontFamily: 'ui-monospace, monospace',
                  color: 'var(--col-text-3)',
                  minWidth: 30, textAlign: 'right',
                }}>
                  {Math.round(sliderPosition)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer hint */}
        {bothLoaded && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              textAlign: 'center', margin: '28px 0 0',
              fontSize: 11, color: 'var(--col-text-4)', lineHeight: 1.6,
            }}
          >
            Drag the handle to compare · Play previews the animation · Export saves a{' '}
            {videoFormat?.label ?? 'video'} file to your device
          </motion.p>
        )}
      </div>

      {/* Hidden recording canvas */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
