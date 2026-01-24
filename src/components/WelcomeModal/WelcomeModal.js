import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';
import styles from './WelcomeModal.module.css';

export default function WelcomeModal({ open, onOpenChange }) {
    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader>
                <DialogTitle>¡Bienvenido a Sistema Vertex</DialogTitle>
                <DialogClose onClose={() => onOpenChange(false)} />
            </DialogHeader>
            <DialogBody>
                <div className={styles.intro}>
                    <p>Has ingresado al sistema de gestión de Capacitación.</p>
                    <p>Aquí tienes un resumen de lo que puedes hacer:</p>
                </div>

                <div className={styles.grid}>
                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconPurple}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <h3>Gestión de Empleados</h3>
                        <p>Administra el directorio, consulta historiales y edita perfiles de personal.</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconBlue}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        </div>
                        <h3>Módulo de Capacitación</h3>
                        <p>Controla cursos, registra calificaciones y detecta brechas de habilidades por puesto.</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconGreen}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                <path d="M22 12A10 10 0 0 0 12 2v10z" />
                            </svg>
                        </div>
                        <h3>Análisis y KPIs</h3>
                        <p>Visualiza el cumplimiento global, por departamento y las necesidades de formación.</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconOrange}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h3>Alertas Inteligentes</h3>
                        <p>Recibe notificaciones sobre contratos próximos a vencer y evaluaciones pendientes.</p>
                    </div>
                </div>

                <div className={styles.tip}>
                    <strong>Tip:</strong> Usa el menú de "Acciones Rápidas" en el Dashboard para navegar velozmente.
                </div>

            </DialogBody>
            <DialogFooter>
                <Button onClick={() => onOpenChange(false)} variant="primary" fullWidth>
                    ¡Comencemos!
                </Button>
            </DialogFooter>
        </Dialog>
    );
}
