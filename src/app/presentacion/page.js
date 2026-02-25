'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import styles from './page.module.css';

// Import local logic files
import matrizRaw from '@/data/matriz.json';
import instCurRaw from '@/data/inst_cur.json';

// Constants
const userCourses = [
    "ALERTAS DE CALIDAD Y CATÁLOGO DE FALLAS", "ASPECTOS E IMPACTOS AMBIENTALES", "AUDITORÍAS DE PROCESO EN CAPAS",
    "COLADA CALIENTE", "CONOCIMIENTO SOBRE LA LEY FEDERAL DEL TRABAJO", "MANEJO DE MATERIAL NO CONFORME",
    "CONTROL DE CONTRATISTAS", "ESTRUCTURA DEL SGI Y DOCUMENTOS", "FAMILIAS DEL PRODUCTO", "INDUCCIÓN A LA EMPRESA",
    "INSTRUCCIONES DE TRABAJO", "ISO 14001:2015", "DIAGRAMA DE TORTUGA", "MATRIZ DE RIESGOS", "METODOLOGÍA 5S",
    "NOM-004-STPS-1999", "NOM-005-STPS-1998", "NOM-009-STPS-2011", "NOM-035-STPS-2018",
    "OBJETIVOS DEL SGI, ASPECTOS E IMPACTOS AMBIENTALES", "PARA OPERADORES DE MÁQUINA", "PREVENCIÓN DE LA VIOLENCIA LABORAL",
    "REPORTE DE PRODUCCIÓN", "SEGURIDAD Y PREVENCIÓN DE ACCIDENTES", "SEPARACIÓN DE RESIDUOS", "SISTEMA DE GESTIÓN INTEGRAL",
    "TRAZABILIDAD DEL PRODUCTO", "VDA 6.5 AUDITORÍAS DE PRODUCTO", "LIDERAZGO", "COMUNICACIÓN ASERTIVA", "ESCUCHA EFECTIVA", "REUNIONES EFECTIVAS",
    "GESTIÓN DE EQUIPOS MULTICULTURALES", "INSPECCIÓN VISUAL", "NOM-026-STPS-2008", "IT-PRO-009", "IDENTIFICACIÓN HOUSING"
];

