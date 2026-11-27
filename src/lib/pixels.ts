import { MAX_SAMPLES } from './constants';

/**
 * Pack opaque RGB pixels from RGBA image data.
 * Alpha below 128 is skipped so a transparent PNG is not polluted by the
 * empty backdrop. When there are more opaque pixels than `maxSamples`, a
 * uniform stride keeps coverage across the frame.
 */
export function packOpaquePixels(
  data: ArrayLike<number>,
  width: number,
  height: number,
  maxSamples = MAX_SAMPLES,
): Uint8Array {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('Width and height must be positive integers.');
  }
  if (!Number.isInteger(maxSamples) || maxSamples < 1) {
    throw new Error('maxSamples must be a positive integer.');
  }

  const pixelCount = width * height;
  if (data.length < pixelCount * 4) {
    throw new Error('Image data is shorter than width × height.');
  }

  let opaque = 0;
  for (let index = 0; index < pixelCount; index += 1) {
    if (data[index * 4 + 3] >= 128) opaque += 1;
  }
  if (opaque === 0) return new Uint8Array(0);

  const stride = Math.max(1, Math.ceil(opaque / maxSamples));
  const packed = new Uint8Array(Math.ceil(opaque / stride) * 3);
  let seen = 0;
  let offset = 0;
  for (let index = 0; index < pixelCount; index += 1) {
    const alphaIndex = index * 4;
    if (data[alphaIndex + 3] < 128) continue;
    if (seen % stride === 0) {
      packed[offset] = data[alphaIndex];
      packed[offset + 1] = data[alphaIndex + 1];
      packed[offset + 2] = data[alphaIndex + 2];
      offset += 3;
    }
    seen += 1;
  }

  return packed;
}

/** True when any pixel is not fully opaque, so the preview should show a checkerboard. */
export function imageHasTransparency(
  data: ArrayLike<number>,
  width: number,
  height: number,
): boolean {
  const pixelCount = width * height;
  if (data.length < pixelCount * 4) return false;
  for (let index = 0; index < pixelCount; index += 1) {
    if (data[index * 4 + 3] < 255) return true;
  }
  return false;
}
