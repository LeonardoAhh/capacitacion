"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { User, IdCard, Key, UserPlus } from "lucide-react";
import styles from './CandidateLogin.module.css';
import AILoadingState from '../ui/AILoadingState/AILoadingState';

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

            {/* Formas animadas - colores emerald/teal/cyan/blue */}
            <div className={styles.shapesContainer}>
                <ElegantShape className={styles.shape1} delay={0.2} width={250} height={400} rotate={-12} color="#10b981" borderRadius={20} />
                <ElegantShape className={styles.shape2} delay={0.4} width={350} height={150} rotate={18} color="#14b8a6" borderRadius={16} />
                <ElegantShape className={styles.shape3} delay={0.3} width={200} height={200} rotate={-25} color="#06b6d4" borderRadius={24} />
                <ElegantShape className={styles.shape4} delay={0.5} width={300} height={120} rotate={15} color="#3b82f6" borderRadius={12} />
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
                    </motion.div>
                ) : (
                    <>
                        <motion.div variants={fadeUpVariants} custom={0} className={styles.header}>
                            <div className={styles.iconWrapper}>
                                <UserPlus className={styles.icon} />
                            </div>
                            <h1 className={styles.title}>Portal de Candidatos</h1>
                            <p className={styles.subtitle}>
                                Bienvenido a tu proceso de inducción
                                <br />
                                <span style={{ fontSize: '0.85em', opacity: 0.8, marginTop: '8px', display: 'inline-block' }}>
                                    Tienes 10 intentos. Después de 10 intentos fallidos serás bloqueado por 15 minutos.
                                </span>
                            </p>
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

                        {isBlocked && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={styles.blockedMessage}
                            >
                                Demasiados intentos fallidos. Espera {Math.ceil(blockTimeRemaining / 60)} minutos.
                            </motion.div>
                        )}

                        <form onSubmit={onSubmit} className={styles.form}>
                            <motion.div variants={fadeUpVariants} custom={1} className={styles.inputGroup}>
                                <label className={styles.label}>ID de Empleado</label>
                                <div className={styles.inputWrapper}>
                                    <User className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                        className={styles.input}
                                        required
                                        disabled={loading || isBlocked}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={fadeUpVariants} custom={2} className={styles.inputGroup}>
                                <label className={styles.label}>CURP</label>
                                <div className={styles.inputWrapper}>
                                    <IdCard className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        value={curp}
                                        onChange={(e) => setCurp(e.target.value.toUpperCase())}
                                        className={styles.input}
                                        maxLength={18}
                                        required
                                        disabled={loading || isBlocked}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={fadeUpVariants} custom={3} className={styles.inputGroup}>
                                <label className={styles.label}>Código de Acceso</label>
                                <div className={styles.inputWrapper}>
                                    <Key className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        className={styles.input}
                                        placeholder="Proporcionado por RRHH"
                                        maxLength={6}
                                        required
                                        disabled={loading || isBlocked}
                                    />
                                </div>
                                <p className={styles.helperText}>
                                    Código proporcionado por Recursos Humanos
                                </p>
                            </motion.div>

                            <motion.button
                                variants={fadeUpVariants}
                                custom={4}
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading || isBlocked}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <span className={styles.spinner}></span>
                                ) : (
                                    'Acceder'
                                )}
                            </motion.button>
                        </form>

                        <motion.div variants={fadeUpVariants} custom={5} className={styles.footer}>
                            <p className={styles.footerText}>
                                ¿Problemas para acceder?<br />
                                <a
                                    href="https://wa.me/524211265940"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: '#25D366',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        marginTop: '8px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
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
                                    >
                                        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                    </svg>
                                    WhatsApp
                                </a>
                            </p>
                        </motion.div>
                    </>
                )}
            </motion.div>

            <div className={styles.overlay} />
        </div>
    );
}
