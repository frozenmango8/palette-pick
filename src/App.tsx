import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExportPanel } from './components/ExportPanel';
import { Header } from './components/Header';
import { ImageStage } from './components/ImageStage';
import { PaletteControls } from './components/PaletteControls';
import { SwatchList } from './components/SwatchList';
import { useClipboard } from './hooks/useClipboard';
import { useQuantize } from './hooks/useQuantize';
import { useTheme } from './hooks/useTheme';
import { DEFAULT_PALETTE } from './lib/constants';
import { createSampleFile } from './lib/paintSample';
import { readImageFile, type ImageSample } from './lib/readImage';
import { sortSwatches, type SortMode } from './lib/sort';

export function App() {
  const { theme, toggle } = useTheme();
  const { copiedKey, notice, copy } = useClipboard();
  const [image, setImage] = useState<ImageSample | null>(null);
  const [k, setK] = useState(DEFAULT_PALETTE);
  const [sort, setSort] = useState<SortMode>('prominence');
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const quant = useQuantize(image?.pixels ?? null, k);
  const swatches = useMemo(() => sortSwatches(quant.swatches, sort), [quant.swatches, sort]);

  useEffect(() => {
    if (!image) return;
    return () => URL.revokeObjectURL(image.previewUrl);
  }, [image]);

  const loadId = useRef(0);

  const loadFile = useCallback(async (file: File) => {
    const id = loadId.current + 1;
    loadId.current = id;
    setReading(true);
    setReadError(null);
    try {
      const next = await readImageFile(file);
      if (id !== loadId.current) {
        URL.revokeObjectURL(next.previewUrl);
        return;
      }
      if (next.pixels.length === 0) {
        URL.revokeObjectURL(next.previewUrl);
        setReadError('This image is fully transparent, so there are no colors to extract.');
        return;
      }
      setImage(next);
    } catch {
      if (id === loadId.current) {
        setReadError('Could not read that image. Try PNG, JPEG, GIF, WebP, or SVG.');
      }
    } finally {
      if (id === loadId.current) setReading(false);
    }
  }, []);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (!item.type.startsWith('image/')) continue;
        const file = item.getAsFile();
        if (!file) return;
        event.preventDefault();
        void loadFile(file);
        return;
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadFile]);

  const loadSample = useCallback(async () => {
    try {
      setReadError(null);
      const file = await createSampleFile();
      await loadFile(file);
    } catch {
      setReadError('Could not draw the sample image.');
    }
  }, [loadFile]);

  const summary = buildSummary(image, swatches.length, k, quant.status, quant.elapsedMs, quant.error);

  return (
    <>
      <Header theme={theme} onToggleTheme={toggle} />
      <main id="main">
        <div className="layout">
          <ImageStage
            image={image}
            reading={reading}
            error={readError}
            onFile={(file) => void loadFile(file)}
            onSample={() => void loadSample()}
            onClear={() => {
              setImage(null);
              setReadError(null);
            }}
          />
          <div className="side">
            <PaletteControls k={k} sort={sort} summary={summary} onK={setK} onSort={setSort} />
            <ExportPanel
              swatches={swatches}
              sourceName={image?.fileName ?? 'palette'}
              copiedKey={copiedKey}
              onCopy={(text, key) => void copy(text, key)}
            />
          </div>
          <SwatchList
            swatches={swatches}
            working={quant.status === 'working'}
            copiedKey={copiedKey}
            onCopy={(text, key) => void copy(text, key)}
          />
        </div>
      </main>
      <footer className="site-footer">
        <p>Nothing is uploaded. Quantization runs in a Web Worker on this page.</p>
        <p>
          <a href="https://github.com/frozenmango8/palette-pick">Source</a>
          <span aria-hidden="true"> · </span>
          <span>MIT License</span>
        </p>
      </footer>
      <div className="sr-only" role="status" aria-live="polite">
        {notice}
      </div>
    </>
  );
}

function buildSummary(
  image: ImageSample | null,
  found: number,
  requested: number,
  status: string,
  elapsedMs: number,
  error: string | null,
): string | null {
  if (!image) return null;
  if (status === 'working' && found === 0) return 'Quantizing in CIELAB…';
  if (status === 'error') return error;
  if (status !== 'ready' && found === 0) return null;

  const sampled = (image.pixels.length / 3).toLocaleString('en-US');
  const count =
    found < requested
      ? `${found} of ${requested} colors — fewer distinct clusters in this image`
      : `${found} colors`;
  const timing = status === 'working' ? 'updating…' : formatMs(elapsedMs);
  return `${count} · ${timing} · ${sampled} sampled pixels`;
}

function formatMs(ms: number): string {
  if (ms < 1) return '<1 ms';
  return `${Math.round(ms)} ms`;
}
