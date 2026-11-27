import { QUANTIZE_SEED } from './constants';
import { clampByte, labToRgb, rgbToHex, rgbToLab, type Lab, type RGB } from './color';

export interface QuantizedColor {
  rgb: RGB;
  count: number;
}

const MAX_ITERATIONS = 24;

/**
 * k-means++ in CIELAB.
 *
 * Seeds are spread with D² sampling so a small accent color can still earn a
 * cluster, then Lloyd's algorithm tightens the means. The PRNG is seeded, so
 * the same pixels always produce the same palette. Fewer than `k` colors are
 * returned when the image does not contain that many distinct clusters.
 */
export function quantizeRgb(
  pixels: readonly RGB[],
  k: number,
  seed = QUANTIZE_SEED,
): QuantizedColor[] {
  if (!Number.isInteger(k) || k < 1) {
    throw new Error('Palette size must be an integer of at least 1.');
  }
  if (pixels.length === 0) return [];

  const labs = pixels.map((pixel) => rgbToLab(normalizeRgb(pixel)));
  const seeds = seedClusters(labs, Math.min(k, labs.length), mulberry32(seed));
  const { means, counts } = cluster(labs, seeds);

  const result: QuantizedColor[] = means.map((mean, index) => ({
    rgb: labToRgb(mean),
    count: counts[index],
  }));

  result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const aHex = rgbToHex(a.rgb);
    const bHex = rgbToHex(b.rgb);
    return aHex < bHex ? -1 : aHex > bHex ? 1 : 0;
  });

  return result;
}

/** `bytes` is tightly packed RGB, three bytes per pixel. */
export function quantizeBytes(
  bytes: ArrayLike<number>,
  k: number,
  seed = QUANTIZE_SEED,
): QuantizedColor[] {
  if (bytes.length % 3 !== 0) {
    throw new Error('Pixel data length must be a multiple of 3.');
  }
  const pixels: RGB[] = new Array(bytes.length / 3);
  for (let index = 0, pixel = 0; index < bytes.length; index += 3, pixel += 1) {
    pixels[pixel] = {
      r: clampByte(bytes[index]),
      g: clampByte(bytes[index + 1]),
      b: clampByte(bytes[index + 2]),
    };
  }
  return quantizeRgb(pixels, k, seed);
}

function normalizeRgb(pixel: RGB): RGB {
  return { r: clampByte(pixel.r), g: clampByte(pixel.g), b: clampByte(pixel.b) };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distanceSquared(a: Lab, b: Lab): number {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return dl * dl + da * da + db * db;
}

function seedClusters(labs: readonly Lab[], k: number, random: () => number): Lab[] {
  const count = labs.length;
  const first = labs[Math.floor(random() * count)];
  const seeds: Lab[] = [{ ...first }];
  const nearest = new Float64Array(count);
  for (let index = 0; index < count; index += 1) {
    nearest[index] = distanceSquared(labs[index], first);
  }

  while (seeds.length < k) {
    let sum = 0;
    for (let index = 0; index < count; index += 1) sum += nearest[index];
    if (sum === 0) break;

    let threshold = random() * sum;
    let chosenIndex = count - 1;
    for (let index = 0; index < count; index += 1) {
      threshold -= nearest[index];
      if (threshold <= 0) {
        chosenIndex = index;
        break;
      }
    }

    const chosen = labs[chosenIndex];
    seeds.push({ ...chosen });
    for (let index = 0; index < count; index += 1) {
      const distance = distanceSquared(labs[index], chosen);
      if (distance < nearest[index]) nearest[index] = distance;
    }
  }

  return seeds;
}

function nearestIndex(pixel: Lab, means: readonly Lab[]): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < means.length; index += 1) {
    const distance = distanceSquared(pixel, means[index]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

function farthestIndex(labs: readonly Lab[], means: readonly Lab[], skip: number): number {
  let farthest = 0;
  let farthestDistance = -1;
  for (let index = 0; index < labs.length; index += 1) {
    let nearestOther = Infinity;
    for (let meanIndex = 0; meanIndex < means.length; meanIndex += 1) {
      if (meanIndex === skip) continue;
      const distance = distanceSquared(labs[index], means[meanIndex]);
      if (distance < nearestOther) nearestOther = distance;
    }
    if (nearestOther > farthestDistance) {
      farthestDistance = nearestOther;
      farthest = index;
    }
  }
  return farthest;
}

function cluster(labs: readonly Lab[], initial: Lab[]): { means: Lab[]; counts: number[] } {
  const pixelCount = labs.length;
  let means = initial.map((mean) => ({ ...mean }));
  const k = means.length;
  const assignment = new Int32Array(pixelCount).fill(-1);

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
    const counts = new Array<number>(k).fill(0);
    const sumL = new Float64Array(k);
    const sumA = new Float64Array(k);
    const sumB = new Float64Array(k);
    let changed = 0;

    for (let index = 0; index < pixelCount; index += 1) {
      const best = nearestIndex(labs[index], means);
      if (assignment[index] !== best) {
        assignment[index] = best;
        changed += 1;
      }
      counts[best] += 1;
      sumL[best] += labs[index].l;
      sumA[best] += labs[index].a;
      sumB[best] += labs[index].b;
    }

    let emptied = false;
    for (let index = 0; index < k; index += 1) {
      if (counts[index] === 0) {
        emptied = true;
        means[index] = { ...labs[farthestIndex(labs, means, index)] };
      } else {
        means[index] = {
          l: sumL[index] / counts[index],
          a: sumA[index] / counts[index],
          b: sumB[index] / counts[index],
        };
      }
    }

    if (!emptied && changed === 0) break;
  }

  return tally(labs, means);
}

function tally(labs: readonly Lab[], means: Lab[]): { means: Lab[]; counts: number[] } {
  const k = means.length;
  const counts = new Array<number>(k).fill(0);
  const sumL = new Float64Array(k);
  const sumA = new Float64Array(k);
  const sumB = new Float64Array(k);

  for (let index = 0; index < labs.length; index += 1) {
    const best = nearestIndex(labs[index], means);
    counts[best] += 1;
    sumL[best] += labs[index].l;
    sumA[best] += labs[index].a;
    sumB[best] += labs[index].b;
  }

  const keptMeans: Lab[] = [];
  const keptCounts: number[] = [];
  for (let index = 0; index < k; index += 1) {
    if (counts[index] === 0) continue;
    keptMeans.push({
      l: sumL[index] / counts[index],
      a: sumA[index] / counts[index],
      b: sumB[index] / counts[index],
    });
    keptCounts.push(counts[index]);
  }

  return { means: keptMeans, counts: keptCounts };
}
