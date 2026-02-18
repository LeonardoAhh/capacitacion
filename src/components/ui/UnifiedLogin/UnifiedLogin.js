'use client';

import { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import styles from './UnifiedLogin.module.css';

const ANIMATION_VARIANTS = {
    fade: {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.3 },
    },
};

function InputField({
    id,
    label,
    type = 'text',
    value,
    onChange,
    onBlur,
    placeholder,
    disabled,
    maxLength,
    helperText,
    hasError,
    autoComplete,
    inputMode,
}) {
    return (
        <div className={styles.inputGroup}>
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                autoComplete={autoComplete}
                inputMode={inputMode}
                className={`${styles.input} ${hasError ? styles.inputError : ''}`}
                aria-invalid={hasError ? 'true' : 'false'}
                aria-describedby={helperText ? `${id}-helper` : undefined}
            />
            {helperText && (
                <p id={`${id}-helper`} className={styles.helperText}>
                    {helperText}
                </p>
            )}
        </div>
    );
}

export default function UnifiedLogin({
    portal,
    title,
    subtitle,
    fields = [],
    error,
    loading,
    blocked,
    blockedMessage,
    onSubmit,
    submitText = 'Acceder',
    isSuccess,
    successContent,
    showGoogle = false,
    onGoogleSignIn,
    googleLoading,
    footerContent,
    backHref = '/',
    backLabel = 'Volver',
}) {
    const baseId = useId();
    const errorId = `${baseId}-error`;

    const isDisabled = loading || blocked;

    return (
        <div className={styles.loginPage}>
            <BackButton href={backHref} label={backLabel} />

            <div className={styles.loginCard}>
                {isSuccess ? (
                    <motion.div
                        className={styles.successContainer}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {successContent || (
                            <>
                                <Loader2 className={styles.spinner} size={32} />
                                <h2 className={styles.successTitle}>Verificando...</h2>
                                <p className={styles.successText}>Redirigiendo</p>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <>
                        <header className={styles.header}>
                            {portal && <span className={styles.portal}>{portal}</span>}
                            <h1 className={styles.title}>{title}</h1>
                            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                        </header>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    key="error"
                                    {...ANIMATION_VARIANTS.fade}
                                    className={styles.errorMessage}
                                    role="alert"
                                    aria-live="assertive"
                                    id={errorId}
                                >
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {blocked && blockedMessage && (
                                <motion.div
                                    key="blocked"
                                    {...ANIMATION_VARIANTS.fade}
                                    className={styles.blockedMessage}
                                    role="alert"
                                    aria-live="assertive"
                                >
                                    {blockedMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={onSubmit} className={styles.form} noValidate>
                            {fields.map((field, index) => (
                                <InputField
                                    key={field.id || `${baseId}-field-${index}`}
                                    id={field.id || `${baseId}-field-${index}`}
                                    label={field.label}
                                    type={field.type || 'text'}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    placeholder={field.placeholder}
                                    disabled={isDisabled}
                                    maxLength={field.maxLength}
                                    helperText={field.helperText}
                                    hasError={!!error}
                                    autoComplete={field.autoComplete}
                                    inputMode={field.inputMode}
                                />
                            ))}

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isDisabled}
                                aria-busy={loading}
                            >
                                {loading ? (
                                    <span className={styles.spinner} aria-hidden="true" />
                                ) : (
                                    submitText
                                )}
                            </button>
                        </form>

                        {showGoogle && (
                            <>
                                <div className={styles.divider}>
                                    <span className={styles.dividerLine} />
                                    <span className={styles.dividerText}>o</span>
                                    <span className={styles.dividerLine} />
                                </div>

                                <button
                                    type="button"
                                    onClick={onGoogleSignIn}
                                    className={styles.googleButton}
                                    disabled={isDisabled || googleLoading}
                                >
                                    <svg className={styles.googleIcon} viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {googleLoading ? 'Conectando...' : 'Continuar con Google'}
                                </button>
                            </>
                        )}

                        {footerContent && (
                            <footer className={styles.footer}>
                                {footerContent}
                            </footer>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export { InputField };
