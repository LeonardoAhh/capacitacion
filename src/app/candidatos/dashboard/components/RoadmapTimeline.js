'use client';

import styles from './RoadmapTimeline.module.css';
import { ROADMAP_STEPS } from '../config/constants';

export default function RoadmapTimeline() {
    return (
        <section className={styles.roadmapSection}>
            <h3 className={styles.sectionHeader}>📅 Tu Primer Día</h3>
            <div className={styles.timelineContainer}>
                {ROADMAP_STEPS.map((step) => (
                    <div key={step.id} className={styles.timelineItem}>
                        <div className={styles.timelineDot} />
                        <div className={styles.timelineContent}>
                            <div className={styles.timelineTitle}>
                                {step.icon}
                                {step.title}
                            </div>
                            <ul className={styles.timelineList}>
                                {step.details.map((detail, idx) => (
                                    <li key={idx}>{detail}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
