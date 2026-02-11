'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import positionsData from '@/data/positions.json';
import departmentsData from '@/data/departments.json';
import areasData from '@/data/areas.json';
import { Save, Loader2, Check } from 'lucide-react';

export default function CatalogSeeder() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSeed = async () => {
        setLoading(true);
        setStatus({ type: 'info', message: 'Iniciando carga...' });

        try {
            // Process Positions
            // The JSON structure is [{ "positions": "NAME" }, ...]
            const positionsList = positionsData
                .map(p => p.positions)
                .filter(Boolean)
                .sort();

            await setDoc(doc(db, 'datos', 'positions'), { items: positionsList });

            // Process Departments
            // The JSON structure is [{ "department": "NAME" }, ...]
            const departmentsList = departmentsData
                .map(d => d.department)
                .filter(Boolean)
                .sort();

            await setDoc(doc(db, 'datos', 'departments'), { items: departmentsList });

            // Process Areas
            // The JSON structure is [{ "área": "NAME" }, ...]
            const areasList = areasData
                .map(a => a['área'])
                .filter(Boolean)
                .sort();

            await setDoc(doc(db, 'datos', 'areas'), { items: areasList });

            setStatus({ type: 'success', message: '¡Catálogos actualizados correctamente en Firebase!' });
        } catch (error) {
            console.error('Error seeding catalogs:', error);
            setStatus({ type: 'error', message: 'Error: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm my-4">
            <h3 className="font-bold text-lg mb-2">Administración de Catálogos</h3>
            <p className="text-sm text-gray-600 mb-4">
                Usa este botón para cargar los archivos JSON (Puestos, Departamentos, Áreas) a Firebase.
                Esto sobrescribirá los datos existentes en la colección 'datos'.
            </p>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Cargando...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Actualizar Catálogos
                        </>
                    )}
                </button>

                {status.message && (
                    <div className={`text-sm flex items-center gap-2 ${status.type === 'success' ? 'text-green-600' :
                            status.type === 'error' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                        {status.type === 'success' && <Check size={18} />}
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}
