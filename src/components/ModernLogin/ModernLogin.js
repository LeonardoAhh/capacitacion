"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Shield, AlertTriangle } from "lucide-react";
import { useId } from "react";
import baseStyles from '../ui/LoginBase/LoginBase.module.css';
import componentStyles from './ModernLogin.module.css';
import { mergeStyles } from '../ui/LoginBase/mergeStyles';
import AILoadingState from '../ui/AILoadingState/AILoadingState';
import { BackgroundLines } from '../ui/BackgroundLines/BackgroundLines';
import { FADE_UP_LOGIN, CARD_ENTER, ERROR_VARIANTS, SUCCESS_ENTER } from '../ui/LoginBase/loginAnimations';

const styles = mergeStyles(baseStyles, componentStyles);

export default function ModernLogin({
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    onSubmit,
    onGoogleSignIn,
    isSuccess,
    onSuccessComplete,
    rateLimitInfo,
}) {
    const emailId = useId();
    const passwordId = useId();

    return (
        <div className={styles.container}>
            <BackgroundLines
                colors={["#6366f1", "#8b5cf6", "#4f46e5", "#7c3aed"]}
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
                        <AILoadingState
                            interval={1000}
                            texts={[
                                "Verificando credenciales...",
                                "Validando acceso...",
                                "Iniciando sesión...",
                                "Preparando entorno...",
                                "¡Bienvenido!"
                            ]}
                            onComplete={onSuccessComplete}
                        />
                    </motion.div>
                ) : (
                    <>
                        <motion.div variants={FADE_UP_LOGIN} custom={0} className={styles.header}>
                            <div className={styles.iconWrapper}>
                                <Shield className={styles.icon} />
                            </div>
                            <h1 className={styles.title}>Bienvenido</h1>
                            <p className={styles.subtitle}>Acceso empleados</p>
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

                        {rateLimitInfo?.isBlocked && (
                            <motion.div
                                className={styles.rateLimitBanner}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <AlertTriangle size={18} aria-hidden="true" />
                                <span>
                                    Demasiados intentos. Espera{' '}
                                    <strong>{rateLimitInfo.remainingSeconds}s</strong>{' '}
                                    para intentar de nuevo.
                                </span>
                            </motion.div>
                        )}

                        <form onSubmit={onSubmit} className={styles.form}>
                            <motion.div variants={FADE_UP_LOGIN} custom={1} className={styles.inputGroup}>
                                <label htmlFor={emailId} className={styles.label}>Correo Electrónico</label>
                                <div className={styles.inputWrapper}>
                                    <Mail className={styles.inputIcon} aria-hidden="true" />
                                    <input
                                        id={emailId}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={styles.input}
                                        required
                                        disabled={loading || rateLimitInfo?.isBlocked}
                                        autoComplete="email"
                                        aria-label="Correo Electrónico"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={FADE_UP_LOGIN} custom={2} className={styles.inputGroup}>
                                <label htmlFor={passwordId} className={styles.label}>Contraseña</label>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.inputIcon} aria-hidden="true" />
                                    <input
                                        id={passwordId}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={styles.input}
                                        required
                                        disabled={loading || rateLimitInfo?.isBlocked}
                                        autoComplete="current-password"
                                        aria-label="Contraseña"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </motion.div>

                            <motion.button
                                variants={FADE_UP_LOGIN}
                                custom={3}
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading || rateLimitInfo?.isBlocked}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                aria-busy={loading}
                            >
                                {loading ? (
                                    <span className={styles.spinner} aria-hidden="true"></span>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </motion.button>

                            <motion.div
                                variants={FADE_UP_LOGIN}
                                custom={4}
                                className={styles.divider}
                            >
                                <span>o continúa con</span>
                            </motion.div>

                            <motion.button
                                variants={FADE_UP_LOGIN}
                                custom={5}
                                type="button"
                                onClick={onGoogleSignIn}
                                className={styles.googleButton}
                                disabled={loading || rateLimitInfo?.isBlocked}
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
