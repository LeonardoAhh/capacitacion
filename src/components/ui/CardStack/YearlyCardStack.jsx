"use client";

import styles from "./YearlyCardStack.module.css";

export default function YearlyCardStack({ stats, yearNumber, openDetails }) {
    // Definimos las estadísticas base
    const compliance = stats?.compliance || 0;
    const avancePlan = stats?.avancePlan || 0;
    const coursesCompleted = stats?.coursesCompleted || 0;
    const totalRequiredCourses = stats?.totalRequiredCourses || 0;

    // Función para determinar color del KPI principal
    const getScoreColorClass = (score) => {
        if (score >= 90) return styles.colorGreen;
        if (score >= 70) return styles.colorYellow;
        return styles.colorRed;
    };

    return (
        <div className={styles.flatCard}>
            {/* Header: Año y Botón de Detalles */}
            <div className={styles.header}>
                <h2 className={styles.yearTitle}>{yearNumber}</h2>
                <button 
                    onClick={() => openDetails(yearNumber)} 
                    className={styles.detailsBtn}
                    aria-label={`Ver detalles del año ${yearNumber}`}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Ver Cursos
                </button>
            </div>

            {/* Métrica Primaria: Colaboradores al 100% */}
            <div className={styles.primaryMetric}>
                <div className={styles.metricLabel}>Colaboradores al 100%</div>
                <div className={`${styles.mainPercentage} ${getScoreColorClass(compliance)}`}>
                    {compliance}%
                </div>
                <div className={styles.metricSubtext}>Matriz Oficial Cubierta</div>
            </div>

            <div className={styles.divider} />

            {/* Métrica Secundaria: Avance del Plan (Progreso y Conteo) */}
            <div className={styles.secondaryMetric}>
                <div className={styles.secondaryHeader}>
                    <span className={styles.metricLabelSmall}>Avance General del Plan</span>
                    <span className={styles.secondaryPercentage}>{avancePlan}%</span>
                </div>
                
                {/* Barra de Progreso */}
                <div className={styles.progressBarBg}>
                    <div 
                        className={styles.progressBarFill} 
                        style={{ width: `${Math.min(avancePlan, 100)}%`, backgroundColor: 'var(--c-primary)' }} 
                    />
                </div>

                {/* Especificaciones */}
                <div className={styles.specsRow}>
                    <div className={styles.spec}>
                        <span className={styles.specLabel}>Aprobados</span>
                        <strong className={styles.specValue}>{coursesCompleted}</strong>
                    </div>
                    <div className={styles.spec}>
                        <span className={styles.specLabel}>Total Esperado</span>
                        <strong className={styles.specValue}>{totalRequiredCourses}</strong>
                    </div>
                </div>
            </div>
            
        </div>
    );
}
