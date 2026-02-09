"use client";

import { motion } from "framer-motion";
import { Mail, Lock, Shield } from "lucide-react";
import styles from './ModernLogin.module.css';
import AILoadingState from '../ui/AILoadingState/AILoadingState';



export default function ModernLogin({
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    onSubmit,
    onGoogleSignIn,
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
                            alignments: 'center',
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
                            Verificando credenciales de administrador...
                        </motion.p>
                    </motion.div>
                ) : (
                    <>
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

                        <form onSubmit={onSubmit} className={styles.form}>
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

                            <motion.div
                                variants={fadeUpVariants}
                                custom={4}
                                className={styles.divider}
                            >
                                <span>o continúa con</span>
                            </motion.div>

                            <motion.button
                                variants={fadeUpVariants}
                                custom={5}
                                type="button"
                                onClick={onGoogleSignIn}
                                className={styles.googleButton}
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {loading ? 'Iniciando...' : 'Continuar con Google'}
                            </motion.button>
                        </form>
                    </>
                )}
            </motion.div>

            <div className={styles.overlay} />
        </div>
    );
}
