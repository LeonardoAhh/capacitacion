'use client';

import React from 'react';
import NextImage from 'next/image';
import {
    IconChevronRight as ChevronRight,
    IconTrash2 as Trash2,
    IconUploadCloud as UploadCloud,
    IconImage as Image,
    IconVideo as Video,
    IconPlay as Play,
} from '@/lib/icons';
import styles from '../../../../app/induccion/page.module.css';

export default function GalleryView({
    canEdit,
    activeTab,
    galleryExpanded,
    setGalleryExpanded,
    galleryItems,
    setGalleryFile,
    setGalleryName,
    setGalleryProgress,
    setGalleryType,
    setShowGalleryModal,
    filteredGallery,
    searchQuery,
    setSelectedMedia,
    handleGalleryDelete
}) {

    if (activeTab !== 'galeria' && activeTab !== 'all') return null;

    return (
        <section className={styles.nativeSection}>
            <div className={styles.coursesHeader}>
                <h2 className={styles.sectionTitle} onClick={() => setGalleryExpanded(!galleryExpanded)} style={{ cursor: 'pointer' }}>
                    <ChevronRight size={16} className={`${styles.chevronIcon} ${galleryExpanded ? styles.expanded : ''}`} />
                    <Image size={14} style={{ color: 'var(--c-orange)', flexShrink: 0 }} />
                    Galería
                    <span className={styles.sectionCount}>{galleryItems.length}</span>
                </h2>
                {canEdit && (
                    <button className={styles.newCourseBtn} onClick={() => { setGalleryFile(null); setGalleryName(''); setGalleryProgress(0); setGalleryType('imagen'); setShowGalleryModal(true); }}>
                        <UploadCloud size={13} />
                        Subir
                    </button>
                )}
            </div>

            {galleryExpanded && (
                filteredGallery.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Image size={48} opacity={0.15} style={{ marginBottom: '10px' }} />
                        <p>{searchQuery ? 'No hay resultados en la galería.' : 'No hay elementos en la galería. Sube imágenes o videos.'}</p>
                    </div>
                ) : (
                    <div className={styles.galleryGrid}>
                        {filteredGallery.map(item => (
                            <div key={item.id} className={styles.galleryCard}>
                                <div onClick={() => setSelectedMedia(item)} className={styles.galleryThumbWrap} style={{ cursor: 'pointer' }}>
                                    {item.tipo === 'imagen' ? (
                                        <NextImage unoptimized fill src={item.viewLink} alt={item.nombre} className={styles.galleryThumb} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                    ) : null}
                                    <div className={styles.galleryVideoPlaceholder} style={{ display: item.tipo === 'video' ? 'flex' : 'none' }}>
                                        <Video size={32} style={{ color: 'var(--c-orange)', opacity: 0.7 }} />
                                    </div>
                                    {item.tipo === 'video' && (
                                        <div className={styles.galleryPlayOverlay}><Play size={20} /></div>
                                    )}
                                </div>
                                <div className={styles.galleryCardFooter}>
                                    <span className={styles.galleryItemName} title={item.nombre}>
                                        {item.tipo === 'imagen'
                                            ? <Image size={11} style={{ color: 'var(--c-orange)', flexShrink: 0 }} />
                                            : <Video size={11} style={{ color: '#6366f1', flexShrink: 0 }} />
                                        }
                                        {item.nombre}
                                    </span>
                                    {canEdit && (
                                        <button className={styles.galleryDeleteBtn} onClick={(e) => handleGalleryDelete(e, item.id)} title="Eliminar"><Trash2 size={12} /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </section>
    );
}
