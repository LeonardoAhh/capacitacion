"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import styles from "./YearlyCardStack.module.css";

const Card = ({ metric, index, totalCards, isExpanded, yearNumber, openDetails }) => {
    // Calculamos el centro de las cartas apiladas
    const centerOffset = (totalCards - 1) * 5;

    // Posición comprimida (stacks)
    const defaultX = index * 8 - centerOffset;
    const defaultY = index * 4;
    const defaultRotate = index * 2;
    const defaultScale = 1;

    // Posición expandida
    const cardWidth = 280;
    const cardGap = 20; // Transformamos el overlap en gap
    const totalExpandedWidth = cardWidth * totalCards + cardGap * (totalCards - 1);
    const expandedCenterOffset = totalExpandedWidth / 2;

    const spreadX = index * (cardWidth + cardGap) - expandedCenterOffset + cardWidth / 2;
    const spreadY = 0;
    const spreadRotate = index * 2 - (totalCards - 1);
    const spreadScale = 1;

    // Función para determinar color según el score
    const getScoreColorClass = (score) => {
        if (score >= 90) return styles.colorGreen;
        if (score >= 70) return styles.colorYellow;
        return styles.colorRed;
    };

    return (
        <motion.div
            animate={{
                x: isExpanded ? spreadX : defaultX,
                y: isExpanded ? spreadY : defaultY,
                rotate: isExpanded ? spreadRotate : defaultRotate,
                scale: isExpanded ? spreadScale : defaultScale,
                zIndex: totalCards - index,
            }}
            initial={{
                x: defaultX,
                y: defaultY,
                rotate: defaultRotate,
                scale: defaultScale,
            }}
            transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
                mass: 0.8,
            }}
            className={styles.card}
        >
            <div className={styles.cardContent}>

                {/* Header: Año y Badge */}
                <div className={styles.header}>
                    <div className={styles.yearNumber}>{yearNumber}</div>
                    <div className={styles.badge}>
                        {metric.badge}
                    </div>
                </div>

                {/* Main Metric Value */}
                <div className={styles.mainMetric}>
                    <h2 className={styles.metricTitle}>{metric.title}</h2>
                    <div className={styles.metricValueContainer}>
                        <span className={`${styles.metricPercentage} ${getScoreColorClass(metric.percentage)}`}>
                            {metric.percentage}%
                        </span>
                        <span className={styles.metricSubtext}>
                            {metric.subtext}
                        </span>
                    </div>
                </div>

                {/* Footer Specifications */}
                <div className={styles.specsGrid}>
                    {metric.specs.map((spec, i) => (
                        <div key={i} className={styles.specItem}>
                            <span className={styles.specLabel} title={spec.label}>{spec.label}</span>
                            <span className={styles.specValue}>{spec.value}</span>
                        </div>
                    ))}
                </div>

                {/* Details Button */}
                {isExpanded && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openDetails(yearNumber);
                        }}
                        className={styles.detailsBtn}
                    >
                        Ver Detalles
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default function YearlyCardStack({ stats, yearNumber, openDetails }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Definimos las cartas basadas en las estadísticas de este año
    const metrics = [
        {
            id: 'opcion-a',
            badge: 'Opción A',
            title: 'Empleados al 100%',
            percentage: stats?.compliance || 0,
            subtext: 'Matriz Cubierta',
            specs: []
        },
        {
            id: 'opcion-b',
            badge: 'Opción B',
            title: 'Avance del Plan',
            percentage: stats?.avancePlan || 0,
            subtext: 'Volumen Total',
            specs: [
                { label: "Aprobados", value: stats?.coursesCompleted || 0 },
                { label: "Total Esperado", value: stats?.totalRequiredCourses || 0 }
            ]
        }
    ];

    const handleToggle = () => setIsExpanded(!isExpanded);

    return (
        <div className={styles.cardStackContainer}>
            <div
                aria-label="Toggle card stack"
                className={styles.cardStackButton}
                onClick={handleToggle}
                role="button"
                tabIndex={0}
            >
                {metrics.map((metric, index) => (
                    <Card
                        key={metric.id}
                        index={index}
                        isExpanded={isExpanded}
                        metric={metric}
                        totalCards={metrics.length}
                        yearNumber={yearNumber}
                        openDetails={openDetails}
                    />
                ))}
            </div>
            <p className={styles.instructionText}>
                {isExpanded ? "Haz clic para apilar las tarjetas" : "Haz clic para expandir las métricas"}
            </p>
        </div>
    );
}
