'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// La creación de empleados ahora se hace desde el modal en /employees.
export default function NewEmployeeRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/employees');
    }, [router]);

    return null;
}
