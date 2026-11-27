import { describe, expect, it } from 'vitest';
import {
  paletteBasename,
  toCssVariables,
  toPaletteJson,
  toTailwindConfig,
  toTailwindTheme,
} from '../src/lib/export';

const swatches = [
  { rgb: { r: 196, g: 73, b: 44 }, count: 30 },
  { rgb: { r: 36, g: 59, b: 103 }, count: 10 },
];

describe('export formats', () => {
  it('writes CSS custom properties', () => {
    const css = toCssVariables(swatches, 'Harbor.png');
    expect(css).toContain('/* palette-pick from Harbor.png */');
    expect(css).toContain('--palette-1: #C4492C;');
    expect(css).toContain('--palette-2: #243B67;');
    expect(css.trim().endsWith('}')).toBe(true);
  });

  it('writes a Tailwind v3 config snippet and a v4 theme block', () => {
    expect(toTailwindConfig(swatches)).toContain("1: '#C4492C'");
    expect(toTailwindConfig(swatches)).toContain('module.exports');
    expect(toTailwindTheme(swatches)).toContain('--color-palette-1: #C4492C;');
    expect(toTailwindTheme(swatches)).toContain('@theme');
  });

  it('writes JSON with channels, population, and contrast', () => {
    const parsed = JSON.parse(toPaletteJson(swatches, 'study.png')) as {
      source: string;
      algorithm: string;
      colorSpace: string;
      colors: {
        hex: string;
        population: number;
        contrastOnWhite: number;
        contrastOnBlack: number;
        rgb: { r: number; g: number; b: number };
        hsl: { h: number; s: number; l: number };
      }[];
    };
    expect(parsed.source).toBe('study.png');
    expect(parsed.algorithm).toBe('k-means++');
    expect(parsed.colorSpace).toBe('CIELAB');
    expect(parsed.colors[0].hex).toBe('#C4492C');
    expect(parsed.colors[0].rgb).toEqual({ r: 196, g: 73, b: 44 });
    expect(parsed.colors[0].population).toBeCloseTo(0.75, 2);
    expect(parsed.colors[0].contrastOnWhite).toBeGreaterThan(1);
    expect(parsed.colors[1].contrastOnBlack).toBeGreaterThan(1);
    expect(parsed.colors.map((color) => color.population).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 2);
  });

  it('slugifies download names', () => {
    expect(paletteBasename('Harbor Study.PNG')).toBe('harbor-study');
    expect(paletteBasename('...')).toBe('palette');
    expect(paletteBasename('café photo.jpg')).toBe('caf-photo');
  });
});
