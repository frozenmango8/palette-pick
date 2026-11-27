import { useEffect, useRef, useState } from 'react';
import type { QuantizedColor } from '../lib/quantize';
import { isQuantizeFailure, type QuantizeResponse } from '../lib/messages';

export type QuantizeStatus = 'idle' | 'working' | 'ready' | 'error';

interface QuantizeState {
  status: QuantizeStatus;
  swatches: QuantizedColor[];
  elapsedMs: number;
  error: string | null;
}

const IDLE: QuantizeState = { status: 'idle', swatches: [], elapsedMs: 0, error: null };

export function useQuantize(pixels: Uint8Array | null, k: number): QuantizeState {
  const [state, setState] = useState<QuantizeState>(IDLE);
  const requestId = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/quantize.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<QuantizeResponse>) => {
      const message = event.data;
      if (message.id !== requestId.current) return;
      if (isQuantizeFailure(message)) {
        setState({ status: 'error', swatches: [], elapsedMs: 0, error: message.error });
        return;
      }
      setState({
        status: 'ready',
        elapsedMs: message.elapsedMs,
        error: null,
        swatches: message.swatches.map((swatch) => ({
          rgb: { r: swatch.r, g: swatch.g, b: swatch.b },
          count: swatch.count,
        })),
      });
    };
    worker.onerror = () => {
      setState({
        status: 'error',
        swatches: [],
        elapsedMs: 0,
        error: 'The quantization worker failed.',
      });
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const pixelsRef = useRef(pixels);

  useEffect(() => {
    const worker = workerRef.current;
    const id = requestId.current + 1;
    requestId.current = id;
    const pixelsChanged = pixelsRef.current !== pixels;
    pixelsRef.current = pixels;

    if (!pixels || pixels.length === 0 || !worker) {
      setState(pixels && pixels.length === 0
        ? { status: 'error', swatches: [], elapsedMs: 0, error: 'This image has no opaque pixels.' }
        : IDLE);
      return;
    }

    setState((current) => ({
      status: 'working',
      error: null,
      swatches: pixelsChanged ? [] : current.swatches,
      elapsedMs: pixelsChanged ? 0 : current.elapsedMs,
    }));

    const copy = pixels.slice();
    worker.postMessage({ id, pixels: copy, k }, [copy.buffer]);
  }, [pixels, k]);

  return state;
}
