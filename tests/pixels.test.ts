import { describe, expect, it } from 'vitest';
import { imageHasTransparency, packOpaquePixels } from '../src/lib/pixels';

function rgba(pixels: number[][]): Uint8ClampedArray {
  return Uint8ClampedArray.from(pixels.flat());
}

describe('packOpaquePixels', () => {
  it('skips transparent pixels and keeps opaque RGB', () => {
    const data = rgba([
      [10, 20, 30, 0],
      [1, 2, 3, 127],
      [4, 5, 6, 128],
      [7, 8, 9, 255],
    ]);
    expect(Array.from(packOpaquePixels(data, 4, 1))).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it('returns an empty buffer when every pixel is transparent', () => {
    const data = rgba([
      [1, 2, 3, 0],
      [4, 5, 6, 10],
    ]);
    expect(packOpaquePixels(data, 2, 1)).toHaveLength(0);
  });

  it('stride-samples so the result stays within maxSamples', () => {
    const pixels: number[][] = [];
    for (let index = 0; index < 100; index += 1) {
      pixels.push([index, 0, 0, 255]);
    }
    const packed = packOpaquePixels(rgba(pixels), 100, 1, 10);
    expect(packed.length / 3).toBe(10);
    expect(packed[0]).toBe(0);
    expect(packed[3]).toBe(10);
  });

  it('reports partial transparency', () => {
    const solid = rgba([
      [1, 2, 3, 255],
      [4, 5, 6, 255],
    ]);
    const punched = rgba([
      [1, 2, 3, 255],
      [0, 0, 0, 0],
    ]);
    expect(imageHasTransparency(solid, 2, 1)).toBe(false);
    expect(imageHasTransparency(punched, 2, 1)).toBe(true);
  });

  it('rejects inconsistent dimensions', () => {
    expect(() => packOpaquePixels(new Uint8Array(8), 3, 1)).toThrow(/shorter/);
    expect(() => packOpaquePixels(new Uint8Array(4), 0, 1)).toThrow(/positive/);
  });
});
