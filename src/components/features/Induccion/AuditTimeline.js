'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import styles from './AuditTimeline.module.css';

/** Mapeo de acción → emoji + color de fondo */
const ACTION_META = {
    create: { emoji: '✨', bg: 'rgba(var(--color-primary-rgb), 0.12)', label: 'Curso creado' },
    delete: { emoji: '🗑️', bg: 'rgba(239,68,68,0.1)', label: 'Eliminado' },
    publish: { emoji: '🚀', bg: 'rgba(34,197,94,0.12)', label: 'Publicado' },
    unpublish: { emoji: '📦', bg: 'rgba(156,163,175,0.12)', label: 'Despublicado' },
    rename: { emoji: '✏️', bg: 'rgba(99,102,241,0.12)', label: 'Renombrado' },
    gallery_upload: { emoji: '🖼️', bg: 'rgba(var(--color-primary-rgb), 0.08)', label: 'Imagen/video subido' },
    gallery_delete: { emoji: '🗑️', bg: 'rgba(239,68,68,0.08)', label: 'Imagen/video eliminado' },
    import: { emoji: '📥', bg: 'rgba(16,185,129,0.1)', label: 'Importado' },
};

/** Formatea fecha relativa simple */
function timeAgo(isoStr) {
    if (!isoStr) return '';
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return new Date(isoStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PAGE_SIZE = 10;

export default function AuditTimeline() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    const fetchLogs = async (afterDoc = null) => {
        setLoading(true);
        try {
            let q = query(
                collection(db, 'induccion_audit'),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE + 1)
            );
            if (afterDoc) q = query(q, startAfter(afterDoc));

            const snap = await getDocs(q);
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const hasMoreItems = docs.length > PAGE_SIZE;
            const page = hasMoreItems ? docs.slice(0, PAGE_SIZE) : docs;

            setLogs(prev => afterDoc ? [...prev, ...page] : page);
            setLastDoc(snap.docs[page.length - 1] || null);
            setHasMore(hasMoreItems);
        } catch (err) {
            console.error('AuditTimeline error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    if (loading && logs.length === 0) {
        return <div className={styles.empty}>Cargando historial...</div>;
    }

    if (!loading && logs.length === 0) {
        return <div className={styles.empty}>No hay actividad registrada aún.</div>;
    }

    return (
        <div>
            <div className={styles.wrap}>
                {logs.map(log => {
                    const meta = ACTION_META[log.action] || { emoji: '📋', bg: 'var(--bg-secondary)', label: log.action };
                    return (
                        <div key={log.id} className={styles.item}>
                            <div className={styles.iconWrap} style={{ background: meta.bg }}>
                                {meta.emoji}
                            </div>
                            <div className={styles.body}>
                                <div className={styles.actionLabel}>{meta.label}</div>
                                <div className={styles.meta}>
                                    <span>{log.userName || log.userId || 'Sistema'}</span>
                                    <span>·</span>
                                    <span>{timeAgo(log.timestamp)}</span>
                                </div>
                                {log.target && (
                                    <span className={styles.target} title={log.target}>{log.target}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {hasMore && (
                <button className={styles.loadMore} onClick={() => fetchLogs(lastDoc)} disabled={loading}>
                    {loading ? 'Cargando...' : 'Ver más'}
                </button>
            )}
        </div>
    );
}
