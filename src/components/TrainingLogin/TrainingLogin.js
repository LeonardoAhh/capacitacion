"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, GraduationCap } from "lucide-react";
import { useId } from "react";
import baseStyles from '../ui/LoginBase/LoginBase.module.css';
import componentStyles from './TrainingLogin.module.css';
import { mergeStyles } from '../ui/LoginBase/mergeStyles';
import AILoadingState from '../ui/AILoadingState/AILoadingState';
import { BackgroundLines } from '../ui/BackgroundLines/BackgroundLines';
import { FADE_UP_LOGIN, CARD_ENTER, ERROR_VARIANTS, SUCCESS_ENTER } from '../ui/LoginBase/loginAnimations';

const styles = mergeStyles(baseStyles, componentStyles);

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
    const employeeIdInputId = useId();
    const passwordInputId = useId();

    return (
        <div className={styles.container}>
            <BackgroundLines
                colors={["#ec4899", "#d946ef", "#8b5cf6", "#a855f7"]}
                style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5 }}
                svgOptions={{ duration: 10 }}
            />

            {/* Card de Login */}
            <motion.div
                className={styles.loginCard}
                variants={CARD_ENTER}
                initial="hidden"
                animate="visible"
            >
                {isSuccess ? (
                    <motion.div
                        className={styles.successContainer}
                        {...SUCCESS_ENTER}
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
                        <motion.div variants={FADE_UP_LOGIN} custom={0} className={styles.header}>
                            <div className={styles.iconWrapper}>
                                <GraduationCap className={styles.icon} />
                            </div>
                            <h1 className={styles.title}>Capacitación</h1>
                            <p className={styles.subtitle}>Portal de formación administrativa</p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    key="error-msg"
                                    variants={ERROR_VARIANTS}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className={styles.errorMessage}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={onSubmit} className={styles.form}>
                            <motion.div variants={FADE_UP_LOGIN} custom={1} className={styles.inputGroup}>
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

                            <motion.div variants={FADE_UP_LOGIN} custom={2} className={styles.inputGroup}>
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
                                variants={FADE_UP_LOGIN}
                                custom={3}
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

                        <motion.div variants={FADE_UP_LOGIN} custom={4} className={styles.footer}>
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
