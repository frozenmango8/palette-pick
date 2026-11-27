import { describe, expect, it } from 'vitest';
import { channelDistance, rgbToHex, type RGB } from '../src/lib/color';
import { QUANTIZE_SEED } from '../src/lib/constants';
import { quantizeBytes, quantizeRgb } from '../src/lib/quantize';

function fill(color: RGB, count: number): RGB[] {
  return Array.from({ length: count }, () => ({ ...color }));
}

function expectNear(actual: RGB[], expected: RGB[], tolerance = 8) {
  for (const color of expected) {
    const match = actual.some((candidate) => channelDistance(candidate, color) <= tolerance);
    expect(match, `missing ${rgbToHex(color)} in ${actual.map(rgbToHex).join(', ')}`).toBe(true);
  }
}

describe('quantizeRgb', () => {
  it('returns nothing for an empty image', () => {
    expect(quantizeRgb([], 5)).toEqual([]);
  });

  it('rejects a palette size that is not a positive integer', () => {
    const pixels = fill({ r: 0, g: 0, b: 0 }, 2);
    expect(() => quantizeRgb(pixels, 0)).toThrow(/Palette size/);
    expect(() => quantizeRgb(pixels, 1.5)).toThrow(/Palette size/);
    expect(() => quantizeRgb(pixels, -3)).toThrow(/Palette size/);
  });

  it('keeps a flat color as a single swatch', () => {
    const red = { r: 220, g: 30, b: 30 };
    const result = quantizeRgb(fill(red, 50), 6);
    expect(result).toHaveLength(1);
    expect(channelDistance(result[0].rgb, red)).toBeLessThanOrEqual(1);
    expect(result[0].count).toBe(50);
  });

  it('separates two equal blocks', () => {
    const red = { r: 210, g: 40, b: 40 };
    const blue = { r: 30, g: 70, b: 200 };
    const result = quantizeRgb([...fill(red, 80), ...fill(blue, 80)], 2);
    expect(result).toHaveLength(2);
    expectNear(
      result.map((swatch) => swatch.rgb),
      [red, blue],
      2,
    );
    expect(result.map((swatch) => swatch.count).sort((a, b) => a - b)).toEqual([80, 80]);
  });

  it('does not invent colors the image does not contain', () => {
    const colors = [
      { r: 20, g: 20, b: 20 },
      { r: 240, g: 200, b: 40 },
      { r: 20, g: 140, b: 90 },
    ];
    const pixels = colors.flatMap((color) => fill(color, 40));
    const result = quantizeRgb(pixels, 8);
    expect(result.length).toBe(3);
    expect(result.reduce((sum, swatch) => sum + swatch.count, 0)).toBe(pixels.length);
  });

  it('recovers small accents next to a dominant neutral', () => {
    const gray = { r: 140, g: 140, b: 140 };
    const accents = [
      { r: 210, g: 40, b: 36 },
      { r: 24, g: 150, b: 86 },
      { r: 32, g: 72, b: 196 },
      { r: 230, g: 180, b: 28 },
    ];
    const pixels = [...fill(gray, 800), ...accents.flatMap((color) => fill(color, 40))];
    const result = quantizeRgb(pixels, 5);
    expect(result).toHaveLength(5);
    expectNear(
      result.map((swatch) => swatch.rgb),
      [gray, ...accents],
      10,
    );
    expect(result[0].count).toBe(800);
    expect(result.reduce((sum, swatch) => sum + swatch.count, 0)).toBe(pixels.length);
  });

  it('is deterministic for a fixed seed', () => {
    const pixels = [
      ...fill({ r: 12, g: 40, b: 80 }, 30),
      ...fill({ r: 200, g: 90, b: 40 }, 25),
      ...fill({ r: 240, g: 220, b: 180 }, 15),
      ...fill({ r: 40, g: 120, b: 110 }, 18),
    ];
    const once = quantizeRgb(pixels, 4, QUANTIZE_SEED).map((swatch) => rgbToHex(swatch.rgb));
    const twice = quantizeRgb(pixels, 4, QUANTIZE_SEED).map((swatch) => rgbToHex(swatch.rgb));
    expect(twice).toEqual(once);
  });
});

describe('quantizeBytes', () => {
  it('reads packed RGB bytes', () => {
    const bytes = new Uint8Array([255, 0, 0, 255, 0, 0, 0, 0, 255]);
    const result = quantizeBytes(bytes, 2);
    expect(result).toHaveLength(2);
    expectNear(
      result.map((swatch) => swatch.rgb),
      [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 0, b: 255 },
      ],
      1,
    );
  });

  it('rejects a byte length that is not divisible by 3', () => {
    expect(() => quantizeBytes(new Uint8Array([1, 2, 3, 4]), 2)).toThrow(/multiple of 3/);
  });
});
