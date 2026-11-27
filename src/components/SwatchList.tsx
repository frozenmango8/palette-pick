import {
  BLACK,
  WHITE,
  contrastGrade,
  contrastRatio,
  formatHsl,
  formatRatio,
  formatRgb,
  inkFor,
  rgbToHex,
} from '../lib/color';
import type { QuantizedColor } from '../lib/quantize';

interface SwatchListProps {
  swatches: readonly QuantizedColor[];
  working: boolean;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}

export function SwatchList({ swatches, working, copiedKey, onCopy }: SwatchListProps) {
  if (swatches.length === 0) return null;

  const total = swatches.reduce((sum, swatch) => sum + swatch.count, 0);

  return (
    <section className="palette" aria-labelledby="swatch-heading" aria-busy={working}>
      <div className="section-label">
        <h2 id="swatch-heading">Swatches</h2>
        <p>Click a value to copy it.</p>
      </div>
      <ul className={working ? 'swatches is-working' : 'swatches'}>
        {swatches.map((swatch, index) => {
          const hex = rgbToHex(swatch.rgb);
          const rgb = formatRgb(swatch.rgb);
          const hsl = formatHsl(swatch.rgb);
          const id = `${index}-${hex}`;
          const onWhite = contrastRatio(swatch.rgb, WHITE);
          const onBlack = contrastRatio(swatch.rgb, BLACK);
          const share = total === 0 ? 0 : Math.round((swatch.count / total) * 100);
          return (
            <li key={id}>
              <article className="swatch">
                <button
                  type="button"
                  className="swatch-face"
                  style={{ background: hex, color: inkFor(swatch.rgb) }}
                  onClick={() => onCopy(hex, `hex:${id}`)}
                  aria-label={`Copy ${hex}`}
                >
                  <span>{copiedKey === `hex:${id}` ? 'Copied' : hex}</span>
                  <span className="share">{share}%</span>
                </button>
                <div className="swatch-body">
                  <button type="button" onClick={() => onCopy(rgb, `rgb:${id}`)}>
                    <span className="value-label">RGB</span>
                    <span>{copiedKey === `rgb:${id}` ? 'Copied' : rgb}</span>
                  </button>
                  <button type="button" onClick={() => onCopy(hsl, `hsl:${id}`)}>
                    <span className="value-label">HSL</span>
                    <span>{copiedKey === `hsl:${id}` ? 'Copied' : hsl}</span>
                  </button>
                  <dl>
                    <div>
                      <dt>White</dt>
                      <dd>
                        <span>{formatRatio(onWhite)}</span>
                        <Grade ratio={onWhite} />
                      </dd>
                    </div>
                    <div>
                      <dt>Black</dt>
                      <dd>
                        <span>{formatRatio(onBlack)}</span>
                        <Grade ratio={onBlack} />
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Grade({ ratio }: { ratio: number }) {
  const grade = contrastGrade(ratio);
  const tone = grade === 'Fail' ? 'fail' : grade === 'AAA' ? 'aaa' : 'aa';
  return <span className={`grade grade-${tone}`}>{grade}</span>;
}
