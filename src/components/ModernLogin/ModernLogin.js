"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Key, Shield } from "lucide-react";
import styles from './ModernLogin.module.css';

function ElegantShape({ className, delay = 0, width = 400, height = 100, rotate = 0, color, borderRadius = 16 }) {
    return (
        <motion.div
            animate={{ opacity: 1, y: 0, rotate }}
            className={className}
            initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            style={{ position: 'absolute', width: `${width}px`, height: `${height}px` }}
        >
            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${color}40, ${color}20)`,
                    borderRadius: `${borderRadius}px`,
                    backdropFilter: 'blur(1px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 2px 16px -2px rgba(255, 255, 255, 0.04)',
                }}
            />
        </motion.div>
    );
}

export default function ModernLogin({
    email,
    setEmail,
    password,
    setPassword,
    verificationCode,
    setVerificationCode,
    mfaRequired,
    error,
    loading,
    onSubmit,
    onMfaSubmit,
}) {
    const formRef = useRef(null);
    const mfaFormRef = useRef(null);

    // Auto-submit para login normal cuando ambos campos están completos
    useEffect(() => {
        if (!mfaRequired && email && password && !loading) {
            const timer = setTimeout(() => {
                if (formRef.current) {
                    formRef.current.requestSubmit();
                }
            }, 500); // Delay de 500ms para mejor UX
            return () => clearTimeout(timer);
        }
    }, [email, password, mfaRequired, loading]);

    // Auto-submit para MFA cuando código tiene 6 dígitos
    useEffect(() => {
        if (mfaRequired && verificationCode.length === 6 && !loading) {
            const timer = setTimeout(() => {
                if (mfaFormRef.current) {
                    mfaFormRef.current.requestSubmit();
                }
            }, 300); // Delay más corto para MFA
            return () => clearTimeout(timer);
        }
    }, [verificationCode, mfaRequired, loading]);

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] },
        }),
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundGradient} />

            {/* Formas animadas - solo 4 para no saturar */}
            <div className={styles.shapesContainer}>
                <ElegantShape className={styles.shape1} delay={0.2} width={250} height={400} rotate={-12} color="#6366f1" borderRadius={20} />
                <ElegantShape className={styles.shape2} delay={0.4} width={350} height={150} rotate={18} color="#8b5cf6" borderRadius={16} />
                <ElegantShape className={styles.shape3} delay={0.3} width={200} height={200} rotate={-25} color="#a855f7" borderRadius={24} />
                <ElegantShape className={styles.shape4} delay={0.5} width={300} height={120} rotate={15} color="#6366f1" borderRadius={12} />
            </div>

            {/* Card de Login */}
            <motion.div
                className={styles.loginCard}
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
                }}
            >
                <motion.div variants={fadeUpVariants} custom={0} className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Shield className={styles.icon} />
                    </div>
                    <h1 className={styles.title}>Bienvenido</h1>
                    <p className={styles.subtitle}>Acceso empleados</p>
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

                {!mfaRequired ? (
                    <form ref={formRef} onSubmit={onSubmit} className={styles.form}>
                        <motion.div variants={fadeUpVariants} custom={1} className={styles.inputGroup}>
                            <label className={styles.label}>Correo Electrónico</label>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={styles.input}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={fadeUpVariants} custom={2} className={styles.inputGroup}>
                            <label className={styles.label}>Contraseña</label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={styles.input}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </motion.div>

                        <motion.button
                            variants={fadeUpVariants}
                            custom={3}
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? (
                                <span className={styles.spinner}></span>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </motion.button>
                    </form>
                ) : (
                    <form ref={mfaFormRef} onSubmit={onMfaSubmit} className={styles.form}>
                        <motion.div variants={fadeUpVariants} custom={1} className={styles.inputGroup}>
                            <label className={styles.label}>Código de Verificación</label>
                            <div className={styles.inputWrapper}>
                                <Key className={styles.inputIcon} />
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className={styles.input}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            <p className={styles.helperText}>
                                Ingresa el código de 6 dígitos de tu aplicación de autenticación
                            </p>
                        </motion.div>

                        <motion.button
                            variants={fadeUpVariants}
                            custom={2}
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? (
                                <span className={styles.spinner}></span>
                            ) : (
                                'Verificar Código'
                            )}
                        </motion.button>
                    </form>
                )}
            </motion.div>

            <div className={styles.overlay} />
        </div>
    );
}
