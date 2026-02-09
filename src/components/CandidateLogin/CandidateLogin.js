"use client";

import { useId, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { User, IdCard, Key, UserPlus, AlertCircle } from "lucide-react";
import styles from './CandidateLogin.module.css';
import AILoadingState from '../ui/AILoadingState/AILoadingState';

// ==================== CONSTANTS ====================
const ANIMATION_CONFIG = {
    duration: 2.4,
    ease: [0.23, 0.86, 0.39, 0.96],
    opacityDuration: 1.2,
    floatDuration: 12
};

const SHAPE_CONFIG = [
    { className: 'shape1', delay: 0.2, width: 250, height: 400, rotate: -12, color: "#10b981", borderRadius: 20 },
    { className: 'shape2', delay: 0.4, width: 350, height: 150, rotate: 18, color: "#14b8a6", borderRadius: 16 },
    { className: 'shape3', delay: 0.3, width: 200, height: 200, rotate: -25, color: "#06b6d4", borderRadius: 24 },
    { className: 'shape4', delay: 0.5, width: 300, height: 120, rotate: 15, color: "#3b82f6", borderRadius: 12 }
];

// ==================== SUB-COMPONENTS ====================

/**
 * Animated decorative shape component
 */


/**
 * Input field with icon and accessibility
 */
function InputField({
    id,
    label,
    value,
    onChange,
    icon: Icon,
    disabled,
    maxLength,
    placeholder,
    helperText,
    hasError,
    errorId,
    autoComplete = "off",
    inputMode = "text"
}) {
    return (
        <div className={styles.inputGroup}>
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
            <div className={styles.inputWrapper}>
                <Icon className={styles.inputIcon} aria-hidden="true" />
                <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={onChange}
                    className={`${styles.input} ${hasError ? styles.inputError : ''}`}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    required
                    disabled={disabled}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? errorId : helperText ? `${id}-helper` : undefined}
                />
            </div>
            {helperText && (
                <p id={`${id}-helper`} className={styles.helperText}>
                    {helperText}
                </p>
            )}
        </div>
    );
}

// ==================== MAIN COMPONENT ====================

/**
 * CandidateLogin Component
 * Login form for candidate onboarding portal
 */
export default function CandidateLogin({
    employeeId,
    setEmployeeId,
    curp,
    setCurp,
    accessCode,
    setAccessCode,
    error,
    loading,
    isBlocked,
    blockTimeRemaining,
    onSubmit,
    isSuccess,
    isFormValid
}) {
    // Generate unique IDs for accessibility
    const baseId = useId();
    const employeeIdInputId = `${baseId}-employeeId`;
    const curpInputId = `${baseId}-curp`;
    const accessCodeInputId = `${baseId}-accessCode`;
    const errorAlertId = `${baseId}-error`;

    // Memoized animation variants
    const fadeUpVariants = useMemo(() => ({
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] },
        }),
    }), []);

    // Format block time for display
    const formattedBlockTime = useMemo(() => {
        return Math.ceil(blockTimeRemaining / 60);
    }, [blockTimeRemaining]);

    // Handle keyboard submit
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !loading && !isBlocked) {
            onSubmit(e);
        }
    }, [onSubmit, loading, isBlocked]);

    return (
        <div className={styles.container}>
            <div className={styles.backgroundGradient} aria-hidden="true" />

            <div className={styles.backgroundGradient} aria-hidden="true" />


            {/* Login Card */}
            <motion.div
                className={styles.loginCard}
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
                }}
                role="main"
                aria-labelledby="login-title"
            >
                {isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className={styles.successContainer}
                        role="status"
                        aria-live="polite"
                        aria-label="Inicio de sesión exitoso, redirigiendo al dashboard"
                    >
                        <AILoadingState />
                    </motion.div>
                ) : (
                    <>
                        {/* Header */}
                        <motion.header variants={fadeUpVariants} custom={0} className={styles.header}>
                            <div className={styles.iconWrapper} aria-hidden="true">
                                <UserPlus className={styles.icon} />
                            </div>
                            <h1 id="login-title" className={styles.title}>
                                Portal de Candidatos
                            </h1>
                            <p className={styles.subtitle}>
                                Bienvenido a tu proceso de inducción
                            </p>
                        </motion.header>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={styles.errorMessage}
                                role="alert"
                                aria-live="assertive"
                                id={errorAlertId}
                            >
                                <AlertCircle size={18} aria-hidden="true" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Blocked Message */}
                        {isBlocked && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={styles.blockedMessage}
                                role="alert"
                                aria-live="assertive"
                            >
                                Demasiados intentos fallidos. Espera {formattedBlockTime} minutos.
                            </motion.div>
                        )}

                        {/* Login Form */}
                        <form
                            onSubmit={onSubmit}
                            className={styles.form}
                            noValidate
                            aria-describedby={error ? errorAlertId : undefined}
                        >
                            <motion.div variants={fadeUpVariants} custom={1}>
                                <InputField
                                    id={employeeIdInputId}
                                    label="ID de Empleado"
                                    value={employeeId}
                                    onChange={setEmployeeId}
                                    icon={User}
                                    disabled={loading || isBlocked}
                                    hasError={!!error}
                                    errorId={errorAlertId}
                                    placeholder="Ej: 3204"
                                    inputMode="numeric"
                                />
                            </motion.div>

                            <motion.div variants={fadeUpVariants} custom={2}>
                                <InputField
                                    id={curpInputId}
                                    label="CURP"
                                    value={curp}
                                    onChange={setCurp}
                                    icon={IdCard}
                                    disabled={loading || isBlocked}
                                    maxLength={18}
                                    hasError={!!error}
                                    errorId={errorAlertId}
                                    placeholder="18 caracteres"
                                />
                            </motion.div>

                            <motion.div variants={fadeUpVariants} custom={3}>
                                <InputField
                                    id={accessCodeInputId}
                                    label="Código de Acceso"
                                    value={accessCode}
                                    onChange={setAccessCode}
                                    icon={Key}
                                    disabled={loading || isBlocked}
                                    maxLength={6}
                                    hasError={!!error}
                                    errorId={errorAlertId}
                                    helperText="Código de 6 dígitos proporcionado por Recursos Humanos"
                                />
                            </motion.div>

                            <motion.button
                                variants={fadeUpVariants}
                                custom={4}
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading || isBlocked}
                                whileHover={!loading && !isBlocked ? { scale: 1.02 } : {}}
                                whileTap={!loading && !isBlocked ? { scale: 0.98 } : {}}
                                aria-busy={loading}
                                aria-disabled={loading || isBlocked}
                            >
                                {loading ? (
                                    <span className={styles.spinner} aria-hidden="true" />
                                ) : (
                                    'Acceder'
                                )}
                                {loading && <span className="sr-only">Cargando...</span>}
                            </motion.button>
                        </form>

                        {/* Footer */}
                        <motion.footer variants={fadeUpVariants} custom={5} className={styles.footer}>
                            <p className={styles.footerText}>
                                ¿Problemas para acceder?
                            </p>
                            <a
                                href="https://wa.me/524211265940"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappLink}
                                aria-label="Contactar soporte por WhatsApp"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                </svg>
                                WhatsApp
                            </a>
                        </motion.footer>
                    </>
                )}
            </motion.div>

            <div className={styles.overlay} aria-hidden="true" />
        </div>
    );
}
