'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './respuestas.module.css';

export function BancoPreguntas() {
    const [searchQuery, setSearchQuery] = useState('');
    const [preguntas, setPreguntas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/evaluaciones.json')
            .then((res) => res.json())
            .then((data) => setPreguntas(Array.isArray(data) ? data : []))
            .catch(() => setPreguntas([]))
            .finally(() => setLoading(false));
    }, []);

    const filteredPreguntas = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return preguntas.filter(
            (p) =>
                p['PREGUNTA ']?.toLowerCase().includes(q) ||
                p.ID === q ||
                p.TEMA?.toLowerCase().includes(q)
        );
    }, [searchQuery, preguntas]);

    const getRespuesta = (p) => {
        const r = p.RESPUESTA?.trim();
        if (!r) return { letra: '', texto: 'N/A' };

        if (['A', 'B', 'C'].includes(r)) {
            const texto =
                p[`OPCIÓN ${r} `] ??
                p[`OPCIÓN ${r}`] ??
                r;
            return { letra: r, texto: String(texto) };
        }
        return { letra: '', texto: r };
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
                    placeholder="Buscar por pregunta, ID o tema..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                    autoFocus
                />
                {searchQuery && (
                    <button
                        className={styles.clearBtn}
                        onClick={() => setSearchQuery('')}
                        aria-label="Limpiar búsqueda"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className={styles.statusRow}>
                {loading && (
                    <p className={styles.statusText}>
                        <span className={styles.spinner} /> Cargando banco de preguntas...
                    </p>
                )}
                {!loading && !searchQuery.trim() && (
                    <p className={styles.statusText}>
                        📚 {preguntas.length} preguntas disponibles. Escribe algo para buscar.
                    </p>
                )}
                {!loading && searchQuery.trim() && filteredPreguntas.length === 0 && (
                    <p className={styles.statusText}>
                        Sin resultados para &ldquo;{searchQuery}&rdquo;
                    </p>
                )}
                {!loading && filteredPreguntas.length > 0 && (
                    <p className={styles.statusText}>
                        {filteredPreguntas.length} resultado{filteredPreguntas.length !== 1 ? 's' : ''} encontrado{filteredPreguntas.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            <div className={styles.resultsList}>
                {filteredPreguntas.map((p) => {
                    const { letra, texto } = getRespuesta(p);
                    return (
                        <div key={p.ID} className={styles.card}>
                            <div className={styles.cardMeta}>
                                <span className={styles.idBadge}>#{p.ID}</span>
                                <span className={styles.temaBadge}>{p.TEMA}</span>
                                <span className={`${styles.tipoBadge} ${p.TIPO === 'Múltiple' ? styles.tipoMultiple : styles.tipoAbierta}`}>
                                    {p.TIPO}
                                </span>
                            </div>
                            <p className={styles.preguntaText}>{p['PREGUNTA ']}</p>

                            {p.TIPO === 'Múltiple' && (
                                <div className={styles.opciones}>
                                    {['A', 'B', 'C'].map((l) => {
                                        const textoOpcion = p[`OPCIÓN ${l} `] ?? p[`OPCIÓN ${l}`];
                                        if (!textoOpcion) return null;
                                        const esCorrecta = p.RESPUESTA?.trim() === l;
                                        return (
                                            <div
                                                key={l}
                                                className={`${styles.opcion} ${esCorrecta ? styles.opcionCorrecta : ''}`}
                                            >
                                                <span className={styles.opcionLetra}>{l})</span>
                                                <span className={styles.opcionTexto}>{textoOpcion}</span>
                                                {esCorrecta && <span className={styles.checkmark}>✓</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {p.TIPO !== 'Múltiple' && (
                                <div className={styles.respuestaAbierta}>
                                    <span className={styles.respuestaLabel}>✓ Respuesta:</span>
                                    <span className={styles.respuestaTexto}>{texto}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
