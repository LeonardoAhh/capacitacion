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
                    {/* Features Originales */}
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
                        <p>Directorio, historiales y perfiles.</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconBlue}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        </div>
                        <h3>Módulo de Capacitación</h3>
                        <p>Cursos, calificaciones y brechas.</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconGreen}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                <path d="M22 12A10 10 0 0 0 12 2v10z" />
                            </svg>
                        </div>
                        <h3>Análisis y KPIs</h3>
                        <p>Cumplimiento y necesidades.</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconOrange}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h3>Alertas Inteligentes</h3>
                        <p>Vencimientos y evaluaciones.</p>
                    </div>

                    {/* Nuevas Features */}
                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconBlue}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                        </div>
                        <h3>Modo Demo</h3>
                        <p>Acceso público de lectura.</p>
                    </div>

                    <div className={styles.feature}>
                        <div className={`${styles.icon} ${styles.iconOrange}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </div>
                        <h3>Gestión Total</h3>
                        <p>Eliminar/Editar (Admin).</p>
                    </div>
                </div>

                <div className={styles.tip}>
                    <strong>Tip:</strong> Usa el menú de &quot;Acciones Rápidas&quot; en el Dashboard para navegar velozmente.
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
