"use client";

import { motion } from "framer-motion";
import { User, Lock, GraduationCap } from "lucide-react";
import { useId } from "react";
import styles from './TrainingLogin.module.css';
import AILoadingState from '../ui/AILoadingState/AILoadingState';



export default function TrainingLogin({
    employeeId,
    setEmployeeId,
    password,
    setPassword,
    onBlurEmployeeId,
    error,
    loading,
    onSubmit,
    isSuccess
}) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] },
        }),
    };

    const employeeIdInputId = useId();
    const passwordInputId = useId();

    return (
        <div className={styles.container}>
            <div className={styles.backgroundGradient} />


            {/* Card de Login */}
            <motion.div
                className={styles.loginCard}
                initial="hidden"
                animate="visible"
            >
                {isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            padding: '40px 20px',
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <AILoadingState />
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className={styles.subtitle}
                            style={{ position: 'absolute', bottom: '40px', fontSize: '0.9rem' }}
                        >
                            Verificando asignaciones de cursos...
                        </motion.p>
                    </motion.div>
                ) : (
                    <>
                        <motion.div variants={fadeUpVariants} custom={0} className={styles.header}>
                            <div className={styles.iconWrapper}>
                                <GraduationCap className={styles.icon} />
                            </div>
                            <h1 className={styles.title}>Capacitación</h1>
                            <p className={styles.subtitle}>Portal de formación administrativa</p>
                        </motion.div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={styles.errorMessage}
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={onSubmit} className={styles.form}>
                            <motion.div variants={fadeUpVariants} custom={1} className={styles.inputGroup}>
                                <label htmlFor={employeeIdInputId} className={styles.label}>ID de Empleado</label>
                                <div className={styles.inputWrapper}>
                                    <User className={styles.inputIcon} aria-hidden="true" />
                                    <input
                                        id={employeeIdInputId}
                                        type="text"
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value)}
                                        onBlur={onBlurEmployeeId}
                                        className={styles.input}
                                        required
                                        disabled={loading}
                                        autoComplete="username"
                                        aria-label="ID de Empleado"
                                        placeholder="Ej: 12345"
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={fadeUpVariants} custom={2} className={styles.inputGroup}>
                                <label htmlFor={passwordInputId} className={styles.label}>Contraseña / Código</label>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.inputIcon} aria-hidden="true" />
                                    <input
                                        id={passwordInputId}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={styles.input}
                                        required
                                        disabled={loading}
                                        autoComplete="current-password"
                                        aria-label="Contraseña"
                                    />
                                </div>
                            </motion.div>

                            <motion.button
                                variants={fadeUpVariants}
                                custom={4}
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                aria-busy={loading}
                            >
                                {loading ? (
                                    <span className={styles.spinner} aria-hidden="true"></span>
                                ) : (
                                    'Ingresar al Portal'
                                )}
                            </motion.button>
                        </form>

                        <motion.div variants={fadeUpVariants} custom={5} className={styles.footer}>
                            <p className={styles.footerText}>
                                Innovando para tu crecimiento<br />
                                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>Sistema Vertx</span>
                            </p>
                        </motion.div>
                    </>
                )}
            </motion.div>

            <div className={styles.overlay} />
        </div>
    );
}
