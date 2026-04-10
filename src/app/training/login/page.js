'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import UnifiedLogin from '@/components/auth/UnifiedLogin';
import { createSession } from '@/lib/sessionApi';

export default function TrainingLoginPage() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleEmployeeIdBlur = () => {
        setEmployeeId(prev => prev.toUpperCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
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

            if (employeeData.accessCode !== password) {
                setError('Contraseña incorrecta');
                setLoading(false);
                return;
            }

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
            await signInAnonymously(auth);
            await createSession('training');

            setLoading(false);
            setIsSuccess(true);

            setTimeout(() => {
                router.push('/');
            }, 1500);

        } catch (err) {
            console.error('Error login training:', err);
            setError('Error de conexión. Intenta más tarde.');
            setLoading(false);
        }
    };

    const fields = [
        {
            id: 'employeeId',
            label: 'ID de Empleado',
            value: employeeId,
            onChange: (e) => { setError(''); setEmployeeId(e.target.value); },
            onBlur: handleEmployeeIdBlur,
            placeholder: 'Tu ID de empleado',
            inputMode: 'numeric',
        },
        {
            id: 'password',
            label: 'Contraseña',
            type: 'password',
            value: password,
            onChange: (e) => { setError(''); setPassword(e.target.value); },
            placeholder: '••••••••',
            autoComplete: 'current-password',
        },
    ];

    return (
        <UnifiedLogin
            portal="Portal de Capacitación"
            title="Bienvenido"
            subtitle="Módulo de entrenamiento"
            fields={fields}
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
            submitText="Iniciar Sesión"
            isSuccess={isSuccess}
            backHref="/"
            backLabel="Inicio"
        />
    );
}