const normalize = (str) => str?.trim().toUpperCase() || '';
const normalizeForMatch = (str) =>
    normalize(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim();

const normalizedUserCourses = userCourses.map(c => normalizeForMatch(c));

export default function PresentacionPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(1);

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    useEffect(() => {
        const analyzeData = async () => {
            try {
                // 1. Matriz de Puestos
                const matrixMap = new Map(); // position -> string[]
                matrizRaw.forEach(item => {
                    const pos = item.position?.toUpperCase().trim();
                    const course = item.requiredCourses?.trim();
                    if (pos && course) {
                        if (!matrixMap.has(pos)) matrixMap.set(pos, []);
                        matrixMap.get(pos).push(course);
                    }
                });

                // 2. Traer Registros (que ya contienen a todos los empleados activos)
                const trainingSnapshot = await getDocs(query(collection(db, "training_records")));

                const dashboardRecords = [];
                trainingSnapshot.forEach(doc => {
                    dashboardRecords.push({ id: doc.id, ...doc.data() });
                });

                // 3. Puestos 100%
                const positionsFulfilling100 = [];
                for (const [pos, courses] of matrixMap.entries()) {
                    let fulfills = true;
                    for (const c of courses) {
                        if (!normalizedUserCourses.includes(normalizeForMatch(c))) {
                            fulfills = false;
                            break;
                        }
                    }
                    if (fulfills) positionsFulfilling100.push(pos);
                }

                const requiredByMatrixNormalized = new Set();
                for (const courses of matrixMap.values()) {
                    courses.forEach(c => requiredByMatrixNormalized.add(normalizeForMatch(c)));
                }

                const validUserCourses = userCourses.filter(c => requiredByMatrixNormalized.has(normalizeForMatch(c)));

                // 4. Variables de Análisis
                let currentTotalCompliance = 0;
                let futureTotalCompliance = 0;
                let validEmployeesCount = 0;

                let newHireCount = 0;
                let newHireFutureComplianceTotal = 0;
                const newHirePositions = new Set();
                const newHiresDetails = [];

                dashboardRecords.forEach(r => {
                    const empId = r.employeeId || r.id;
                    const position = r.position?.toUpperCase().trim() || 'Desconocido';
                    // Obtener requeridos de matriz, sino fallback a lo que diga el record
                    const reqCourses = matrixMap.get(position) || r.matrix?.requiredCourses || [];

                    if (!reqCourses || reqCourses.length === 0) return;

                    validEmployeesCount++;

                    // Historial aprobado del empleado
                    const history = r.history || [];
                    const approvedSet = new Set(
                        history.filter(h => h.status === 'approved').map(h => normalizeForMatch(h.courseName))
                    );

                    let futureCompleted = 0;
                    reqCourses.forEach(req => {
                        const reqNorm = normalizeForMatch(req);
                        const hasCurrent = approvedSet.has(reqNorm);
                        const hasFuture = hasCurrent || normalizedUserCourses.includes(reqNorm);
                        if (hasFuture) futureCompleted++;
                    });

                    const futPerc = (futureCompleted / reqCourses.length) * 100;
                    const currentCmp = r.matrix?.compliancePercentage || 0;

                    currentTotalCompliance += currentCmp;
                    futureTotalCompliance += futPerc;

                    // Si estan en cero, son de Nuevo Ingreso / Sin Avance
                    if (currentCmp === 0) {
                        newHireCount++;
                        newHirePositions.add(position);
                        newHiresDetails.push({
                            id: empId,
                            name: r.name || r.fullName || 'Desconocido',
                            position: position,
                            // Solo guardar los faltantes que forman parte del listado de los 37 cursos (userCourses)
                            missingCourses: (r.matrix?.missingCourses || reqCourses).filter(mc =>
                                normalizedUserCourses.includes(normalizeForMatch(mc))
                            )
                        });
                        newHireFutureComplianceTotal += futPerc;
                    }
                });

                const currentAvg = dashboardRecords.length > 0
                    ? (currentTotalCompliance / dashboardRecords.length).toFixed(2)
                    : 0;
                const futureAvg = validEmployeesCount ? (futureTotalCompliance / validEmployeesCount).toFixed(2) : 0;
                const incrAvg = (futureAvg - currentAvg).toFixed(2);
                const newHireAvg = newHireCount > 0 ? (newHireFutureComplianceTotal / newHireCount).toFixed(2) : 0;

                setData({
                    currentAvg,
                    futureAvg,
                    incrAvg,
                    newHireCount,
                    newHireAvg,
                    newHirePositions: Array.from(newHirePositions),
                    newHireDetails: newHiresDetails,
                    positionsFulfilling100,
                    validUserCourses
                });

            } catch (error) {
                console.error("Error cargando presentación:", error);
            } finally {
                setLoading(false);
            }
        };

        analyzeData();
    }, []);

    if (loading || !data) {
        return (
            <div className={styles.main}>
                <div className={styles.loader}>
                    <div className={styles.spinner}></div>
                    <div>Evaluando proyecciones de capacitación...</div>
                </div>
            </div>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Análisis de Capacitación</h1>
                    <p className={styles.subtitle}>
                        Proyección del impacto de la aplicación de {data.validUserCourses.length} cursos con material actualmente.
                    </p>
                </header>

                <div className={styles.grid}>
                    {currentSlide === 1 ? (
                        <>
                            {/* Histórico 2024 y 2025 */}
                            <div className={styles.row}>
                                <div className={styles.card} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.8rem' }}>
                                        <h1 style={{ color: '#f59e0b', fontSize: '1.8rem', margin: 0, fontWeight: '800' }}>2024</h1>
                                    </div>
                                    <div style={{ color: '#6b7280', fontWeight: 'bold', letterSpacing: '1px', fontSize: '1rem', marginBottom: '0.5rem', fontFamily: 'serif' }}>AVANCE DEL PLAN</div>
                                    <div style={{ fontSize: '4rem', fontWeight: '900', color: '#ff4d4f', lineHeight: '1', margin: '1rem 0' }}>22.4%</div>
                                </div>

                                <div className={styles.card} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.8rem' }}>
                                        <h1 style={{ color: '#f59e0b', fontSize: '1.8rem', margin: 0, fontWeight: '800' }}>2025</h1>
                                    </div>
                                    <div style={{ color: '#6b7280', fontWeight: 'bold', letterSpacing: '1px', fontSize: '1rem', marginBottom: '0.5rem', fontFamily: 'serif' }}>AVANCE DEL PLAN</div>
                                    <div style={{ fontSize: '4rem', fontWeight: '900', color: '#ff4d4f', lineHeight: '1', margin: '1rem 0' }}>41.2%</div>
                                </div>
                            </div>

                            {/* Avance Global */}
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <h2 className={styles.cardTitle}>1. Incremento de Avance Global de Cumplimiento</h2>
                                <div className={styles.kpiScoreContainer}>
                                    <div className={styles.kpiItem}>
                                        <div className={`${styles.kpiValue} ${styles.valueNeutral}`}>
                                            {data.currentAvg}%
                                        </div>
                                        <div className={styles.kpiLabel}>Avance Actual Planta</div>
                                    </div>
                                    <div className={styles.kpiItem}>
                                        <div className={`${styles.kpiValue} ${styles.valuePositive}`}>
                                            {data.futureAvg}%
                                        </div>
                                        <div className={styles.kpiLabel}>Avance Proyectado</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div className={styles.incrementBadge}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="18 15 12 9 6 15" />
                                        </svg>
                                        +{data.incrAvg}% Incremento Neto
                                    </div>
                                </div>
                            </div>

                            <div className={styles.row}>
                                {/* Nuevo Ingreso */}
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>2. Personal Activo</h2>
                                    <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
                                        Tienen 0% de cumplimiento en los cursos requeridos.
                                    </p>
                                    <div className={styles.kpiItem} style={{ marginBottom: "2rem" }}>
                                        <div className={`${styles.kpiValue} ${styles.valuePositive}`} style={{ fontSize: "3rem" }}>
                                            {data.newHireAvg}%
                                        </div>
                                        <div className={styles.kpiLabel}>Avance individual si toman los cursos requeridos</div>
                                    </div>
                                    <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Puestos representados:</h3>
                                    <ul className={styles.positionsList}>
                                        {data.newHirePositions.map(p => (
                                            <li key={p} className={styles.positionItem}>{p}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Puestos 100% */}
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>3. Matriz Cubierta al 100%</h2>
                                    <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
                                        Si un empleado de estos {data.positionsFulfilling100.length} puestos aprueba todos los cursos propuestos, ya no requeriría capacitación extra para su puesto.
                                    </p>
                                    <ul className={styles.positionsList}>
                                        {data.positionsFulfilling100.map(p => (
                                            <li key={p} className={styles.positionItem} style={{ borderLeft: "4px solid #f59e0b" }}>
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Detalle Nuevo Ingreso */}
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <h2 className={styles.cardTitle}>4. Detalle de Empleados ({data.newHireCount})</h2>
                                <div className={styles.tableContainer}>
                                    <table className={styles.dataTable}>
                                        <thead>
                                            <tr>
                                                <th>ID Empleado</th>
                                                <th>Nombre Completo</th>
                                                <th>Puesto Actual</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.newHireDetails?.map((emp, idx) => (
                                                <React.Fragment key={idx}>
                                                    <tr onClick={() => toggleExpand(emp.id)} style={{ cursor: 'pointer' }} title="Cursos que le faltan">
                                                        <td className={styles.cellId}>
                                                            <span style={{ marginRight: '8px', color: '#f59e0b' }}>
                                                                {expandedId === emp.id ? '▼' : '▶'}
                                                            </span>
                                                            {emp.id}
                                                        </td>
                                                        <td className={styles.cellName}>{emp.name}</td>
                                                        <td className={styles.cellPosition}>{emp.position}</td>
                                                    </tr>
                                                    {expandedId === emp.id && (
                                                        <tr>
                                                            <td colSpan="3" style={{ background: 'rgba(245, 158, 11, 0.03)', padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                                                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 'bold' }}>CURSOS FALTANTES ({emp.missingCourses?.length || 0}):</div>
                                                                <div className={styles.badgesContainer}>
                                                                    {emp.missingCourses && emp.missingCourses.length > 0 ? (
                                                                        emp.missingCourses.map(mc => (
                                                                            <span key={mc} className={styles.badge} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>{mc}</span>
                                                                        ))
                                                                    ) : (
                                                                        <span style={{ color: '#10b981' }}>Cumple su matriz</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Cursos */}
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <h2 className={styles.cardTitle}>5. Listado de {data.validUserCourses.length} Cursos Considerados Activos en Matriz</h2>
                                <div className={styles.badgesContainer}>
                                    {data.validUserCourses.map(c => (
                                        <span key={c} className={styles.badge}>{c}</span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : currentSlide === 2 ? (
                        <>
                            {/* Slide 2: Instructores y Cursos */}
                            <div className={`${styles.card} ${styles.cardFull}`}>
                                <h2 className={styles.cardTitle}>Directorio de Cursos e Instructores</h2>
                                <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>
                                    Información consolidada de los instructores responsables para el listado de cursos asignados actualmente.
                                </p>
                                <div className={styles.tableContainer}>
                                    <table className={styles.dataTable}>
                                        <thead>
                                            <tr>
                                                <th>Nombre del Curso</th>
                                                <th>Instructor Responsable</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {instCurRaw.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className={styles.cellName}>{item.CURSO}</td>
                                                    <td style={{ fontWeight: '500', color: '#4b5563' }}>{item["INSTRUCTOR RESPONSABLE"]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Slide 3: Plan de Trabajo */}

                            {/* Título */}
                            <div className={`${styles.card} ${styles.cardFull}`} style={{ textAlign: 'center', padding: '2rem 2.5rem' }}>
                                <h2 className={styles.cardTitle} style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Plan de Trabajo – Incremento de Capacitación</h2>
                                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Plataforma Web / Móvil</p>
                            </div>

                            {/* Fila 1: Estado Actual + Áreas de Mejora */}
                            <div className={styles.row}>
                                <div className={styles.card}>
                                    <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>1. Estado Actual</h3>
                                    <p style={{ color: '#374151', fontSize: '0.93rem', lineHeight: '1.7', marginBottom: '1rem' }}>
                                        La plataforma se ha probado con el personal de <strong>nuevo ingreso (candidatos)</strong>, otorgándoles acceso para completar sus cursos de inducción e integrarlos directamente a la operación.
                                    </p>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                        <li style={{ display: 'flex', gap: '0.7rem', color: '#374151', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            <span style={{ color: '#f59e0b', fontWeight: '700', flexShrink: 0 }}>◉</span>
                                            <span><strong>Seguimiento:</strong> En tiempo real desde el panel de &quot;Recursos Humanos&quot;, visualizando a detalle el cumplimiento de cada usuario.</span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.7rem', color: '#374151', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            <span style={{ color: '#f59e0b', fontWeight: '700', flexShrink: 0 }}>◉</span>
                                            <span><strong>Automatización:</strong> Envío automático de mensajes por WhatsApp para un seguimiento directo.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className={styles.card}>
                                    <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>2. Áreas de Mejora y Requerimientos</h3>
                                    <p style={{ color: '#374151', fontSize: '0.93rem', lineHeight: '1.7', marginBottom: '1rem' }}>
                                        Para llevar la capacitación al siguiente nivel, se deben dejar de lado las <strong>Presentaciones en PowerPoint y Archivos PDF</strong> e implementar presentaciones nativas en la plataforma.
                                    </p>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1rem' }}>
                                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', color: '#374151', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            <span style={{ background: '#f59e0b', color: 'white', borderRadius: '50%', minWidth: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem' }}>1</span>
                                            <span><strong>Apoyo interdepartamental:</strong> Colaboración de las distintas áreas para generar material (imágenes, videos, texto).</span>
                                        </li>
                                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', color: '#374151', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            <span style={{ background: '#f59e0b', color: 'white', borderRadius: '50%', minWidth: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem' }}>2</span>
                                            <span><strong>Autorización de cambio de turno:</strong> Se solicita autorización para cambiar al <strong>3er Turno</strong>.</span>
                                        </li>
                                    </ul>
                                    <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: '10px', padding: '0.8rem 1rem', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.87rem', color: '#065f46', lineHeight: '1.6' }}>
                                        <strong>Nota:</strong> El cambio de turno <strong>no afecta</strong> las actividades de capacitación. Todo lo programado continúa mediante correo electrónico.
                                    </div>
                                </div>
                            </div>

                            {/* Fila 2: Plan de Acción + Métricas */}
                            <div className={styles.row}>
                                <div className={styles.card}>
                                    <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>3. Plan de Acción</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                        <li style={{ color: '#374151', fontSize: '0.9rem', lineHeight: '1.6', borderLeft: '3px solid #f59e0b', paddingLeft: '0.8rem' }}>
                                            <strong>Reducir brecha en personal activo:</strong> A través del módulo de &quot;Empleados&quot;, con dashboard personalizado por colaborador, asignación individual de cursos y seguimiento en tiempo real desde &quot;Recursos Humanos&quot;.
                                        </li>
                                        <li style={{ color: '#374151', fontSize: '0.9rem', lineHeight: '1.6', borderLeft: '3px solid #f59e0b', paddingLeft: '0.8rem' }}>
                                            <strong>Capacitación para mandos medios:</strong> Presentaciones nativas basadas en los resultados de la encuesta aplicada al personal operativo.
                                        </li>
                                        <li style={{ color: '#374151', fontSize: '0.9rem', lineHeight: '1.6', borderLeft: '3px solid #f59e0b', paddingLeft: '0.8rem' }}>
                                            <strong>Exámenes digitales:</strong> Calificaciones automáticas e impresión de formatos para su resguardo en carpetas físicas.
                                        </li>
                                    </ul>
                                </div>

                                <div className={styles.card}>
                                    <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>4. Métricas y Proyecciones</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', gap: '0.4rem', flexWrap: 'wrap', margin: '1rem 0' }}>
                                        <div>
                                            <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#9ca3af' }}>22.4%</div>
                                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600' }}>2024</div>
                                        </div>
                                        <div style={{ fontSize: '1.4rem', color: '#d1d5db', alignSelf: 'center' }}>→</div>
                                        <div>
                                            <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#6b7280' }}>41.2%</div>
                                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600' }}>2025</div>
                                        </div>
                                        <div style={{ fontSize: '1.4rem', color: '#d1d5db', alignSelf: 'center' }}>→</div>
                                        <div>
                                            <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#374151' }}>53.16%</div>
                                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600' }}>Actual</div>
                                        </div>
                                        <div style={{ fontSize: '1.4rem', color: '#10b981', alignSelf: 'center' }}>→</div>
                                        <div>
                                            <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#10b981' }}>77.92%</div>
                                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '600' }}>Proyectado</div>
                                        </div>
                                    </div>
                                    <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '0.7rem' }}>
                                        En los últimos <strong>2 meses</strong> se obtuvo un avance del <strong style={{ color: '#10b981' }}>+8.4%</strong>. Se proyecta un incremento del <strong style={{ color: '#10b981' }}>+24.76%</strong> cubriendo los <strong>24 cursos disponibles</strong>.
                                    </p>
                                    <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: '1.6' }}>
                                        <strong>Próximo objetivo:</strong> Superar el 77.92% analizando cursos faltantes. Algunos requieren proveedor externo certificado, ya que son <strong>requisito para Auditoría</strong>.
                                    </p>
                                </div>
                            </div>

                            {/* Fila 3: Estatus Operativo + Renovaciones */}
                            <div className={styles.row}>
                                <div className={styles.card}>
                                    <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>5. Estatus Operativo y de Seguimiento</h3>

                                    <p style={{ color: '#6b7280', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Evaluaciones de Desempeño – Nuevos Ingresos</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <span style={{ fontSize: '3rem', fontWeight: '900', color: '#10b981', lineHeight: 1 }}>100%</span>
                                        <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '0.9rem', margin: 0 }}>Cumplimiento en la entrega de evaluaciones de desempeño al día de hoy.</p>
                                    </div>

                                    <p style={{ color: '#6b7280', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Cursos y Exámenes Programados</p>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <li style={{ fontSize: '0.87rem', lineHeight: '1.5', borderLeft: '3px solid #f59e0b', paddingLeft: '0.75rem', color: '#374151' }}>
                                            <strong>Cursos de Inducción (Plataforma):</strong> <span style={{ color: '#6b7280' }}>Datos entregados al área de Reclutamiento en el formato establecido.</span>
                                        </li>
                                        <li style={{ fontSize: '0.87rem', lineHeight: '1.5', borderLeft: '3px solid #f59e0b', paddingLeft: '0.75rem', color: '#374151' }}>
                                            <strong>Introducción a la Metrología y Equipos de Medición</strong> <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '0.8rem' }}>(7 Mar)</span><span style={{ color: '#6b7280' }}>: Material listo para el proveedor.</span>
                                        </li>
                                        <li style={{ fontSize: '0.87rem', lineHeight: '1.5', borderLeft: '3px solid #f59e0b', paddingLeft: '0.75rem', color: '#374151' }}>
                                            <strong>NOM-002-STPS-2010:</strong> <span style={{ color: '#6b7280' }}>Ing. Vanessa da seguimiento. Sin requerimientos extraordinarios.</span>
                                        </li>
                                        <li style={{ fontSize: '0.87rem', lineHeight: '1.5', borderLeft: '3px solid #f59e0b', paddingLeft: '0.75rem', color: '#374151' }}>
                                            <strong>Exámenes para Cambios de Categoría:</strong> <span style={{ color: '#6b7280' }}>Pendiente al 3er y 4to Turno del personal que cumple los requisitos.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className={styles.card}>
                                    <h3 className={styles.cardTitle} style={{ fontSize: '1.05rem' }}>Renovaciones de Contrato Próximas</h3>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.dataTable}>
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Nombre Completo</th>
                                                    <th>Depto.</th>
                                                    <th>Término</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { id: '4042', nombre: 'Muñoz Servín Ximena', depto: 'Producción', fecha: '20/04/2026' },
                                                    { id: '4043', nombre: 'Díaz Ayala María Elena', depto: 'Producción', fecha: '20/04/2026' },
                                                    { id: '4044', nombre: 'Barrientos Monroy Diego', depto: 'Producción', fecha: '20/04/2026' },
                                                    { id: '4046', nombre: 'Martínez Olvera Aracelí', depto: 'Producción', fecha: '22/04/2026' },
                                                    { id: '4047', nombre: 'De León Castañeda Adolfo Orfaly', depto: 'Producción', fecha: '22/04/2026' },
                                                    { id: '4048', nombre: 'Pacheco Moreno Hernán', depto: 'Producción', fecha: '22/04/2026' },
                                                    { id: '4049', nombre: 'Guadarrama Velázquez María de Jesús', depto: 'Producción', fecha: '22/04/2026' },
                                                    { id: '4050', nombre: 'Servín Martínez Lorena', depto: 'Producción', fecha: '22/04/2026' },
                                                    { id: '4051', nombre: 'Samaniego Guzmán Ma. Guadalupe', depto: 'Producción', fecha: '22/04/2026' },
                                                    { id: '4052', nombre: 'Zúñiga Ortiz Ingrid Ailín', depto: 'Producción', fecha: '22/04/2026' },
                                                ].map(e => (
                                                    <tr key={e.id}>
                                                        <td className={styles.cellId}>{e.id}</td>
                                                        <td className={styles.cellName}>{e.nombre}</td>
                                                        <td>{e.depto}</td>
                                                        <td style={{ color: '#f59e0b', fontWeight: '600' }}>{e.fecha}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.navigationControls}>
                    {currentSlide > 1 && (
                        <button className={styles.navButton} onClick={() => setCurrentSlide(s => s - 1)}>
                            ⟵ Anterior
                        </button>
                    )}
                    {currentSlide < 3 && (
                        <button className={styles.navButtonPrimary} onClick={() => setCurrentSlide(s => s + 1)}>
                            Siguiente ⟶
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}