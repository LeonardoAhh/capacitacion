import BackButton from '@/components/ui/BackButton/BackButton';
import { BancoPreguntas } from './BancoPreguntas';
import styles from './respuestas.module.css';

export const metadata = {
    title: 'Banco de Respuestas | Capacitación',
    description: 'Consulta las respuestas correctas del banco de preguntas de evaluación.',
};

export default function RespuestasPage() {
    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <BackButton href="/capacitacion/examen" />
                <span className={styles.headerTitle}>Banco de Respuestas</span>
                <div style={{ width: 40 }} />
            </header>

            <main className={styles.main}>
                <h1 className={styles.pageTitle}>Banco de Preguntas</h1>
                <p className={styles.pageSubtitle}>
                    Busca por pregunta, ID o tema para consultar la respuesta correcta.
                </p>
                <BancoPreguntas />
            </main>
        </div>
    );
}
