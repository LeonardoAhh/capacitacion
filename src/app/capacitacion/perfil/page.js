'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import { BackgroundLines } from '@/components/ui/BackgroundLines';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { checkPromotionCriteria, calculateMonthsInPosition } from '@/lib/promotionUtils';

// Components
import ProfileHeader from './components/ProfileHeader';
import GeneralView from './components/views/GeneralView';
import TrainingView from './components/views/TrainingView';
import PromotionView from './components/views/PromotionView';
import ILUOView from './components/views/ILUOView';
import DocumentsView from './components/views/DocumentsView';
import { Search, ArrowLeft } from 'lucide-react';

// Styles
import styles from './page.module.css';

export default function PerfilPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [employee, setEmployee] = useState(null);
    const [positionData, setPositionData] = useState(null);
    const [promotionRule, setPromotionRule] = useState(null);
    const [notFound, setNotFound] = useState(false);

    // View state for slide navigation
    const [activeView, setActiveView] = useState('profile');

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
        setActiveView('profile');

        try {
            const directRef = doc(db, 'training_records', searchId.trim());
            let empDoc = await getDoc(directRef);
            let empData = null;

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

                if (empData.position) {
                    const posName = empData.position.toUpperCase().trim();
                    const posQuery = query(
                        collection(db, 'positions'),
                        where('name', '==', posName)
                    );
                    const posSnap = await getDocs(posQuery);
                    if (!posSnap.empty) {
                        setPositionData({ id: posSnap.docs[0].id, ...posSnap.docs[0].data() });
                    }

                    const rulesSnap = await getDocs(collection(db, 'promotion_rules'));
                    const rule = rulesSnap.docs.find(d =>
                        d.data().currentPosition === posName
                    );
                    if (rule) {
                        setPromotionRule({ id: rule.id, ...rule.data() });
                    }
                }

                toast.success('✓', empData.name);
            } else {
                setNotFound(true);
                toast.error('No Encontrado', 'No existe empleado con ese ID');
            }
        } catch (error) {
            console.error('Error searching employee:', error);
            toast.error('Error', 'Error al buscar el empleado');
        } finally {
            setLoading(false);
        }
    }, [searchId, toast]);

    const analyzeTraining = () => {
        if (!employee) return { approved: [], failed: [], pending: [], all: [], matrixCompliance: 0 };

        const history = employee.history || [];
        const requiredCourses = positionData?.requiredCourses || [];

        const approved = [];
        const failed = [];

        history.forEach(record => {
            const courseName = record.courseName || record.course;
            const score = parseFloat(record.score) || parseFloat(record.qualification) || 0;
            const isApproved = record.status === 'approved' || (record.status === undefined && score >= 80);

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
    };

    const getPromotionInfo = () => {
        if (!employee || !promotionRule) return null;
        return checkPromotionCriteria(employee, promotionRule);
    };

    const training = analyzeTraining();
    const promotionInfo = getPromotionInfo();
    const seniority = employee ? calculateSeniority(employee.startDate) : null;
    const monthsInPosition = employee?.promotionData?.positionStartDate
        ? calculateMonthsInPosition(employee.promotionData.positionStartDate)
        : 0;

    return (
        <div className={styles.main}>
            <BackgroundLines className={styles.bgDecoration} />

            <div className={styles.container}>
                {/* Header */}
                <header className={styles.topBar}>
                    <div className={styles.topBarLeft}>
                        <Link href="/dashboard" className={styles.topBarBack}>
                            <ArrowLeft size={18} strokeWidth={2} />
                        </Link>
                        <span className={styles.topBarTitle}>Perfil</span>
                    </div>

                    <div className={styles.topBarCenter}>
                        <div className={styles.searchPill}>
                            <Search className={styles.searchPillIcon} size={16} strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="ID"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className={styles.searchPillInput}
                                maxLength={5}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className={styles.searchPillBtn}
                            >
                                {loading ? <div className={styles.spinner} /> : 'Buscar'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.topBarRight}>
                        <ProfileDropdown />
                    </div>
                </header>

                <main className={styles.mainGrid}>

                    {/* Not Found Integration */}
                    {notFound && (
                        <div className={`${styles.colFull} ${styles.notFound}`}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M8 8l6 6M14 8l-6 6" />
                            </svg>
                            <p className="text-xl">No se encontró empleado con ID: <strong>{searchId}</strong></p>
                        </div>
                    )}

                    {/* Content Section */}
                    {employee ? (
                        <>
                            {/* Left Column: Profile Card */}
                            <div className={`${styles.colProfile} ${styles.stickyProfile}`}>
                                <ProfileHeader employee={employee} onBack={() => { }} />
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
            </div>
        </div>
    );
}
