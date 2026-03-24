import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { BancoPreguntas } from './BancoPreguntas';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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
                    <div className={styles.pageHeader}>
                        <Link href="/capacitacion/examen" className={styles.backIconBtn} title="Volver al Generador">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className={styles.pageTitle}>Banco de Preguntas</h1>
                            <p className={styles.pageSubtitle}>
                                Busca por pregunta, ID o tema para consultar la respuesta correcta.
                            </p>
                        </div>
                    </div>
                    <BancoPreguntas />
                </main>
            </div>
        </AdminLayout>
    );
}
