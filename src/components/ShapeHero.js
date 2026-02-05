"use client";

import { motion } from "framer-motion";
import { Pacifico } from "next/font/google";
import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import styles from './ShapeHero.module.css';

const pacifico = Pacifico({
    subsets: ["latin"],
    weight: ["400"],
});

function ElegantShape({ className, delay = 0, width = 400, height = 100, rotate = 0, color, borderRadius = 16 }) {
    return (
        <motion.div
            animate={{
                opacity: 1,
                y: 0,
                rotate,
            }}
            className={className}
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            style={{
                position: 'absolute',
                width: `${width}px`,
                height: `${height}px`,
            }}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
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

export default function ShapeHero() {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1],
            },
        }),
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundGradient} />

            <div className={styles.shapesContainer}>
                {/* Formas animadas */}
                <ElegantShape
                    className={styles.shape1}
                    delay={0.3}
                    width={300}
                    height={500}
                    rotate={-8}
                    color="#6366f1"
                    borderRadius={24}
                />
                <ElegantShape
                    className={styles.shape2}
                    delay={0.5}
                    width={600}
                    height={200}
                    rotate={15}
                    color="#f43f5e"
                    borderRadius={20}
                />
                <ElegantShape
                    className={styles.shape3}
                    delay={0.4}
                    width={300}
                    height={300}
                    rotate={24}
                    color="#8b5cf6"
                    borderRadius={32}
                />
                <ElegantShape
                    className={styles.shape4}
                    delay={0.6}
                    width={250}
                    height={100}
                    rotate={-20}
                    color="#f59e0b"
                    borderRadius={12}
                />
                <ElegantShape
                    className={styles.shape5}
                    delay={0.7}
                    width={400}
                    height={150}
                    rotate={35}
                    color="#10b981"
                    borderRadius={16}
                />
                <ElegantShape
                    className={styles.shape6}
                    delay={0.2}
                    width={200}
                    height={200}
                    rotate={-25}
                    color="#3b82f6"
                    borderRadius={28}
                />
                <ElegantShape
                    className={styles.shape7}
                    delay={0.8}
                    width={150}
                    height={80}
                    rotate={45}
                    color="#a855f7"
                    borderRadius={10}
                />
                <ElegantShape
                    className={styles.shape8}
                    delay={0.9}
                    width={450}
                    height={120}
                    rotate={-12}
                    color="#14b8a6"
                    borderRadius={18}
                />
            </div>

            <div className={styles.content}>
                <div className={styles.textCenter}>
                    <motion.div
                        animate="visible"
                        custom={1}
                        initial="hidden"
                        variants={fadeUpVariants}
                    >
                        <h1 className={styles.title}>
                            <span className={styles.mainTitle}>VIÑOPLASTIC</span>
                            <br />
                            <span className={`${styles.subtitle} ${pacifico.className}`}>
                                Planta Querétaro
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        animate="visible"
                        custom={3}
                        initial="hidden"
                        variants={fadeUpVariants}
                        className={styles.buttonsContainer}
                    >
                        <Link href="/login" className={styles.primaryButton}>
                            <Users className={styles.buttonIcon} />
                            <span>Empleados</span>
                        </Link>

                        <Link href="/candidatos" className={styles.secondaryButton}>
                            <UserPlus className={styles.buttonIcon} />
                            <span>Candidatos</span>
                        </Link>
                    </motion.div>
                </div>
            </div>

            <div className={styles.overlay} />
        </div>
    );
}
