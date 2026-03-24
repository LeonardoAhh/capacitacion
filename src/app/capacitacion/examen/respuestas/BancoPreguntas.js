'use client';

import { useState, useMemo, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import styles from './respuestas.module.css';

export function BancoPreguntas() {
    const [searchQuery, setSearchQuery] = useState('');
    const [preguntas, setPreguntas] = useState([]);
    const [filterType, setFilterType] = useState('Todos');
    const [filterTheme, setFilterTheme] = useState('Todos');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFromFirestore = async () => {
            try {
                const q = query(collection(db, 'exam_questions'), orderBy('question'));
                const snap = await getDocs(q);
                // Mapeamos los campos de Firestore (minúsculas/inglés) a los que espera este componente (Mayúsculas/Español)
                // para no romper el resto del componente visual
                const data = snap.docs.map(d => {
                    const fd = d.data();
                    const isMult = fd.type === 'Múltiple';
                    return {
                        ID: d.id.substring(0, 6).toUpperCase(),
                        'PREGUNTA ': fd.question,
                        TEMA: fd.theme || 'General',
                        TIPO: fd.type,
                        // Solo convertimos a Mayúscula si es de una sola letra (A, B, C)
                        RESPUESTA: (isMult && fd.correctAnswer?.length === 1) 
                            ? fd.correctAnswer.toUpperCase() 
                            : fd.correctAnswer,
                        'OPCIÓN A ': fd.options?.a,
                        'OPCIÓN B ': fd.options?.b,
                        'OPCIÓN C ': fd.options?.c
                    };
                });
                setPreguntas(data);
            } catch (error) {
                console.error("Error al sincronizar con Firestore:", error);
                setPreguntas([]);
            } finally {
                setLoading(false);
            }
        };

        loadFromFirestore();
    }, []);

    const uniqueThemes = useMemo(() => {
        const themes = preguntas.map(p => p.TEMA || 'General');
        return ['Todos', ...new Set(themes)].sort();
    }, [preguntas]);

    const filteredPreguntas = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        
        return preguntas.filter((p) => {
            // Filtro por tipo
            if (filterType !== 'Todos' && p.TIPO !== filterType) return false;
            
            // Filtro por tema
            if (filterTheme !== 'Todos' && p.TEMA !== filterTheme) return false;
            
            // Filtro por búsqueda (solo si hay búsqueda)
            if (!q) return true; 

            return (
                p['PREGUNTA ']?.toLowerCase().includes(q) ||
                p.ID?.toLowerCase().includes(q) ||
                p.TEMA?.toLowerCase().includes(q)
            );
        });
    }, [searchQuery, preguntas, filterType, filterTheme]);

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

            <div className={styles.filtersRow}>
                <button 
                    className={`${styles.filterBtn} ${filterType === 'Todos' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilterType('Todos')}
                >
                    Todas
                </button>
                <button 
                    className={`${styles.filterBtn} ${filterType === 'Múltiple' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilterType('Múltiple')}
                >
                    Múltiple
                </button>
                <button 
                    className={`${styles.filterBtn} ${filterType === 'Abierta' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilterType('Abierta')}
                >
                    Abierta
                </button>

                <select
                    className={styles.selectTheme}
                    value={filterTheme}
                    onChange={(e) => setFilterTheme(e.target.value)}
                >
                    {uniqueThemes.map(theme => (
                        <option key={theme} value={theme}>
                            {theme === 'Todos' ? 'Todos los temas' : theme}
                        </option>
                    ))}
                </select>
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
