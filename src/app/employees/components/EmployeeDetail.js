'use client';

import { memo } from 'react';
import Image from 'next/image';
import {
    User, Briefcase, Activity, FileText,
    Trash2, Phone, Loader2, Download, ShieldCheck, ShieldOff, ClipboardList,
    Key, RefreshCw
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import InlineEditField from './InlineEditField';
import styles from '../page.module.css';
import { getInitials, formatDate, formatFullName } from '@/lib/employeeUtils';

function EmployeeDetailComponent({
    employee,
    onBack,
    onUpdate, // Replacing onEdit with onUpdate for Inline Editing
    onDelete,
    onImageError,
    isDeleting,
}) {
    const handleFieldSave = (field, value) => {
        // Si se actualiza la fecha de inicio, recalcular todas las fechas derivadas
        if (field === 'startDate' && value) {
            const rawDate = value.replace('T12:00:00Z', '');
            const start = new Date(rawDate);
            const addDays = (d, days) => {
                const result = new Date(d);
                result.setDate(result.getDate() + days);
                return result.toISOString().split('T')[0] + 'T12:00:00Z';
            };
            onUpdate(employee.id, {
                startDate:       value,
                contractEndDate: addDays(start, 90),
                eval1Date:       addDays(start, 30),
                eval2Date:       addDays(start, 60),
                eval3Date:       addDays(start, 85),
            });
            return;
        }
        onUpdate(employee.id, { [field]: value });
    };

    return (
        <div className={styles.detailView}>
            <div className={styles.backButtonWrapper}>
                <BackButton onClick={onBack} label="Volver a lista" />
            </div>

            {/* HEADER COMPACTO CON ACCIONES (Hero Card) */}
            <div className={`${styles.detailCard} ${styles.heroCard}`}>
                <div className={styles.heroAvatar}>
                    {employee.photoUrl ? (
                        <Image
                            src={employee.photoUrl}
                            alt={employee.name}
                            width={100}
                            height={100}
                            unoptimized
                            onError={(e) => onImageError(e, employee.name)}
                        />
                    ) : (
                        <span>{getInitials(employee.name)}</span>
                    )}
                </div>
                
                <div className={styles.heroInfo}>
                    <div className={styles.heroNameRow}>
                        <InlineEditField
                            label=""
                            value={formatFullName(employee.name)}
                            onSave={(val) => handleFieldSave('name', val)}
                            className={styles.heroNameInline}
                            variant="hero"
                            required
                        />
                        <InlineEditField
                            label=""
                            type="select"
                            value={employee.status || 'Activo'}
                            options={[
                                { label: 'Activo', value: 'Activo' },
                                { label: 'Inactivo', value: 'Inactivo' }
                            ]}
                            onSave={(val) => handleFieldSave('status', val)}
                        />
                    </div>
                    <p className={styles.heroId}>ID: {employee.employeeId || employee.id}</p>
                </div>

                <div className={styles.heroActions}>
                    {employee.phone && (
                        <a
                            href={`https://wa.me/${employee.phone.replace(/\s/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.whatsappButton}
                            title="Enviar mensaje por WhatsApp"
                        >
                            <Phone size={18} />
                        </a>
                    )}
                    
                    {/* Botón Acceso Portal */}
                    <button
                        type="button"
                        className={`${styles.heroActionBtn} ${employee.isCandidato ? styles.btnSuccess : styles.btnOutline}`}
                        onClick={() => handleFieldSave('isCandidato', !employee.isCandidato)}
                        title={employee.isCandidato ? 'Quitar acceso al portal' : 'Dar acceso al portal'}
                    >
                        {employee.isCandidato ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                    </button>

                    {/* Botón Código PIN */}
                    <button
                        className={styles.heroActionBtn}
                        onClick={() => {
                            const code = Math.floor(100000 + Math.random() * 900000).toString();
                            onUpdate(employee.id, {
                                accessCode: code,
                                accessCodeGeneratedAt: Date.now(),
                                accessCodeUses: 0
                            });
                        }}
                        title={employee.accessCode ? `PIN: ${employee.accessCode} (Regenerar)` : 'Generar PIN de acceso'}
                    >
                        <Key size={18} />
                        {employee.accessCode && <span className={styles.btnBadge}>{employee.accessCode}</span>}
                    </button>

                    {/* Botón Eliminar (Directo en Hero) */}
                    <button
                        onClick={() => onDelete(employee.id)}
                        className={`${styles.heroActionBtn} ${styles.btnDanger}`}
                        disabled={isDeleting}
                        title="Eliminar empleado permanentemente"
                    >
                        {isDeleting ? <Loader2 size={18} className={styles.spinning} /> : <Trash2 size={18} />}
                    </button>
                </div>
            </div>

            {/* GRID DOS COLUMNAS (Personal / Laboral) */}
            <div className={styles.gridTwoCols}>
                <div className={styles.detailCard}>
                    <h3 className={styles.cardTitle}>
                        <User size={18} />
                        Información Personal
                    </h3>
                    <div className={styles.infoGrid}>
                        <InlineEditField
                            label="CURP"
                            value={employee.curp}
                            onSave={(val) => handleFieldSave('curp', val)}
                        />
                        <InlineEditField
                            label="ID Empleado"
                            value={employee.employeeId}
                            onSave={(val) => handleFieldSave('employeeId', val)}
                        />
                        <InlineEditField
                            label="Teléfono"
                            value={employee.phone}
                            onSave={(val) => handleFieldSave('phone', val)}
                        />
                    </div>
                </div>

                <div className={styles.detailCard}>
                    <h3 className={styles.cardTitle}>
                        <Briefcase size={18} />
                        Información Laboral
                    </h3>
                    <div className={styles.infoGrid}>
                        <InlineEditField
                            label="Puesto"
                            value={employee.position}
                            onSave={(val) => handleFieldSave('position', val)}
                        />
                        <InlineEditField
                            label="Departamento"
                            value={employee.department}
                            onSave={(val) => handleFieldSave('department', val)}
                        />
                        <InlineEditField
                            label="Área"
                            value={employee.area}
                            onSave={(val) => handleFieldSave('area', val)}
                        />
                        <InlineEditField
                            label="Turno"
                            value={employee.shift}
                            onSave={(val) => handleFieldSave('shift', val)}
                        />
                        <InlineEditField
                            label="Fecha de Inicio"
                            type="date"
                            value={employee.startDate ? new Date(employee.startDate).toISOString().split('T')[0] : ''}
                            onSave={(val) => handleFieldSave('startDate', val + 'T12:00:00Z')}
                            helperText="Actualiza automáticamente el fin de contrato"
                        />
                        <InlineEditField
                            label="Fin de Contrato"
                            type="date"
                            value={employee.contractEndDate ? new Date(employee.contractEndDate).toISOString().split('T')[0] : ''}
                            onSave={(val) => handleFieldSave('contractEndDate', val ? val + 'T12:00:00Z' : null)}
                        />
                    </div>
                </div>
            </div>

            {/* EVALUACIONES DE DESEMPEÑO */}
            <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>
                    <ClipboardList size={18} />
                    Evaluaciones de Desempeño
                </h3>

                {employee.eval1Date || employee.eval2Date || employee.eval3Date ? (
                    <div className={styles.evalsSection}>
                        {[
                            { num: 1, label: 'Evaluación 1', date: employee.eval1Date, scoreField: 'eval1Score', score: employee.eval1Score, days: '30 días' },
                            { num: 2, label: 'Evaluación 2', date: employee.eval2Date, scoreField: 'eval2Score', score: employee.eval2Score, days: '60 días' },
                            { num: 3, label: 'Evaluación 3', date: employee.eval3Date, scoreField: 'eval3Score', score: employee.eval3Score, days: '85 días' },
                        ].map((ev) => {
                            const hasScore = ev.score !== '' && ev.score !== null && ev.score !== undefined;
                            const passed   = hasScore && parseFloat(ev.score) >= 80;
                            const failed   = hasScore && parseFloat(ev.score) < 80;
                            return (
                                <div
                                    key={ev.num}
                                    className={`${styles.evalCard} ${
                                        passed ? styles.evalCardPassed
                                        : failed ? styles.evalCardFailed
                                        : styles.evalCardPending
                                    }`}
                                >
                                    <div className={styles.evalCardHeader}>
                                        <div className={styles.evalCardNum}>{ev.num}</div>
                                        <div className={styles.evalCardInfo}>
                                            <span className={styles.evalCardLabel}>{ev.label}</span>
                                            <span className={styles.evalCardMeta}>
                                                {ev.days} &bull; {ev.date ? formatDate(ev.date.split?.('T')[0] ?? ev.date) : '—'}
                                            </span>
                                        </div>
                                        {hasScore && (
                                            <span className={`${styles.evalScoreBadge} ${passed ? styles.evalScorePassed : styles.evalScoreFailed}`}>
                                                {passed ? '✓' : '✕'} {ev.score}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.evalCardBody}>
                                        <InlineEditField
                                            label="Calificación (0–100)"
                                            type="number"
                                            value={ev.score ?? ''}
                                            onSave={(val) => handleFieldSave(ev.scoreField, val === '' ? null : Number(val))}
                                            placeholder="Pendiente"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className={styles.evalEmptyNote}>
                        Guarda una fecha de inicio para activar el calendario de evaluaciones.
                    </p>
                )}
            </div>

            {/* ASIGNACIONES (Cursos y Progreso) */}
            {(employee.cursosCompletados?.length > 0 || Object.keys(employee.coursesProgress || {}).length > 0) && (
                <div className={styles.detailCard}>
                    <h3 className={styles.cardTitle}>
                        <Activity size={18} />
                        Avance en Capacitación
                    </h3>
                    
                    <div className={styles.infoGrid1Col}>
                        {employee.cursosCompletados?.length > 0 && (
                            <div>
                                <label className={styles.coursesTitle}>Cursos Completados</label>
                                <div className={styles.coursesBadgeContainer}>
                                    {employee.cursosCompletados.map((courseId, idx) => (
                                        <span key={idx} className={styles.courseBadge}>
                                            {courseId.substring(0, 12)}...
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {employee.coursesProgress && Object.keys(employee.coursesProgress).length > 0 && (
                            <div>
                                <label className={styles.coursesTitle}>Progreso Activo</label>
                                {Object.entries(employee.coursesProgress).map(([courseId, progress]) => (
                                    <div key={courseId} className={styles.progressItem}>
                                        <span className={styles.courseId}>{courseId.substring(0, 12)}...</span>
                                        <div className={styles.progressSteps}>
                                            <span className={progress.step1Completed ? styles.stepCompleted : styles.stepPending}>
                                                Paso 1
                                            </span>
                                            <span className={progress.step2Completed ? styles.stepCompleted : styles.stepPending}>
                                                Paso 2
                                            </span>
                                            {progress.examDownloaded && (
                                                <span className={styles.stepInfo}>
                                                    <Download size={14} /> Examen
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* DOCUMENTOS */}
            <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>
                    <FileText size={18} />
                    Documentos e Inducción
                </h3>

                <div className={styles.infoGrid}>
                    <InlineEditField
                        label="Plan de Capacitación Entregado"
                        type="checkbox"
                        value={employee.trainingPlanDelivered}
                        onSave={(val) => handleFieldSave('trainingPlanDelivered', val)}
                    />
                    <InlineEditField
                        label="Fecha de Notificación"
                        type="date"
                        value={employee.notificationDate ? new Date(employee.notificationDate).toISOString().split('T')[0] : ''}
                        onSave={(val) => handleFieldSave('notificationDate', val ? val + 'T12:00:00Z' : null)}
                    />
                </div>

                {employee.documents && employee.documents.length > 0 ? (
                    <div className={`${styles.documentsList} mt-4`}>
                        {employee.documents.map((doc, idx) => (
                            <div key={idx} className={styles.documentItem}>
                                <FileText size={20} className={styles.sectionIcon} />
                                <span>Documento adjunto {idx + 1}</span>
                                <a href="#" className={styles.documentLink}>Ver archivo</a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`${styles.emptyState} mt-4`}>
                        <FileText size={32} />
                        <p>No se han subido documentos adicionales para este empleado.</p>
                    </div>
                )}
            </div>

        </div>
    );
}

export const EmployeeDetail = memo(EmployeeDetailComponent);
