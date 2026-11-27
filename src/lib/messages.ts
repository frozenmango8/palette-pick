export interface QuantizeRequest {
  id: number;
  pixels: Uint8Array;
  k: number;
}

export interface QuantizeSwatch {
  r: number;
  g: number;
  b: number;
  count: number;
}

export interface QuantizeSuccess {
  id: number;
  elapsedMs: number;
  swatches: QuantizeSwatch[];
}

export interface QuantizeFailure {
  id: number;
  error: string;
}

export type QuantizeResponse = QuantizeSuccess | QuantizeFailure;

export function isQuantizeFailure(message: QuantizeResponse): message is QuantizeFailure {
  return 'error' in message;
}
