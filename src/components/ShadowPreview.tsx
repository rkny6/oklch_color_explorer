import { OklchColor, oklchToHex } from '../utils/color'
import styles from './ShadowPreview.module.css'

interface ShadowPreviewProps {
  originalColors: OklchColor[]
  shadowColors: OklchColor[]
  shadowEnabled: boolean
}

export function ShadowPreview({ originalColors, shadowColors, shadowEnabled }: ShadowPreviewProps) {
  const originalHexes = originalColors.map(oklchToHex)
  const shadowHexes = shadowColors.map(oklchToHex)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Shadow Path Preview</h3>
          <p className={styles.subtitle}>
            {shadowEnabled
              ? 'Compare your raw path with the shadow-aware transformation.'
              : 'Draw a path and enable shadow influence to preview behavior.'
            }
          </p>
        </div>
      </div>

      <div className={styles.rows}>
        <div className={styles.column}>
          <div className={styles.columnLabel}>Original Path</div>
          <div
            className={styles.gradientBar}
            style={{ background: `linear-gradient(to right, ${originalHexes.join(', ')})` }}
          />
          <div className={styles.swatches}>
            {originalHexes.map((hex, index) => (
              <span key={index} className={styles.swatch} style={{ background: hex }} title={hex} />
            ))}
          </div>
        </div>

        {shadowEnabled && shadowHexes.length > 0 ? (
          <div className={styles.column}>
            <div className={styles.columnLabel}>Shadow-Aware Path</div>
            <div
              className={styles.gradientBar}
              style={{ background: `linear-gradient(to right, ${shadowHexes.join(', ')})` }}
            />
            <div className={styles.swatches}>
              {shadowHexes.map((hex, index) => (
                <span key={index} className={styles.swatch} style={{ background: hex }} title={hex} />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.column}> 
            <div className={styles.columnLabel}>Shadow-Aware Path</div>
            <div className={styles.emptyState}>
              <p>Enable Shadow Influence to compare the transformed path.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
