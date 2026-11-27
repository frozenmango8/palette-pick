import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  paletteBasename,
  toCssVariables,
  toPaletteJson,
  toTailwindConfig,
  toTailwindTheme,
} from '../lib/export';
import type { QuantizedColor } from '../lib/quantize';

type Format = 'css' | 'tailwind' | 'json';
type TailwindKind = 'v3' | 'v4';

const FORMATS: { id: Format; label: string; short?: string }[] = [
  { id: 'css', label: 'CSS variables', short: 'CSS' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'json', label: 'JSON' },
];

interface ExportPanelProps {
  swatches: readonly QuantizedColor[];
  sourceName: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

export function ExportPanel({ swatches, sourceName, copiedKey, onCopy }: ExportPanelProps) {
  const [format, setFormat] = useState<Format>('css');
  const [tailwindKind, setTailwindKind] = useState<TailwindKind>('v3');
  const pendingFocus = useRef<Format | null>(null);

  const text = useMemo(() => {
    if (format === 'css') return toCssVariables(swatches, sourceName);
    if (format === 'json') return toPaletteJson(swatches, sourceName);
    return tailwindKind === 'v3'
      ? toTailwindConfig(swatches, sourceName)
      : toTailwindTheme(swatches, sourceName);
  }, [format, sourceName, swatches, tailwindKind]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    document.getElementById(`export-tab-${pendingFocus.current}`)?.focus();
    pendingFocus.current = null;
  }, [format]);

  if (swatches.length === 0) return null;

  function selectFormat(next: Format, moveFocus = false) {
    if (moveFocus) pendingFocus.current = next;
    setFormat(next);
  }

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = FORMATS.findIndex((item) => item.id === format);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % FORMATS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + FORMATS.length) % FORMATS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = FORMATS.length - 1;
    else return;
    event.preventDefault();
    selectFormat(FORMATS[next].id, true);
  }

  const base = paletteBasename(sourceName);
  const file =
    format === 'css'
      ? `${base}.css`
      : format === 'json'
        ? `${base}.palette.json`
        : tailwindKind === 'v3'
          ? `${base}.tailwind.cjs`
          : `${base}.theme.css`;
  const mime =
    format === 'json' ? 'application/json' : format === 'tailwind' && tailwindKind === 'v3' ? 'text/javascript' : 'text/css';

  return (
    <section className="export" aria-labelledby="export-heading">
      <div className="section-label">
        <h2 id="export-heading">Export</h2>
      </div>
      <div className="tabs" role="tablist" aria-label="Export format" onKeyDown={onTabKey}>
        {FORMATS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`export-tab-${item.id}`}
            aria-selected={format === item.id}
            aria-controls="export-panel"
            tabIndex={format === item.id ? 0 : -1}
            onClick={() => selectFormat(item.id)}
          >
            <span className="tab-long">{item.label}</span>
            <span className="tab-short">{item.short ?? item.label}</span>
          </button>
        ))}
      </div>
      {format === 'tailwind' ? (
        <div className="subchoice" role="radiogroup" aria-label="Tailwind format">
          <button type="button" role="radio" aria-checked={tailwindKind === 'v3'} onClick={() => setTailwindKind('v3')}>
            v3 config
          </button>
          <button type="button" role="radio" aria-checked={tailwindKind === 'v4'} onClick={() => setTailwindKind('v4')}>
            v4 theme
          </button>
        </div>
      ) : null}
      <div role="tabpanel" id="export-panel" aria-labelledby={`export-tab-${format}`}>
        <pre tabIndex={0}>
          <code>{text}</code>
        </pre>
      </div>
      <div className="stage-actions">
        <button type="button" className="button button-primary" onClick={() => onCopy(text, 'export')}>
          {copiedKey === 'export' ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="button" onClick={() => download(file, text, mime)}>
          Download
        </button>
      </div>
    </section>
  );
}

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
