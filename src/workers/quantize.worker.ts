import { quantizeBytes } from '../lib/quantize';
import type { QuantizeRequest, QuantizeResponse } from '../lib/messages';

interface WorkerScope {
  onmessage: ((event: MessageEvent<QuantizeRequest>) => void) | null;
  postMessage(message: QuantizeResponse): void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (event: MessageEvent<QuantizeRequest>) => {
  const { id, pixels, k } = event.data;
  const started = performance.now();
  try {
    const swatches = quantizeBytes(pixels, k).map((swatch) => ({
      r: swatch.rgb.r,
      g: swatch.rgb.g,
      b: swatch.rgb.b,
      count: swatch.count,
    }));
    const message: QuantizeResponse = {
      id,
      swatches,
      elapsedMs: performance.now() - started,
    };
    scope.postMessage(message);
  } catch (error) {
    const message: QuantizeResponse = {
      id,
      error: error instanceof Error ? error.message : 'Quantization failed.',
    };
    scope.postMessage(message);
  }
};
