'use client';

import styles from './EmployeeSkeleton.module.css';

export default function EmployeeSkeleton({ count = 6 }) {
    return (
        <div className={styles.grid}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.avatar} />
                        <div className={styles.info}>
                            <div className={styles.nameSkeleton} />
                            <div className={styles.positionSkeleton} />
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <div className={styles.idSkeleton} />
                        <div className={styles.badgeSkeleton} />
                    </div>
                </div>
            ))}
        </div>
    );
}
