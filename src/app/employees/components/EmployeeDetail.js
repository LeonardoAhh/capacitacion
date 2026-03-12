'use client';

import { memo } from 'react';
import Image from 'next/image';
import {
    User, Briefcase, Activity, FileText,
    Trash2, Phone, Loader2, Download, ShieldCheck, ShieldOff, ClipboardList
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import InlineEditField from './InlineEditField';
import styles from '../page.module.css';
import { getInitials, formatDate } from '@/lib/employeeUtils';

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
                <BackButton onClick={onBack} label="" />
            </div>

            {/* HEADER COMPACTO CON ACCIONES */}
            <div className={styles.detailHeader}>
                <div className={styles.avatarLarge}>
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
                <div className={styles.headerInfo}>
                    <InlineEditField
                        label="Nombre"
                        value={employee.name}
                        onSave={(val) => handleFieldSave('name', val)}
                        className={styles.detailNameInline}
                        required
                    />
                    <div className={styles.detailIdRow}>
                        <p className={styles.detailId}>ID: {employee.employeeId || employee.id}</p>
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
                </div>

                {/* Agrupamos las acciones */}
                <div className={styles.actionButtons}>
                    {employee.phone && (
                        <a
                            href={`https://wa.me/${employee.phone.replace(/\s/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.whatsappButton}
                            title="Enviar mensaje por WhatsApp"
                        >
                            <Phone size={18} />
                            WhatsApp
                        </a>
                    )}
                    <button
                        onClick={() => onDelete(employee.id)}
                        className={styles.deleteButton}
                        title="Eliminar empleado"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 size={18} className={styles.spinning} />
                        ) : (
                            <Trash2 size={18} />
                        )}
                        Eliminar
                    </button>
                </div>
            </div>

            {/* FLUJO CONTINUO SIN TABS */}
            <div className={styles.unifiedContent}>

                {/* 1. SECCIÓN PERSONAL */}
                <div className={styles.unifiedSection}>
                    <h3 className={styles.sectionHeading}>
                        <User size={18} className={styles.sectionIcon} />
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

                <hr className={styles.sectionDivider} />

                {/* 2. SECCIÓN LABORAL */}
                <div className={styles.unifiedSection}>
                    <h3 className={styles.sectionHeading}>
                        <Briefcase size={18} className={styles.sectionIcon} />
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

                <hr className={styles.sectionDivider} />

                {/* 3. SECCIÓN EVALUACIONES */}
                <div className={styles.unifiedSection}>
                    <h3 className={styles.sectionHeading}>
                        <ClipboardList size={18} className={styles.sectionIcon} />
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
                            Guarda una fecha de inicio para generar las fechas de evaluación.
                        </p>
                    )}
                </div>

                <hr className={styles.sectionDivider} />

                {/* 4. SECCIÓN ACTIVIDAD */}
                <div className={styles.unifiedSection}>
                    <h3 className={styles.sectionHeading}>
                        <Activity size={18} className={styles.sectionIcon} />
                        Actividad y Plataforma
                    </h3>

                    {/* ACCESO A PLATAFORMA — control prominente */}
                    <div className={`${styles.platformAccessCard} ${employee.isCandidato ? styles.platformAccessCardActive : ''}`}>
                        <div className={styles.platformAccessInfo}>
                            <div className={styles.platformAccessIcon}>
                                {employee.isCandidato
                                    ? <ShieldCheck size={22} />
                                    : <ShieldOff size={22} />
                                }
                            </div>
                            <div>
                                <p className={styles.platformAccessTitle}>
                                    Acceso a la plataforma
                                </p>
                                <p className={styles.platformAccessDesc}>
                                    {employee.isCandidato
                                        ? 'Puede ingresar con su código de acceso'
                                        : 'No tiene acceso a la plataforma de candidatos'
                                    }
                                </p>
                            </div>
                            <span className={`${styles.platformAccessBadge} ${employee.isCandidato ? styles.platformAccessBadgeOn : styles.platformAccessBadgeOff}`}>
                                {employee.isCandidato ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        <button
                            type="button"
                            className={`${styles.platformAccessToggle} ${employee.isCandidato ? styles.platformAccessToggleOn : styles.platformAccessToggleOff}`}
                            onClick={() => handleFieldSave('isCandidato', !employee.isCandidato)}
                        >
                            {employee.isCandidato ? 'Quitar acceso' : 'Dar acceso'}
                        </button>
                    </div>

                    <div className={styles.infoGrid}>
                        <div className={styles.accessCodeRow}>
                            <div className={styles.accessCodeInputRow}>
                                <div className={styles.accessCodeInputWrapper}>
                                    <InlineEditField
                                        label="Código de Acceso"
                                        value={employee.accessCode}
                                        onSave={(val) => handleFieldSave('accessCode', val)}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                                        onUpdate(employee.id, {
                                            accessCode: code,
                                            accessCodeGeneratedAt: Date.now(),
                                            accessCodeUses: 0
                                        });
                                    }}
                                    className={styles.generateCodeBtn}
                                    title="Generar nuevo código"
                                >
                                    <Activity size={16} />
                                    Generar
                                </button>
                            </div>
                            {employee.accessCode && (
                                <div className={styles.infoItem}>
                                    <label>Usos / Creado</label>
                                    <span className={styles.codeUsageInfo}>
                                        {employee.accessCodeUses || 0} usos • {employee.accessCodeGeneratedAt ? new Date(employee.accessCodeGeneratedAt).toLocaleDateString('es-MX') : '—'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <InlineEditField
                            label="Plan Entregado"
                            type="checkbox"
                            value={employee.trainingPlanDelivered}
                            onSave={(val) => handleFieldSave('trainingPlanDelivered', val)}
                        />
                        <InlineEditField
                            label="Fecha Notificación"
                            type="date"
                        value={employee.notificationDate ? new Date(employee.notificationDate).toISOString().split('T')[0] : ''}
                        onSave={(val) => handleFieldSave('notificationDate', val ? val + 'T12:00:00Z' : null)}
                    />
                    <div className={styles.infoItem}>
                        <label>Último Login</label>
                        <span>{formatDate(employee.lastLoginCandidate)}</span>
                    </div>
                </div>

                {employee.cursosCompletados && employee.cursosCompletados.length > 0 && (
                    <div className={styles.coursesSection}>
                        <h4 className={styles.coursesTitle}>Cursos Completados</h4>
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
                    <div className={styles.coursesSection}>
                        <h4 className={styles.coursesTitle}>Progreso de Cursos</h4>
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

            <hr className={styles.sectionDivider} />

            {/* 4. SECCIÓN DOCUMENTOS */}
            <div className={styles.unifiedSection}>
                <h3 className={styles.sectionHeading}>
                    <FileText size={18} className={styles.sectionIcon} />
                    Documentos
                </h3>

                {employee.documents && employee.documents.length > 0 ? (
                    <div className={styles.documentsList}>
                        {employee.documents.map((doc, idx) => (
                            <div key={idx} className={styles.documentItem}>
                                <FileText size={20} />
                                <span>Documento {idx + 1}</span>
                                <a href="#" className={styles.documentLink}>Ver</a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FileText size={32} />
                        <p>No hay documentos disponibles</p>
                    </div>
                )}
            </div>

        </div> {/* Fin de Unified Content */ }
        </div >
    );
}

export const EmployeeDetail = memo(EmployeeDetailComponent);
