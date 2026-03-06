import React, { useMemo } from 'react';
import { checkPromotionCriteria, normalizePromotionRule } from '@/lib/promotionUtils';
import { Users, Rocket, Construction } from 'lucide-react';
import styles from './PromotionsDashboard.module.css';

export default function PromotionsDashboard({ employees, promotionRules, children }) {
    const stats = useMemo(() => {
        let totalValidos = 0;
        let aptos = 0;

        const fallos = {
            desempeno: 0,
            temporalidad: 0,
            matriz: 0,
            examen: 0
        };

        employees.forEach(emp => {
            const rawRule = promotionRules.find(r => r.currentPosition === emp.position);
            if (!rawRule) return; // They don't have a promotion path

            const rule = normalizePromotionRule(rawRule);
            totalValidos++;

            // Use the authoritative function for calculations
            const criteria = checkPromotionCriteria(emp, rule);

            if (criteria.overall.eligible) {
                aptos++;
            } else {
                if (!criteria.exam.met) fallos.examen++;
                if (!criteria.matrix.met) fallos.matriz++;
                if (!criteria.temporality.met) fallos.temporalidad++;
                if (!criteria.performance.met) fallos.desempeno++;
            }
        });

        // Determine main bottleneck
        let maxFallo = 'Ninguno';
        let maxCount = 0;
        Object.entries(fallos).forEach(([key, value]) => {
            if (value > maxCount) {
                maxCount = value;
                maxFallo = key;
            }
        });

        const cuelloDeBotella = maxCount === 0 ? "Todo fluyendo" :
            maxFallo === 'examen' ? 'Examen Teórico' :
                maxFallo === 'matriz' ? 'Cobertura Matriz' :
                    maxFallo === 'temporalidad' ? 'Tiempo en Puesto' : 'Eval. Desempeño';

        return {
            total: totalValidos,
            aptos,
            pendientes: totalValidos - aptos,
            porcentajeAptitud: totalValidos > 0 ? Math.round((aptos / totalValidos) * 100) : 0,
            cuelloDeBotella,
            cuelloValor: maxCount
        };
    }, [employees, promotionRules]);


    return (
        <div className={styles.dashboardContainer}>
            <div className={`${styles.statCard} ${styles.blueCard}`}>
                <div className={`${styles.statIcon} ${styles.blueIcon}`}>
                    <Users size={20} strokeWidth={2.5} />
                </div>
                <div className={styles.statContent}>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statLabel}>Total en Proceso</span>
                    <span className={styles.statDesc}>Empleados con ruta de promoción</span>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.greenCard}`}>
                <div className={`${styles.statIcon} ${styles.greenIcon}`}>
                    <Rocket size={20} strokeWidth={2.5} />
                </div>
                <div className={styles.statContent}>
                    <div className={styles.statValueRow}>
                        <span className={styles.statValue}>{stats.porcentajeAptitud}%</span>
                        <div className={styles.pillBadge}>{stats.aptos} Listos</div>
                    </div>
                    <span className={styles.statLabel}>Tasa de Aptitud</span>
                    <div className={styles.miniProgressBar}>
                        <div className={styles.miniProgressFill} style={{ width: `${stats.porcentajeAptitud}%` }} />
                    </div>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.orangeCard}`}>
                <div className={`${styles.statIcon} ${styles.orangeIcon}`}>
                    <Construction size={20} strokeWidth={2.5} />
                </div>
                <div className={styles.statContent}>
                    <span className={styles.statValueText}>{stats.cuelloDeBotella}</span>
                    <span className={styles.statLabel}>Principal Bloqueo</span>
                    <span className={styles.statDesc}>Frena a {stats.cuelloValor} personas</span>
                </div>
            </div>

            {children && (
                <div className={styles.dashboardActions}>
                    {children}
                </div>
            )}
        </div>
    );
}
