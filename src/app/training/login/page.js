'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TrainingLogin from '@/components/TrainingLogin/TrainingLogin';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TrainingLoginPage() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Optimized handlers to prevent input lag on mobile
    const handleEmployeeIdChange = (value) => {
        setEmployeeId(value);
        setError('');
    };

    const handleEmployeeIdBlur = () => {
        setEmployeeId(prev => prev.toUpperCase());
    };

    const handlePasswordChange = (value) => {
        setPassword(value);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Lógica simple de verificación
            // 1. Buscar empleado
            const employeesRef = collection(db, 'employees_programacion');
            const q = query(employeesRef, where('employeeId', '==', employeeId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('ID de empleado no encontrado');
                setLoading(false);
                return;
            }

            const employeeDoc = querySnapshot.docs[0];
            const employeeData = employeeDoc.data();

            // 2. Verificar "password" (usaremos accessCode como contraseña temporalmente o implementaremos una real después)
            // Si el input 'password' coincide con el accessCode del empleado
            if (employeeData.accessCode !== password) {
                // Si no coincide, y tampoco es una contraseña maestra (opcional para pruebas)
                setError('Contraseña incorrecta');
                setLoading(false);
                return;
            }

            // 3. Éxito
            // Guardar sesión específica de capacitación
            const sessionData = {
                id: employeeDoc.id,
                employeeId: employeeData.employeeId,
                name: employeeData.name || employeeData.Nombre,
                position: employeeData.position || employeeData.Puesto,
                department: employeeData.department || employeeData.Departamento,
                role: 'employee_training',
                nickname: employeeData.nickname || '',
                avatar: employeeData.avatar || '',
                theme: employeeData.theme || 'light'
            };

            sessionStorage.setItem('training_session', JSON.stringify(sessionData));

            // Trigger animación
            setLoading(false);
            setIsSuccess(true);
            setTimeout(() => {
                router.push('/training/dashboard');
            }, 2000); // Reduced to 2s for better UX

        } catch (err) {
            console.error('Error login training:', err);
            setError('Error de conexión. Intenta más tarde.');
            setLoading(false);
        }
    };

    return (
        <>
            <Link href="/" style={{
                position: 'fixed',
                top: '20px',
                left: '20px',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textDecoration: 'none',
                color: '#333',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
            }}>
                <ArrowLeft size={18} />
                <span>Volver</span>
            </Link>
            <TrainingLogin
                employeeId={employeeId}
                setEmployeeId={handleEmployeeIdChange}
                onBlurEmployeeId={handleEmployeeIdBlur}
                password={password}
                setPassword={handlePasswordChange}
                error={error}
                loading={loading}
                onSubmit={handleSubmit}
                isSuccess={isSuccess}
            />
        </>
    );
}
