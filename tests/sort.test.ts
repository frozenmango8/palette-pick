import { describe, expect, it } from 'vitest';
import { sortSwatches } from '../src/lib/sort';

const swatches = [
  { rgb: { r: 30, g: 70, b: 200 }, count: 10 },
  { rgb: { r: 220, g: 40, b: 40 }, count: 40 },
  { rgb: { r: 140, g: 140, b: 140 }, count: 80 },
  { rgb: { r: 40, g: 160, b: 70 }, count: 20 },
];

describe('sortSwatches', () => {
  it('orders by population', () => {
    const sorted = sortSwatches(swatches, 'prominence');
    expect(sorted.map((swatch) => swatch.count)).toEqual([80, 40, 20, 10]);
  });

  it('orders by hue and parks neutrals at the end', () => {
    const sorted = sortSwatches(swatches, 'hue');
    expect(sorted.map((swatch) => swatch.count)).toEqual([40, 20, 10, 80]);
  });

  it('parks a near-black with the neutrals', () => {
    const items = [
      { rgb: { r: 26, g: 23, b: 20 }, count: 4 },
      { rgb: { r: 196, g: 73, b: 44 }, count: 4 },
    ];
    expect(sortSwatches(items, 'hue').map((swatch) => swatch.rgb.r)).toEqual([196, 26]);
  });

  it('does not mutate the input', () => {
    const snapshot = swatches.map((swatch) => swatch.count);
    sortSwatches(swatches, 'hue');
    expect(swatches.map((swatch) => swatch.count)).toEqual(snapshot);
  });
});
