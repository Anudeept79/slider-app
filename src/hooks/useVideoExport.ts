import { useRef, useCallback, useState, useMemo } from 'react';

interface UseVideoExportOptions {
  beforeImage: string;
  afterImage: string;
  onProgress: (pos: number) => void;
}

export interface VideoFormat {
  mimeType: string;
  ext:      string;
  label:    string;
}

// ─── Format detection (MP4 on Safari, WebM elsewhere) ─────────────────────
function detectFormat(): VideoFormat | null {
  if (!window.MediaRecorder) return null;
  const candidates: VideoFormat[] = [
    { mimeType: 'video/mp4;codecs=avc1', ext: 'mp4',  label: 'MP4'  },
    { mimeType: 'video/mp4',             ext: 'mp4',  label: 'MP4'  },
    { mimeType: 'video/webm;codecs=vp9', ext: 'webm', label: 'WebM' },
    { mimeType: 'video/webm;codecs=vp8', ext: 'webm', label: 'WebM' },
    { mimeType: 'video/webm',            ext: 'webm', label: 'WebM' },
  ];
  return candidates.find(c => MediaRecorder.isTypeSupported(c.mimeType)) ?? null;
}

// ─── Animation timeline (7.3 s) ───────────────────────────────────────────
//  0    –  500 : hold Before   (audience registers the "before" state)
//  500  – 2500 : sweep → After (first reveal, ease-in-out)
//  2500 – 3000 : hold After    (let eye register the transformation)
//  3000 – 5000 : ping-pong → Before (comparison sweep back)
//  5000 – 5300 : hold Before
//  5300 – 6800 : final sweep → After (closing reveal, ends on result)
//  6800 – 7300 : hold After    (video ends showing the result)

const TOTAL_MS = 7300;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

function getSliderPos(ms: number): number {
  if (ms <=  500) return 100;
  if (ms <= 2500) return (1 - easeInOut((ms -  500) / 2000)) * 100;
  if (ms <= 3000) return 0;
  if (ms <= 5000) return       easeInOut((ms - 3000) / 2000)  * 100;
  if (ms <= 5300) return 100;
  if (ms <= 6800) return (1 - easeInOut((ms - 5300) / 1500)) * 100;
  return 0;
}

// Labels fade in over first 400 ms, stay at full opacity for the rest
const getLabelOpacity = (ms: number) => Math.min(ms / 400, 1);

// ─── Canvas helpers ────────────────────────────────────────────────────────

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: 'left' | 'right',
  opacity: number,
  W: number,
) {
  const fontSize = Math.max(13, Math.round(W / 56));
  const px = Math.round(fontSize * 1.0);
  const py = Math.round(fontSize * 0.6);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font         = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';

  const tw = ctx.measureText(text).width;
  const bw = tw + px * 2;
  const bh = fontSize + py * 2;
  const bx = align === 'right' ? x - bw : x;
  const by = y - bh;

  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  roundedRect(ctx, bx, by, bw, bh, 6);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth   = 1;
  roundedRect(ctx, bx, by, bw, bh, 6);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.fillText(text, bx + px, by + bh / 2);
  ctx.restore();
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  imgBefore: HTMLImageElement,
  imgAfter:  HTMLImageElement,
  sliderPos: number,
  labelOpacity: number,
  W: number,
  H: number,
) {
  ctx.clearRect(0, 0, W, H);

  // ① Before — permanent background
  ctx.drawImage(imgBefore, 0, 0, W, H);

  // ② After — right side of divider
  const clipX = (sliderPos / 100) * W;
  if (clipX < W) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, 0, W - clipX, H);
    ctx.clip();
    ctx.drawImage(imgAfter, 0, 0, W, H);
    ctx.restore();
  }

  // ③ Divider line with subtle glow
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.55)';
  ctx.shadowBlur  = 10;
  ctx.fillStyle   = 'rgba(255,255,255,0.90)';
  ctx.fillRect(Math.max(0, clipX - 1), 0, 2, H);
  ctx.restore();

  // ④ Handle circle
  const r = Math.round(W / 58);
  ctx.save();
  ctx.beginPath();
  ctx.arc(clipX, H / 2, r, 0, Math.PI * 2);
  ctx.fillStyle   = 'white';
  ctx.shadowColor = 'rgba(0,0,0,0.40)';
  ctx.shadowBlur  = 14;
  ctx.fill();
  ctx.shadowBlur  = 0;
  ctx.beginPath();
  ctx.arc(clipX, H / 2, Math.round(r * 0.30), 0, Math.PI * 2);
  ctx.fillStyle = '#8b5cf6';
  ctx.fill();
  ctx.restore();

  // ⑤ Corner labels with fade-in
  const pad = Math.round(W / 46);
  drawLabel(ctx, 'BEFORE', pad,     H - pad, 'left',  labelOpacity, W);
  drawLabel(ctx, 'AFTER',  W - pad, H - pad, 'right', labelOpacity, W);
}

// ─── Image loader ──────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useVideoExport({ beforeImage, afterImage, onProgress }: UseVideoExportOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Detect once on mount — Safari gets MP4, Chrome/Firefox get WebM
  const videoFormat = useMemo<VideoFormat | null>(detectFormat, []);

  const exportVideo = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !beforeImage || !afterImage) return;

    if (!videoFormat) {
      setExportError('Video export requires Chrome, Firefox, or Safari 14.5+.');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const [imgBefore, imgAfter] = await Promise.all([
        loadImage(beforeImage),
        loadImage(afterImage),
      ]);

      const naturalW = imgBefore.naturalWidth  || 1280;
      const naturalH = imgBefore.naturalHeight || 720;
      const W = Math.min(1280, naturalW);
      const H = Math.round(W * (naturalH / naturalW));
      canvas.width  = W;
      canvas.height = H;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream   = (canvas as any).captureStream(60);
      const recorder = new MediaRecorder(stream, {
        mimeType:          videoFormat.mimeType,
        videoBitsPerSecond: 8_000_000,
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: videoFormat.mimeType });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `visual-contrast.${videoFormat.ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setIsExporting(false);
        onProgress(50);
      };

      recorder.start(100);

      const ctx2D    = canvas.getContext('2d')!;
      let startTime: number | null = null;

      const tick = (ts: number) => {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;

        onProgress(getSliderPos(elapsed));
        renderFrame(ctx2D, imgBefore, imgAfter, getSliderPos(elapsed), getLabelOpacity(elapsed), W, H);

        if (elapsed < TOTAL_MS) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setTimeout(() => recorder.stop(), 250);
        }
      };

      rafRef.current = requestAnimationFrame(tick);

    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed. Please try again.');
      setIsExporting(false);
    }
  }, [beforeImage, afterImage, onProgress, videoFormat]);

  return { canvasRef, isExporting, exportError, exportVideo, videoFormat };
}
