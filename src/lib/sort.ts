import { rgbToHsl, type RGB } from './color';

export type SortMode = 'prominence' | 'hue';

export interface SortableSwatch {
  rgb: RGB;
  count: number;
}

/** Near-neutrals sit after chromatic colors so a hue sort reads as a spectrum. */
const GRAY_SATURATION = 15;

export function sortSwatches<T extends SortableSwatch>(swatches: readonly T[], mode: SortMode): T[] {
  const next = [...swatches];
  if (mode === 'prominence') {
    next.sort((a, b) => b.count - a.count);
    return next;
  }

  next.sort((a, b) => {
    const aHsl = rgbToHsl(a.rgb);
    const bHsl = rgbToHsl(b.rgb);
    const aGray = aHsl.s < GRAY_SATURATION ? 1 : 0;
    const bGray = bHsl.s < GRAY_SATURATION ? 1 : 0;
    if (aGray !== bGray) return aGray - bGray;
    if (aHsl.h !== bHsl.h) return aHsl.h - bHsl.h;
    if (aHsl.l !== bHsl.l) return aHsl.l - bHsl.l;
    return b.count - a.count;
  });
  return next;
}
