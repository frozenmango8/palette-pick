import type { KeyboardEvent } from 'react';
import { MAX_PALETTE, MIN_PALETTE } from '../lib/constants';
import type { SortMode } from '../lib/sort';

interface PaletteControlsProps {
  k: number;
  sort: SortMode;
  summary: string | null;
  onK: (size: number) => void;
  onSort: (mode: SortMode) => void;
}

export function PaletteControls({ k, sort, summary, onK, onSort }: PaletteControlsProps) {
  return (
    <section className="controls" aria-labelledby="palette-heading">
      <div className="section-label">
        <h2 id="palette-heading">Palette</h2>
      </div>
      <div className="size-row">
        <label htmlFor="palette-size">Size</label>
        <span className="size-value">{k}</span>
      </div>
      <div className="slider-row">
        <button
          type="button"
          className="icon-button"
          onClick={() => onK(Math.max(MIN_PALETTE, k - 1))}
          disabled={k <= MIN_PALETTE}
          aria-label="Fewer colors"
        >
          −
        </button>
        <input
          id="palette-size"
          type="range"
          min={MIN_PALETTE}
          max={MAX_PALETTE}
          step={1}
          value={k}
          onChange={(event) => onK(Number(event.target.value))}
        />
        <button
          type="button"
          className="icon-button"
          onClick={() => onK(Math.min(MAX_PALETTE, k + 1))}
          disabled={k >= MAX_PALETTE}
          aria-label="More colors"
        >
          +
        </button>
      </div>
      <p className="hint">From {MIN_PALETTE} to {MAX_PALETTE}. Changing the size re-runs quantization.</p>
      <div className="sort" role="radiogroup" aria-label="Sort colors" onKeyDown={(event) => onSortKey(event, sort, onSort)}>
        <button type="button" role="radio" aria-checked={sort === 'prominence'} onClick={() => onSort('prominence')}>
          Prominence
        </button>
        <button type="button" role="radio" aria-checked={sort === 'hue'} onClick={() => onSort('hue')}>
          Hue
        </button>
      </div>
      <p className="summary" role="status">
        {summary ?? 'Drop an image to extract a palette. k-means++ runs in CIELAB, in a Web Worker.'}
      </p>
    </section>
  );
}

function onSortKey(
  event: KeyboardEvent<HTMLDivElement>,
  sort: SortMode,
  onSort: (mode: SortMode) => void,
) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault();
  onSort(sort === 'prominence' ? 'hue' : 'prominence');
}
