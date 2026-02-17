'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './DataCenter.module.css';
import { DATA_CENTER_ITEMS } from '../config/constants';

export default function DataCenter() {
    const [selectedData, setSelectedData] = useState(null);

    return (
        <section className={styles.dataCenterSection}>
            <h3 className={styles.sectionHeader}>Centro de Ayuda</h3>
            <div className={styles.dataGrid}>
                {DATA_CENTER_ITEMS.map((item) => (
                    <div
                        key={item.id}
                        className={styles.dataCard}
                        onClick={() => setSelectedData(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedData(item)}
                    >
                        <div className={styles.dataIcon}>
                            {item.icon}
                        </div>
                        <span className={styles.dataTitle}>{item.title}</span>
                    </div>
                ))}
            </div>

            {selectedData && (
                <div className={styles.modal} onClick={() => setSelectedData(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>{selectedData.title}</h3>
                            <button
                                className={styles.closeButton}
                                onClick={() => setSelectedData(null)}
                                aria-label="Cerrar"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <p className={styles.modalDesc}>{selectedData.desc}</p>
                        <div className={styles.modalBody}>
                            {selectedData.content}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
