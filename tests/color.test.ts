import { describe, expect, it } from 'vitest';
import {
  BLACK,
  WHITE,
  channelDistance,
  contrastGrade,
  contrastRatio,
  formatHsl,
  formatRatio,
  formatRgb,
  hexToRgb,
  inkFor,
  labToRgb,
  relativeLuminance,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
  type RGB,
} from '../src/lib/color';

function roundTrip(rgb: RGB): RGB {
  return labToRgb(rgbToLab(rgb));
}

describe('hex and rgb', () => {
  it('formats and parses six-digit hex', () => {
    expect(rgbToHex({ r: 196, g: 73, b: 44 })).toBe('#C4492C');
    expect(hexToRgb('#c4492c')).toEqual({ r: 196, g: 73, b: 44 });
    expect(hexToRgb('C4492C')).toEqual({ r: 196, g: 73, b: 44 });
  });

  it('expands short hex', () => {
    expect(hexToRgb('#0f8')).toEqual({ r: 0, g: 255, b: 136 });
  });

  it('rejects malformed hex', () => {
    expect(hexToRgb('#gg0000')).toBeNull();
    expect(hexToRgb('#1234')).toBeNull();
    expect(hexToRgb('')).toBeNull();
  });

  it('formats CSS rgb and hsl', () => {
    const red = { r: 255, g: 0, b: 0 };
    expect(formatRgb(red)).toBe('rgb(255, 0, 0)');
    expect(formatHsl(red)).toBe('hsl(0, 100%, 50%)');
  });
});

describe('hsl', () => {
  it('converts primaries, white, and gray', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
    expect(rgbToHsl(WHITE)).toEqual({ h: 0, s: 0, l: 100 });
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toMatchObject({ s: 0 });
  });
});

describe('CIELAB', () => {
  it('puts white near L* 100 and black near L* 0', () => {
    expect(rgbToLab(WHITE).l).toBeCloseTo(100, 0);
    expect(rgbToLab(BLACK).l).toBeCloseTo(0, 0);
  });

  it('round-trips sRGB primaries', () => {
    const samples: RGB[] = [
      WHITE,
      BLACK,
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 196, g: 73, b: 44 },
      { r: 36, g: 59, b: 103 },
    ];
    for (const sample of samples) {
      expect(channelDistance(sample, roundTrip(sample))).toBeLessThanOrEqual(1);
    }
  });
});

describe('contrast', () => {
  it('matches the WCAG black/white and identical-color bounds', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 5);
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 5);
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 5);
  });

  it('grades thresholds used for body text and large text', () => {
    expect(contrastGrade(7)).toBe('AAA');
    expect(contrastGrade(4.5)).toBe('AA');
    expect(contrastGrade(3)).toBe('AA large');
    expect(contrastGrade(2.9)).toBe('Fail');
  });

  it('reports a mid-gray that fails body text on white', () => {
    const ratio = contrastRatio({ r: 119, g: 119, b: 119 }, WHITE);
    expect(ratio).toBeGreaterThan(4);
    expect(ratio).toBeLessThan(4.6);
    expect(formatRatio(ratio)).toMatch(/^\d+(\.\d+)?:1$/);
  });

  it('picks white ink on dark colors and black ink on light colors', () => {
    expect(inkFor({ r: 20, g: 24, b: 28 })).toBe('#FFFFFF');
    expect(inkFor({ r: 245, g: 236, b: 220 })).toBe('#000000');
  });
});
