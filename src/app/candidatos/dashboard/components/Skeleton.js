'use client';

import React from 'react';
import styles from './Skeleton.module.css';

/**
 * Skeleton loading component for dashboard
 * Provides visual placeholders while content loads
 */

// Base skeleton element with shimmer animation
export function SkeletonPulse({ className = '', style = {} }) {
    return <div className={`${styles.skeleton} ${className}`} style={style} />;
}

// Course item skeleton
export function CourseItemSkeleton() {
    return (
        <div className={styles.courseItem}>
            <SkeletonPulse className={styles.courseIcon} />
            <div className={styles.courseContent}>
                <SkeletonPulse className={styles.courseTitle} />
                <SkeletonPulse className={styles.courseDuration} />
            </div>
            <SkeletonPulse className={styles.courseAction} />
        </div>
    );
}

// Profile section skeleton
export function ProfileSkeleton() {
    return (
        <div className={styles.profileSection}>
            <SkeletonPulse className={styles.avatar} />
            <SkeletonPulse className={styles.profileName} />
            <SkeletonPulse className={styles.profilePosition} />
        </div>
    );
}

// Menu item skeleton
export function MenuItemSkeleton() {
    return (
        <div className={styles.menuItem}>
            <SkeletonPulse className={styles.menuLabel} />
            <SkeletonPulse className={styles.menuValue} />
        </div>
    );
}

// Full dashboard skeleton
export function DashboardSkeleton() {
    return (
        <div className={styles.dashboardSkeleton}>
            {/* Profile Section */}
            <ProfileSkeleton />

            {/* Info Cards Section */}
            <div className={styles.section}>
                <SkeletonPulse className={styles.sectionHeader} />
                <div className={styles.infoGrid}>
                    {[1, 2, 3, 4].map(i => (
                        <SkeletonPulse key={i} className={styles.infoCard} />
                    ))}
                </div>
            </div>

            {/* Courses Section */}
            <div className={styles.section}>
                <SkeletonPulse className={styles.sectionHeader} />
                <div className={styles.menuGroup}>
                    {[1, 2, 3].map(i => (
                        <CourseItemSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DashboardSkeleton;
