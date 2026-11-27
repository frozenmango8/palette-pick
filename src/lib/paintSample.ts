/**
 * A flat color study used by "Try a sample".
 * Rectangles only, so every pixel is one of six paints and the palette
 * can be checked by eye.
 */
export function paintSample(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#E9D8C4';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#243B67';
  ctx.fillRect(width * 0.05, height * 0.08, width * 0.28, height * 0.78);

  ctx.fillStyle = '#1F6F6A';
  ctx.fillRect(width * 0.27, height * 0.14, width * 0.4, height * 0.42);

  ctx.fillStyle = '#C4492C';
  ctx.fillRect(width * 0.52, height * 0.34, width * 0.42, height * 0.34);

  ctx.fillStyle = '#E1A948';
  ctx.fillRect(width * 0.16, height * 0.72, width * 0.74, height * 0.16);

  ctx.fillStyle = '#1A1714';
  ctx.fillRect(width * 0.4, height * 0.08, width * 0.07, height * 0.56);
}

export async function createSampleFile(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not draw the sample image.');
  paintSample(context, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Could not draw the sample image.'));
    }, 'image/png');
  });

  return new File([blob], 'sample-study.png', { type: 'image/png' });
}
