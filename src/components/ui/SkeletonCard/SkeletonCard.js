'use client';

/**
 * SkeletonCard — Placeholder animado para estados de carga.
 * @param {number} count  — Cuántos skeletons mostrar
 * @param {'course'|'gallery'|'material'} type — Forma del skeleton
 */
import styles from './SkeletonCard.module.css';

function CourseSkeleton() {
    return (
        <div className={styles.courseWrap}>
            <div className={styles.courseRow}>
                <div className={`${styles.skeletonBase} ${styles.courseAvatar}`} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className={`${styles.skeletonBase} ${styles.courseTitle}`} />
                    <div className={`${styles.skeletonBase} ${styles.courseMeta}`} />
                </div>
                <div className={`${styles.skeletonBase} ${styles.courseBadge}`} />
            </div>
        </div>
    );
}

function GallerySkeleton() {
    return (
        <div className={styles.galleryWrap}>
            <div className={`${styles.skeletonBase} ${styles.galleryThumb}`} />
            <div className={`${styles.skeletonBase} ${styles.galleryFooter}`} />
        </div>
    );
}

function MaterialSkeleton() {
    return (
        <div className={styles.materialWrap}>
            <div className={`${styles.skeletonBase} ${styles.materialIcon}`} />
            <div className={styles.materialLines}>
                <div className={`${styles.skeletonBase} ${styles.materialLine1}`} />
                <div className={`${styles.skeletonBase} ${styles.materialLine2}`} />
            </div>
        </div>
    );
}

const SKELETON_MAP = {
    course: CourseSkeleton,
    gallery: GallerySkeleton,
    material: MaterialSkeleton,
};

export default function SkeletonCard({ count = 3, type = 'course' }) {
    const Skeleton = SKELETON_MAP[type] || CourseSkeleton;
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <Skeleton key={i} />
            ))}
        </>
    );
}
