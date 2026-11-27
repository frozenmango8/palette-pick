import {
  contrastRatio,
  BLACK,
  WHITE,
  formatHsl,
  rgbToHex,
  rgbToHsl,
  type RGB,
} from './color';

export interface ExportSwatch {
  rgb: RGB;
  count: number;
}

function totalCount(swatches: readonly ExportSwatch[]): number {
  return swatches.reduce((sum, swatch) => sum + swatch.count, 0);
}

function commentSource(sourceName?: string): string {
  return sourceName ? ` from ${sourceName}` : '';
}

export function paletteBasename(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const slug = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'palette';
}

export function toCssVariables(swatches: readonly ExportSwatch[], sourceName?: string): string {
  const lines = swatches.map((swatch, index) => {
    const name = `--palette-${index + 1}`;
    return `  ${name}: ${rgbToHex(swatch.rgb)};`;
  });
  return `/* palette-pick${commentSource(sourceName)} */\n:root {\n${lines.join('\n')}\n}\n`;
}

/** Tailwind CSS v3 `tailwind.config` colors block. */
export function toTailwindConfig(swatches: readonly ExportSwatch[], sourceName?: string): string {
  const entries = swatches
    .map((swatch, index) => `        ${index + 1}: '${rgbToHex(swatch.rgb)}',`)
    .join('\n');
  return `/** palette-pick${commentSource(sourceName)} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${entries}\n        },\n      },\n    },\n  },\n};\n`;
}

/** Tailwind CSS v4 `@theme` tokens. */
export function toTailwindTheme(swatches: readonly ExportSwatch[], sourceName?: string): string {
  const lines = swatches
    .map((swatch, index) => `  --color-palette-${index + 1}: ${rgbToHex(swatch.rgb)};`)
    .join('\n');
  return `/* palette-pick${commentSource(sourceName)} */\n@theme {\n${lines}\n}\n`;
}

export function toPaletteJson(swatches: readonly ExportSwatch[], sourceName?: string): string {
  const total = totalCount(swatches);
  const payload = {
    source: sourceName ?? null,
    algorithm: 'k-means++',
    colorSpace: 'CIELAB',
    colors: swatches.map((swatch, index) => {
      const hsl = rgbToHsl(swatch.rgb);
      return {
        index: index + 1,
        hex: rgbToHex(swatch.rgb),
        rgb: { r: swatch.rgb.r, g: swatch.rgb.g, b: swatch.rgb.b },
        hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
        css: {
          rgb: `rgb(${swatch.rgb.r}, ${swatch.rgb.g}, ${swatch.rgb.b})`,
          hsl: formatHsl(swatch.rgb),
        },
        population: total === 0 ? 0 : Number((swatch.count / total).toFixed(4)),
        count: swatch.count,
        contrastOnWhite: Number(contrastRatio(swatch.rgb, WHITE).toFixed(2)),
        contrastOnBlack: Number(contrastRatio(swatch.rgb, BLACK).toFixed(2)),
      };
    }),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}
