'use client';

/**
 * Editor para el simulador térmico LOTO.
 * Modelo de datos: { heading, subtitle, safeTemp? }
 * El simulador en sí (componentes, curva de enfriamiento) está cableado en
 * ThermalSimSlide.js y no se edita desde Firestore — sólo el copy y el
 * umbral de temperatura segura.
 */
export default function ThermalSimSlideEditor({ formData, handleChange, styles }) {
    const safeTemp = formData.safeTemp ?? 50;

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título del simulador</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={(e) => handleChange('heading', e.target.value)}
                    placeholder="Ej. Seguridad LOTO: Disipación Térmica"
                    maxLength={120}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Subtítulo</label>
                <input
                    className={styles.input}
                    value={formData.subtitle || ''}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                    placeholder="Mensaje de orientación para el usuario"
                    maxLength={180}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Temperatura segura (°C)</label>
                <input
                    className={styles.input}
                    type="number"
                    min={20}
                    max={150}
                    step={1}
                    value={safeTemp}
                    onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n)) handleChange('safeTemp', n);
                    }}
                    placeholder="50"
                />
                <p className={styles.helpText} style={{ marginTop: 6 }}>
                    Umbral por debajo del cual el componente se considera seguro para mantenimiento LOTO. Default: 50 °C.
                </p>
            </div>
        </>
    );
}
