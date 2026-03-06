import AdminLayout from '@/components/layout/AdminLayout/AdminLayout'; // [NEW]
import { BancoPreguntas } from './BancoPreguntas';
import styles from './respuestas.module.css';

export const metadata = {
    title: 'Banco de Respuestas | Capacitación',
    description: 'Consulta las respuestas correctas del banco de preguntas de evaluación.',
};

export default function RespuestasPage() {
    return (
        <AdminLayout title="Banco de Respuestas">
            <div className={styles.pageWrapper}>
                <main className={styles.main}>
                    <h1 className={styles.pageTitle}>Banco de Preguntas</h1>
                    <p className={styles.pageSubtitle}>
                        Busca por pregunta, ID o tema para consultar la respuesta correcta.
                    </p>
                    <BancoPreguntas />
                </main>
            </div>
        </AdminLayout>
    );
}
