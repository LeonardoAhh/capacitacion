import Link from 'next/link';
import styles from './CandidatoCard.module.css';
import { UserPlus } from 'lucide-react';

export default function CandidatoCard() {
    return (
        <Link href="/candidatos" className={styles.card}>
            <div className={styles.iconWrapper}>
                <UserPlus size={28} />
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>Portal Candidatos</h3>
                <p className={styles.description}>Acceso a cursos de inducción</p>
            </div>
            <svg className={styles.arrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
            </svg>
        </Link>
    );
}
