'use client';

import { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import {
    User, Briefcase, Activity, FileText, ArrowLeft,
    Edit, Trash2, Phone, Loader2, Download
} from 'lucide-react';
import styles from '../../page.module.css';

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
    onEdit,
    onDelete,
    onImageError,
    isDeleting,
}) {
    const [activeTab, setActiveTab] = useState('personal');

    return (
        <div className={styles.detailView}>
            <button onClick={onBack} className={styles.backButton}>
                <ArrowLeft size={18} />
                Volver a la lista
            </button>

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
                    <h2 className={styles.detailName}>{employee.name}</h2>
                    <p className={styles.detailId}>ID: {employee.employeeId || employee.id}</p>
                    <span className={`${styles.statusBadge} ${employee.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}`}>
                        {employee.status || 'Activo'}
                    </span>
                </div>
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
                        onClick={() => onEdit(employee)}
                        className={styles.editButton}
                        title="Editar empleado"
                    >
                        <Edit size={18} />
                        Editar
                    </button>
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

            <div className={styles.tabsNav} role="tablist">
                <button
                    role="tab"
                    aria-selected={activeTab === 'personal'}
                    aria-controls="personal-panel"
                    className={`${styles.tabButton} ${activeTab === 'personal' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    <User size={18} />
                    Personal
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'laboral'}
                    aria-controls="laboral-panel"
                    className={`${styles.tabButton} ${activeTab === 'laboral' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('laboral')}
                >
                    <Briefcase size={18} />
                    Laboral
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'actividad'}
                    aria-controls="actividad-panel"
                    className={`${styles.tabButton} ${activeTab === 'actividad' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('actividad')}
                >
                    <Activity size={18} />
                    Actividad
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'documentos'}
                    aria-controls="documentos-panel"
                    className={`${styles.tabButton} ${activeTab === 'documentos' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('documentos')}
                >
                    <FileText size={18} />
                    Documentos
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'personal' && (
                    <div id="personal-panel" role="tabpanel" className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <label>Nombre Completo</label>
                            <span>{employee.name}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>CURP</label>
                            <span>{employee.curp || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>ID Empleado</label>
                            <span>{employee.employeeId || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Tipo</label>
                            <span>{employee.isCandidato ? 'Candidato' : 'Empleado'}</span>
                        </div>
                    </div>
                )}

                {activeTab === 'laboral' && (
                    <div id="laboral-panel" role="tabpanel" className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <label>Puesto</label>
                            <span>{employee.position || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Departamento</label>
                            <span>{employee.department || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Área</label>
                            <span>{employee.area || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Turno</label>
                            <span>{employee.shift || '—'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Fecha de Inicio</label>
                            <span>{formatDate(employee.startDate)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Fin de Contrato</label>
                            <span>{formatDate(employee.contractEndDate)}</span>
                        </div>
                    </div>
                )}

                {activeTab === 'actividad' && (
                    <div id="actividad-panel" role="tabpanel">
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <label>Código de Acceso</label>
                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    {employee.accessCode || '—'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Plan Entregado</label>
                                <span>{employee.trainingPlanDelivered ? 'Sí' : 'No'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Fecha Notificación</label>
                                <span>{formatDate(employee.notificationDate)}</span>
                            </div>
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
                )}

                {activeTab === 'documentos' && (
                    <div id="documentos-panel" role="tabpanel">
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
                )}
            </div>
        </div>
    );
}

export const EmployeeDetail = memo(EmployeeDetailComponent);
