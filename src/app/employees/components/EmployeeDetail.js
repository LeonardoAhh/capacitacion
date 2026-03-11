'use client';

import { memo } from 'react';
import Image from 'next/image';
import {
    User, Briefcase, Activity, FileText,
    Trash2, Phone, Loader2, Download
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import InlineEditField from './InlineEditField';
import styles from '../page.module.css';

const getInitials = (name) => {
    if (!name) return 'EM';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
};

function EmployeeDetailComponent({
    employee,
    onBack,
    onUpdate, // Replacing onEdit with onUpdate for Inline Editing
    onDelete,
    onImageError,
    isDeleting,
}) {
    const handleFieldSave = (field, value) => {
        onUpdate(employee.id, { [field]: value });
    };

    return (
        <div className={styles.detailView}>
            <div style={{ marginBottom: '32px' }}>
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
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
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
                            label="Tipo"
                            type="select"
                            value={employee.isCandidato ? 'Candidato' : 'Empleado'}
                            options={[
                                { label: 'Empleado', value: 'Empleado' },
                                { label: 'Candidato', value: 'Candidato' }
                            ]}
                            onSave={(val) => handleFieldSave('isCandidato', val === 'Candidato')}
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

                {/* 3. SECCIÓN ACTIVIDAD */}
                <div className={styles.unifiedSection}>
                    <h3 className={styles.sectionHeading}>
                        <Activity size={18} className={styles.sectionIcon} />
                        Actividad y Plataforma
                    </h3>
                    <div className={styles.infoGrid}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
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
                                <div className={styles.infoItem} style={{ marginTop: '0' }}>
                                    <label>Usos / Creado</label>
                                    <span style={{ fontSize: '0.85rem' }}>
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
