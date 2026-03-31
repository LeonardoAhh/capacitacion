'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/Button/Button';
import { Select } from '@/components/ui/Select/Select';
import { useToast } from '@/components/ui/Toast/Toast';
import styles from './page.module.css';

export default function ConstanciasPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const printRef = useRef(null);

    // State
    const [employeeIdInput, setEmployeeIdInput] = useState('');
    const [employeeData, setEmployeeData] = useState(null);
    const [courses, setCourses] = useState([]); // approved courses from history
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loadingEmp, setLoadingEmp] = useState(false);
    const [folio, setFolio] = useState('');

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [authLoading, user, router]);

    // Search employee by employeeId
    const handleSearch = useCallback(async () => {
        const id = employeeIdInput.trim();
        if (!id) return;
        setLoadingEmp(true);
        setEmployeeData(null);
        setCourses([]);
        setSelectedCourse(null);
        try {
            const snap = await getDoc(doc(db, 'training_records', id));
            if (!snap.exists()) {
                toast.error('No encontrado', `No existe registro para el empleado ${id}.`);
                setLoadingEmp(false);
                return;
            }
            const data = snap.data();
            const history = data.history || [];

            // Build list of approved courses with date
            const approved = history
                .filter(h => h.status === 'approved' || (!h.status && parseFloat(h.score || h.qualification || 0) >= 70))
                .map(h => ({
                    name: h.courseName || h.course || '(Sin nombre)',
                    date: h.date || '',
                    score: parseFloat(h.score || h.qualification || 0),
                }))
                // Remove duplicates keeping latest
                .reduce((acc, cur) => {
                    const existing = acc.find(a => a.name === cur.name);
                    if (!existing) acc.push(cur);
                    else if (cur.date > existing.date) Object.assign(existing, cur);
                    return acc;
                }, []);

            setEmployeeData({
                name: data.name || '',
                employeeId: data.employeeId || id,
                department: data.department || '',
                position: data.position || '',
            });
            setCourses(approved);

            // Auto-select if only one course
            if (approved.length === 1) setSelectedCourse(approved[0]);

            // Auto-generate folio
            setFolio(`VTX-${id}-${Date.now().toString(36).toUpperCase()}`);
        } catch (err) {
            console.error(err);
            toast.error('Error', 'No se pudo consultar el registro del empleado.');
        } finally {
            setLoadingEmp(false);
        }
    }, [employeeIdInput, toast]);

    const handlePrint = useCallback(() => {
        const el = printRef.current;
        if (!el) return;
        const todayStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        const printWindow = window.open('', '_blank', 'width=900,height=650');
        printWindow.document.write(`<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8"/>
<title>Constancia — ${employeeData?.name || ''}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Roboto:wght@400;500;600&display=swap');
  @page { size: letter portrait; margin: 2cm 2.5cm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Roboto', sans-serif; background: #fff; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cert { display: flex; flex-direction: column; width: 100%; min-height: 100vh; background: #fff; }
  .accent { height: 6px; background: #1d4ed8; }
  .accent-bot { height: 3px; background: #1d4ed8; opacity: 0.35; margin-top: auto; }
  .cert-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
  .cert-logo { display: flex; align-items: center; gap: 0.6rem; }
  .cert-company { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 800; letter-spacing: 0.06em; color: #111; }
  .cert-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; font-size: 0.75rem; color: #6b7280; }
  .cert-body { padding: 2rem 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.85rem; text-align: center; }
  .cert-intro { font-family: 'Montserrat', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.18em; color: #1d4ed8; text-transform: uppercase; }
  .cert-text { font-size: 0.9rem; line-height: 1.6; color: #111; }
  .cert-employee { font-family: 'Montserrat', sans-serif; font-size: 1.75rem; font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0.25rem 0; }
  .cert-course { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: #1d4ed8; padding: 0.5rem 1.5rem; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; width: 100%; margin: 0.25rem 0; }
  .cert-sigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 1.5rem 2.5rem 2rem; border-top: 1px solid #e5e7eb; margin-top: 4rem; }
  .sig-block { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
  .sig-line { width: 100%; height: 1px; background: #111; margin-bottom: 0.4rem; }
  .sig-label { font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; text-align: center; }
  .sig-name { font-size: 0.75rem; font-weight: 600; color: #111; text-align: center; }
  img.logo { width: 44px; height: 44px; object-fit: contain; }
</style></head><body>
<div class="cert">
  <div class="accent"></div>
  <div class="cert-header">
    <div class="cert-logo">
      <img class="logo" src="${window.location.origin}/logo-vino-plastic.png" alt="Viñoplastic"/>
      <span class="cert-company">VIÑOPLASTIC</span>
    </div>
    <div class="cert-meta">
      <span>Folio: ${folio}</span>
      <span>${todayStr}</span>
    </div>
  </div>
  <div class="cert-body">
    <p class="cert-intro">Constancia de Capacitación</p>
    <p class="cert-text">La empresa <strong>Viñoplastic S.A. de C.V.</strong> hace constar que:</p>
    <p class="cert-employee">${employeeData?.name || ''}</p>
    <p class="cert-text">Con número de empleado <strong>${employeeData?.employeeId || ''}</strong>, adscrito al área de <strong>${employeeData?.department || ''}</strong>${employeeData?.position ? `, en el puesto de ${employeeData.position}` : ''}, ha concluido satisfactoriamente el curso:</p>
    <p class="cert-course">${selectedCourse?.name || ''}</p>
    ${selectedCourse?.date ? `<p class="cert-text">Completado el día <strong>${selectedCourse.date}</strong>.</p>` : ''}
    ${selectedCourse?.score > 0 ? `<p class="cert-text">Calificación obtenida: <strong>${selectedCourse.score}%</strong></p>` : ''}
  </div>
  <div class="cert-sigs">
    <div class="sig-block"><div class="sig-line"></div><p class="sig-label">Firma del Participante</p><p class="sig-name">${employeeData?.name || ''}</p></div>
    <div class="sig-block"><div class="sig-line"></div><p class="sig-label">Instructor / Evaluador</p><p class="sig-name">&nbsp;</p></div>
    <div class="sig-block"><div class="sig-line"></div><p class="sig-label">Recursos Humanos</p><p class="sig-name">&nbsp;</p></div>
  </div>
  <div class="accent-bot"></div>
</div>
<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
</body></html>`);
        printWindow.document.close();
    }, [employeeData, selectedCourse, folio]);

    const today = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const courseOptions = courses.map(c => ({ value: c.name, label: c.name }));

    const preview = employeeData && selectedCourse;

    return (
        <AdminLayout title="Constancias">
            <div className={styles.page}>
                {/* ─── Search Panel ─── */}
                <section className={styles.searchPanel}>
                    <h2 className={styles.panelTitle}>Generar Constancia</h2>
                    <p className={styles.panelDesc}>
                        Ingresa el número de empleado para consultar sus cursos aprobados.
                    </p>

                    <div className={styles.searchRow}>
                        <input
                            className={styles.input}
                            placeholder="No. Empleado"
                            value={employeeIdInput}
                            onChange={e => setEmployeeIdInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={loadingEmp || !employeeIdInput.trim()}>
                            {loadingEmp ? 'Buscando...' : 'Buscar'}
                        </Button>
                    </div>

                    {employeeData && (
                        <div className={styles.employeeCard}>
                            <div className={styles.empInfo}>
                                <span className={styles.empName}>{employeeData.name}</span>
                                <span className={styles.empMeta}>
                                    #{employeeData.employeeId} &bull; {employeeData.department} &bull; {employeeData.position}
                                </span>
                            </div>
                            <div className={styles.courseSelector}>
                                <label className={styles.label}>Curso a certificar</label>
                                {courses.length === 0 ? (
                                    <p className={styles.noCoursesMsg}>Sin cursos aprobados registrados.</p>
                                ) : (
                                    <Select
                                        value={selectedCourse?.name || ''}
                                        onChange={value => setSelectedCourse(courses.find(c => c.name === value) || null)}
                                        options={courseOptions}
                                        placeholder="Seleccionar curso..."
                                    />
                                )}
                            </div>

                            <div className={styles.folioRow}>
                                <label className={styles.label}>Folio</label>
                                <input
                                    className={styles.input}
                                    value={folio}
                                    onChange={e => setFolio(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {preview && (
                        <div className={styles.actions}>
                            <Button onClick={handlePrint} variant="primary">
                                Imprimir / Guardar PDF
                            </Button>
                        </div>
                    )}
                </section>

                {/* ─── Certificate Preview ─── */}
                {preview && (
                    <section className={styles.previewSection} aria-label="Vista previa de constancia">
                        <h2 className={styles.panelTitle}>Vista previa</h2>
                        <div className={styles.previewWrapper}>
                            <div className={styles.certificate} ref={printRef} id="certificate">
                                {/* Top accent bar */}
                                <div className={styles.accentBar} />

                                {/* Header */}
                                <div className={styles.certHeader}>
                                    <div className={styles.certLogo}>
                                        <Image src="/logo-vino-plastic.png" alt="Viñoplastic" width={44} height={44} style={{ objectFit: 'contain' }} />
                                        <span className={styles.certCompany}>VIÑOPLASTIC</span>
                                    </div>
                                    <div className={styles.certMeta}>
                                        <span className={styles.certFolio}>Folio: {folio}</span>
                                        <span className={styles.certDate}>{today}</span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className={styles.certBody}>
                                    <p className={styles.certIntro}>CONSTANCIA DE CAPACITACIÓN</p>

                                    <p className={styles.certText}>
                                        La empresa <strong>Viñoplastic S.A. de C.V.</strong> hace constar que:
                                    </p>

                                    <p className={styles.certEmployeeName}>{employeeData.name}</p>

                                    <p className={styles.certText}>
                                        Con número de empleado <strong>{employeeData.employeeId}</strong>,
                                        adscrito al área de <strong>{employeeData.department}</strong>{employeeData.position ? `, en el puesto de ${employeeData.position}` : ''},
                                        ha concluido satisfactoriamente el curso:
                                    </p>

                                    <p className={styles.certCourseName}>{selectedCourse.name}</p>

                                    {selectedCourse.date && (
                                        <p className={styles.certText}>
                                            Completado el día <strong>{selectedCourse.date}</strong>.
                                        </p>
                                    )}

                                    {selectedCourse.score > 0 && (
                                        <p className={styles.certText}>
                                            Calificación obtenida: <strong>{selectedCourse.score}%</strong>
                                        </p>
                                    )}
                                </div>

                                {/* Signatures */}
                                <div className={styles.certSignatures}>
                                    <div className={styles.sigBlock}>
                                        <div className={styles.sigLine} />
                                        <p className={styles.sigLabel}>Firma del Participante</p>
                                        <p className={styles.sigName}>{employeeData.name}</p>
                                    </div>
                                    <div className={styles.sigBlock}>
                                        <div className={styles.sigLine} />
                                        <p className={styles.sigLabel}>Instructor / Evaluador</p>
                                        <p className={styles.sigName}>&nbsp;</p>
                                    </div>
                                    <div className={styles.sigBlock}>
                                        <div className={styles.sigLine} />
                                        <p className={styles.sigLabel}>Recursos Humanos</p>
                                        <p className={styles.sigName}>&nbsp;</p>
                                    </div>
                                </div>

                                {/* Bottom accent */}
                                <div className={styles.accentBarBottom} />
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
