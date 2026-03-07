'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Shield, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Firebase
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

// Utils
import { checkPromotionCriteria, calculateMonthsInPosition } from '@/lib/promotionUtils';

// Components
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { BackgroundLines } from '@/components/ui/BackgroundLines';
import { useToast } from '@/components/ui/Toast/Toast';
import ProfileHeader from './components/ProfileHeader';
import GeneralView from './components/views/GeneralView';
import TrainingView from './components/views/TrainingView';
import PromotionView from './components/views/PromotionView';
import ILUOView from './components/views/ILUOView';
import DocumentsView from './components/views/DocumentsView';
import GroupReportModal from './components/GroupReportModal';

// Styles
import styles from './page.module.css';

// Constants
const PASSING_SCORE = 80;
const MAX_SEARCH_ID_LENGTH = 5;

export default function PerfilPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [employee, setEmployee] = useState(null);
    const [positionData, setPositionData] = useState(null);
    const [promotionRule, setPromotionRule] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [employeeGroups, setEmployeeGroups] = useState([]);
    
    // Group Report Modal State
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    // Auth
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // View state for slide navigation
    const [activeView, setActiveView] = useState('profile');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && (user.rol === 'demo' || user.email?.includes('demo'))) {
            router.push('/induccion');
        }
    }, [authLoading, user, router]);

    const calculateSeniority = (startDate) => {
        if (!startDate) return { text: 'N/A', years: 0, months: 0 };
        const start = new Date(startDate);
        const now = new Date();
        const diffMs = now - start;
        const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
        const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
        if (years > 0) {
            return { text: `${years}a ${months}m`, years, months };
        }
        return { text: `${months} meses`, years: 0, months };
    };

    /**
     * Searches for an employee by ID and fetches related data
     * Optimized with parallel queries using Promise.all
     * @async
     */
    const handleSearch = useCallback(async () => {
        if (!searchId.trim()) {
            toast.warning('Atención', 'Ingresa un ID de empleado');
            return;
        }

        setLoading(true);
        setEmployee(null);
        setPositionData(null);
        setPromotionRule(null);
        setNotFound(false);
        setEmployeeGroups([]);
        setActiveView('profile');

        try {
            // Try to fetch employee by direct ID first
            const directRef = doc(db, 'training_records', searchId.trim());
            let empDoc = await getDoc(directRef);
            let empData = null;

            // If not found by direct ID, search by employeeId field
            if (empDoc.exists()) {
                empData = { id: empDoc.id, ...empDoc.data() };
            } else {
                const q = query(
                    collection(db, 'training_records'),
                    where('employeeId', '==', searchId.trim())
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const docData = snapshot.docs[0];
                    empData = { id: docData.id, ...docData.data() };
                }
            }

            if (empData) {
                setEmployee(empData);

                // Fetch position, promotion data and groups in parallel
                const empId = empData.employeeId ?? empData.id;
                const fetchPromises = [];

                if (empData.position) {
                    const posName = empData.position.toUpperCase().trim();
                    fetchPromises.push(
                        getDocs(query(collection(db, 'positions'), where('name', '==', posName))),
                        getDocs(query(collection(db, 'promotion_rules'), where('currentPosition', '==', posName)))
                    );
                } else {
                    fetchPromises.push(Promise.resolve(null), Promise.resolve(null));
                }

                // Busca los grupos donde el empleado es miembro
                fetchPromises.push(
                    getDocs(query(collection(db, 'groups'), where('members', 'array-contains', empId)))
                );

                const [posSnap, rulesSnap, groupsSnap] = await Promise.all(fetchPromises);

                if (posSnap && !posSnap.empty) {
                    setPositionData({ id: posSnap.docs[0].id, ...posSnap.docs[0].data() });
                }
                if (rulesSnap && !rulesSnap.empty) {
                    setPromotionRule({ id: rulesSnap.docs[0].id, ...rulesSnap.docs[0].data() });
                }
                if (groupsSnap && !groupsSnap.empty) {
                    setEmployeeGroups(groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
                }

                toast.success('✓', empData.name);
            } else {
                setNotFound(true);
                toast.error('No Encontrado', 'No existe empleado con ese ID');
            }
        } catch (error) {
            console.error('Error searching employee:', {
                searchId,
                error: error.message,
                code: error.code,
                timestamp: new Date().toISOString()
            });

            // Provide specific error messages
            if (error.code === 'permission-denied') {
                toast.error('Sin permisos', 'No tienes acceso a este empleado');
            } else if (error.code === 'unavailable') {
                toast.error('Sin conexión', 'Verifica tu conexión a internet');
            } else {
                toast.error('Error', 'Error al buscar el empleado. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    }, [searchId, toast]);

    const analyzeTraining = useCallback(() => {
        if (!employee) return { approved: [], failed: [], pending: [], all: [], matrixCompliance: 0 };

        const history = employee.history || [];
        const requiredCourses = positionData?.requiredCourses || [];

        const approved = [];
        const failed = [];

        history.forEach(record => {
            const courseName = record.courseName || record.course;
            const score = parseFloat(record.score) || parseFloat(record.qualification) || 0;
            const isApproved = record.status === 'approved' || (record.status === undefined && score >= PASSING_SCORE);

            if (isApproved) {
                approved.push({ name: courseName, date: record.date, score });
            } else {
                failed.push({ name: courseName, date: record.date, score });
            }
        });

        const normalizeForMatch = (str) => (str || '')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toUpperCase().trim();

        const passedNames = approved.map(c => normalizeForMatch(c.name));
        const pending = requiredCourses.filter(c =>
            !passedNames.includes(normalizeForMatch(c))
        );

        // Calculate matrix compliance percentage
        let matrixCompliance = 0;
        if (requiredCourses.length > 0) {
            const completedCount = requiredCourses.length - pending.length;
            matrixCompliance = Math.round((completedCount / requiredCourses.length) * 100);
        }

        return { approved, failed, pending, all: history, matrixCompliance };
    }, [employee, positionData]);

    const getPromotionInfo = useCallback(() => {
        if (!employee || !promotionRule) return null;
        return checkPromotionCriteria(employee, promotionRule);
    }, [employee, promotionRule]);

    // Memoize expensive calculations to prevent unnecessary re-renders
    const training = useMemo(() => analyzeTraining(), [analyzeTraining]);
    const promotionInfo = useMemo(() => getPromotionInfo(), [getPromotionInfo]);
    const seniority = useMemo(
        () => employee ? calculateSeniority(employee.startDate) : null,
        [employee]
    );
    const monthsInPosition = useMemo(
        () => employee?.promotionData?.positionStartDate
            ? calculateMonthsInPosition(employee.promotionData.positionStartDate)
            : 0,
        [employee]
    );



    if (authLoading || !user) {
        return (
            <AdminLayout title="Perfiles de Puesto">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Perfiles de Puesto">
            <div className={styles.pageWrapper}>
                <BackgroundLines className={styles.bgDecoration} />

                <div className={styles.container}>
                    {/* Barra de búsqueda debajo del ProfileDropdown */}
                    <div className={styles.searchRow}>
                        <div className={styles.searchPill}>
                            <Search className={styles.searchPillIcon} size={16} strokeWidth={2.5} />
                            <label htmlFor="employee-search" className={styles.srOnly}>
                                Buscar empleado por ID
                            </label>
                            <input
                                id="employee-search"
                                type="text"
                                placeholder="ID"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className={styles.searchPillInput}
                                maxLength={MAX_SEARCH_ID_LENGTH}
                                aria-label="ID del empleado"
                                aria-describedby="search-instructions"
                                disabled={loading}
                            />
                            <span id="search-instructions" className={styles.srOnly}>
                                Ingresa el ID del empleado (máximo {MAX_SEARCH_ID_LENGTH} caracteres) y presiona Enter o el botón Buscar
                            </span>
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className={styles.searchPillBtn}
                                aria-label={loading ? 'Buscando empleado...' : 'Buscar empleado'}
                                aria-busy={loading}
                            >
                                {loading ? <div className={styles.spinner} aria-hidden="true" /> : 'Buscar'}
                            </button>
                        </div>
                        
                        <button 
                            className={`${styles.searchPillBtn} ${styles.groupReportBtn}`}
                            onClick={() => setIsGroupModalOpen(true)}
                            title="Generar reporte grupal por Área/Puesto"
                        >
                            <Users size={18} />
                            <span className="hidden sm:inline">Reporte Grupal</span>
                        </button>
                    </div>

                    {/* Live region for screen readers */}
                    <div
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className={styles.srOnly}
                    >
                        {loading && 'Buscando empleado...'}
                        {employee && `Empleado ${employee.name} cargado correctamente`}
                        {notFound && `No se encontró el empleado con ID ${searchId}`}
                    </div>

                    <main id="main-content" className={styles.mainGrid} aria-label="Contenido del perfil">

                        {/* Not Found State */}
                        {notFound && (
                            <div className={`${styles.colFull} ${styles.notFound}`} role="alert">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                    <path d="M8 8l6 6M14 8l-6 6" />
                                </svg>
                                <p className="text-xl">No se encontró empleado con ID: <strong>{searchId}</strong></p>
                            </div>
                        )}

                        {/* Empty State - Initial Load */}
                        {!employee && !loading && !notFound && (
                            <div className={`${styles.colFull} ${styles.emptyState}`}>
                                <Search size={64} strokeWidth={1.5} aria-hidden="true" />
                                <h3>Busca un empleado</h3>
                                <p>Ingresa un ID de empleado en el buscador para ver su perfil completo, capacitaciones, evaluaciones y documentos.</p>
                            </div>
                        )}

                        {/* Content Section */}
                        {employee ? (
                            <>
                                {/* Left Column: Profile Card */}
                                <div className={`${styles.colProfile} ${styles.stickyProfile}`}>
                                    <ProfileHeader
                                        employee={employee}
                                        onBack={() => { }}
                                        employeeGroups={employeeGroups}
                                    />
                                </div>

                                {/* Right Column: Views */}
                                <div className={styles.colContent}>
                                    <div className={styles.contentArea}>
                                        <AnimatePresence mode="wait">
                                            {activeView === 'profile' && (
                                                <GeneralView
                                                    key="general"
                                                    employee={employee}
                                                    seniority={seniority}
                                                    trainingStats={training}
                                                    promotionInfo={promotionInfo}
                                                    onNavigate={setActiveView}
                                                    documentsCount={employee.documents?.length || 0}
                                                    iluoCount={positionData?.iluoSkills?.length || 0}
                                                />
                                            )}

                                            {activeView === 'training' && (
                                                <TrainingView
                                                    key="training"
                                                    employee={employee}
                                                    trainingStats={training}
                                                    matrixCompliance={training.matrixCompliance}
                                                    onBack={() => setActiveView('profile')}
                                                />
                                            )}

                                            {activeView === 'promotion' && (
                                                <PromotionView
                                                    key="promotion"
                                                    employee={employee}
                                                    promotionRule={promotionRule}
                                                    promotionInfo={promotionInfo}
                                                    monthsInPosition={monthsInPosition}
                                                    onBack={() => setActiveView('profile')}
                                                />
                                            )}

                                            {activeView === 'iluo' && (
                                                <ILUOView
                                                    key="iluo"
                                                    employee={employee}
                                                    positionData={positionData}
                                                    setEmployee={setEmployee}
                                                    onBack={() => setActiveView('profile')}
                                                />
                                            )}

                                            {activeView === 'documents' && (
                                                <DocumentsView
                                                    key="documents"
                                                    documents={employee.documents}
                                                    onBack={() => setActiveView('profile')}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </main>
                    
                    <GroupReportModal 
                        isOpen={isGroupModalOpen} 
                        onClose={() => setIsGroupModalOpen(false)} 
                    />
                </div>
            </div>
        </AdminLayout>
    );
}

