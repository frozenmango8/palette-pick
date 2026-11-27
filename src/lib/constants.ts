export const MIN_PALETTE = 3;
export const MAX_PALETTE = 12;
export const DEFAULT_PALETTE = 6;

/** Longest edge of the canvas used for sampling. */
export const MAX_SAMPLE_EDGE = 180;

/** Cap for k-means. Uniform stride keeps spatial coverage. */
export const MAX_SAMPLES = 12_000;

/** Fixed seed so the same image always yields the same palette. */
export const QUANTIZE_SEED = 0xa11ce;
