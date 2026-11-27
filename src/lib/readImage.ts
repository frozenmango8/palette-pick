import { MAX_SAMPLE_EDGE } from './constants';
import { imageHasTransparency, packOpaquePixels } from './pixels';

export interface ImageSample {
  previewUrl: string;
  fileName: string;
  naturalWidth: number;
  naturalHeight: number;
  pixels: Uint8Array;
  hasTransparency: boolean;
}

export async function readImageFile(file: File): Promise<ImageSample> {
  if (!file.type.startsWith('image/') && !/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(file.name)) {
    throw new Error('Not an image.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Could not decode that image.');
  }

  try {
    const scale = Math.min(1, MAX_SAMPLE_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not read pixels from this image.');
    context.drawImage(bitmap, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    const pixels = packOpaquePixels(image.data, width, height);
    return {
      previewUrl: URL.createObjectURL(file),
      fileName: file.name || 'pasted-image.png',
      naturalWidth: bitmap.width,
      naturalHeight: bitmap.height,
      pixels,
      hasTransparency: imageHasTransparency(image.data, width, height),
    };
  } finally {
    bitmap.close();
  }
}
