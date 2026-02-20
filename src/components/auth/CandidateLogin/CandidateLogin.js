"use client";

import { useId, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, IdCard, Key, UserPlus, AlertCircle } from "lucide-react";
import baseStyles from '../LoginBase/LoginBase.module.css';
import componentStyles from './CandidateLogin.module.css';
import { mergeStyles } from '../LoginBase/mergeStyles';
import AILoadingState from '../../ui/AILoadingState/AILoadingState';
import { BackgroundLines } from '../../ui/BackgroundLines/BackgroundLines';
import { FADE_UP_LOGIN, CARD_ENTER, ERROR_VARIANTS, SUCCESS_ENTER } from '../LoginBase/loginAnimations';

const styles = mergeStyles(baseStyles, componentStyles);

// ==================== SUB-COMPONENTS ====================

/**
 * Input field with icon and accessibility
 */
function InputField({
    id,
    label,
    value,
    onChange,
    onBlur,
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
                    onBlur={onBlur}
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

export default function CandidateLogin({
    employeeId,
    onEmployeeIdChange,
    onEmployeeIdBlur,
    curp,
    onCurpChange,
    onCurpBlur,
    accessCode,
    onAccessCodeChange,
    error,
    loading,
    isBlocked,
    blockTimeRemaining,
    onSubmit,
    isSuccess,
    isFormValid
}) {
    const baseId = useId();
    const employeeIdInputId = `${baseId}-employeeId`;
    const curpInputId = `${baseId}-curp`;
    const accessCodeInputId = `${baseId}-accessCode`;
    const errorAlertId = `${baseId}-error`;

    const formattedBlockTime = useMemo(() => {
        return Math.ceil(blockTimeRemaining / 60);
    }, [blockTimeRemaining]);

    return (
        <div className={styles.container}>
            <BackgroundLines
                colors={["#10b981", "#14b8a6", "#059669", "#0d9488"]}
                style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5 }}
                svgOptions={{ duration: 10 }}
            />

            {/* Login Card */}
            <motion.div
                className={styles.loginCard}
                variants={CARD_ENTER}
                initial="hidden"
                animate="visible"
                role="main"
                aria-labelledby="login-title"
            >
                {isSuccess ? (
                    <motion.div
                        className={styles.successContainer}
                        {...SUCCESS_ENTER}
                        role="status"
                        aria-live="polite"
                        aria-label="Inicio de sesión exitoso, redirigiendo al dashboard"
                    >
                        <AILoadingState />
                    </motion.div>
                ) : (
                    <>
                        {/* Header */}
                        <motion.header variants={FADE_UP_LOGIN} custom={0} className={styles.header}>
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
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    key="error-msg"
                                    variants={ERROR_VARIANTS}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className={styles.errorMessage}
                                    role="alert"
                                    aria-live="assertive"
                                    id={errorAlertId}
                                >
                                    <AlertCircle size={18} aria-hidden="true" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Blocked Message */}
                        <AnimatePresence mode="wait">
                            {isBlocked && (
                                <motion.div
                                    key="blocked-msg"
                                    variants={ERROR_VARIANTS}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className={styles.blockedMessage}
                                    role="alert"
                                    aria-live="assertive"
                                >
                                    Demasiados intentos fallidos. Espera {formattedBlockTime} minutos.
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Login Form */}
                        <form
                            onSubmit={onSubmit}
                            className={styles.form}
                            noValidate
                            aria-describedby={error ? errorAlertId : undefined}
                        >
                            <motion.div variants={FADE_UP_LOGIN} custom={1}>
                                <InputField
                                    id={employeeIdInputId}
                                    label="ID de Empleado"
                                    value={employeeId}
                                    onChange={onEmployeeIdChange}
                                    onBlur={onEmployeeIdBlur}
                                    icon={User}
                                    disabled={loading || isBlocked}
                                    hasError={!!error}
                                    errorId={errorAlertId}
                                    placeholder="Ej: 3204"
                                    inputMode="numeric"
                                />
                            </motion.div>

                            <motion.div variants={FADE_UP_LOGIN} custom={2}>
                                <InputField
                                    id={curpInputId}
                                    label="CURP"
                                    value={curp}
                                    onChange={onCurpChange}
                                    onBlur={onCurpBlur}
                                    icon={IdCard}
                                    disabled={loading || isBlocked}
                                    maxLength={18}
                                    hasError={!!error}
                                    errorId={errorAlertId}
                                    placeholder="18 caracteres"
                                />
                            </motion.div>

                            <motion.div variants={FADE_UP_LOGIN} custom={3}>
                                <InputField
                                    id={accessCodeInputId}
                                    label="Código de Acceso"
                                    value={accessCode}
                                    onChange={onAccessCodeChange}
                                    icon={Key}
                                    disabled={loading || isBlocked}
                                    maxLength={6}
                                    hasError={!!error}
                                    errorId={errorAlertId}
                                    helperText="Código de 6 dígitos proporcionado por Recursos Humanos"
                                />
                            </motion.div>

                            <motion.button
                                variants={FADE_UP_LOGIN}
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
                        <motion.footer variants={FADE_UP_LOGIN} custom={5} className={styles.footer}>
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
