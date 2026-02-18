'use client';

import { Phone } from 'lucide-react';
import styles from './ContactInfo.module.css';
import { HR_CONTACT_INFO, HR_PHONES } from '../config/constants';

export default function ContactInfo() {
    return (
        <section className={styles.contactSection}>
            <h3 className={styles.sectionHeader}>Contacto Recursos Humanos</h3>
            <div className={styles.contactGrid}>
                {HR_CONTACT_INFO.map((contact) => (
                    <div key={contact.id} className={styles.contactCard}>
                        <div className={styles.contactHeader}>
                            <div className={styles.contactTitle}>{contact.title}</div>
                            {contact.icon}
                        </div>
                        <div>
                            <div className={styles.contactLabel}>Horario de Atención</div>
                            {contact.schedule.map((time, idx) => (
                                <div key={idx} className={styles.contactText}>
                                    {time}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.phonesCard}>
                <div className={styles.contactLabel}>Teléfonos / WhatsApp</div>
                <div className={styles.phonesGrid}>
                    {HR_PHONES.map((phone, idx) => (
                        <div key={idx} className={styles.contactText}>
                            <Phone size={14} />
                            {phone}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
