/**
 * Script para actualizar training_records en Firebase con datos de general.json
 * Ejecutar con: node scripts/upload-general-data.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadGeneralData() {
    try {
        // Leer datos de general.json
        const generalPath = path.join(__dirname, '..', 'src', 'data', 'general.json');
        const generalData = JSON.parse(fs.readFileSync(generalPath, 'utf-8'));

        console.log(`📂 Datos cargados: ${generalData.length} registros`);

        // Crear mapa de employeeId -> datos
        const dataMap = new Map();
        generalData.forEach(record => {
            dataMap.set(record.employeeId, record);
        });

        // Obtener registros de training_records en Firebase
        const trainingRef = collection(db, 'training_records');
        const snapshot = await getDocs(trainingRef);

        console.log(`👥 Training records en Firebase: ${snapshot.size}`);

        let updated = 0;
        let notFound = 0;
        const notFoundIds = [];

        // Actualizar cada registro
        for (const docSnap of snapshot.docs) {
            const record = docSnap.data();
            const empId = record.employeeId;

            const generalRecord = dataMap.get(empId) || dataMap.get(String(empId));

            if (generalRecord) {
                // Convertir fecha DD/MM/YYYY a YYYY-MM-DD
                let startDateFormatted = '';
                if (generalRecord.startDate) {
                    const parts = generalRecord.startDate.split('/');
                    if (parts.length === 3) {
                        startDateFormatted = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                }

                const updateData = {
                    education: generalRecord.education?.trim() || '',
                    specialty: generalRecord.specialty?.trim() || '',
                    curp: generalRecord.curp?.trim() || '',
                    area: generalRecord.area?.trim() || '',
                    startDate: startDateFormatted,
                    performanceScore: generalRecord.performanceScore ? parseFloat(generalRecord.performanceScore) : null,
                    updatedAt: new Date().toISOString()
                };

                await updateDoc(doc(db, 'training_records', docSnap.id), updateData);
                updated++;
                console.log(`✅ Actualizado: ${empId} - ${record.name || 'Sin nombre'}`);
            } else {
                notFound++;
                notFoundIds.push(empId);
            }
        }

        console.log('\n📊 Resumen:');
        console.log(`   Actualizados: ${updated}`);
        console.log(`   Sin datos en general.json: ${notFound}`);
        if (notFoundIds.length > 0 && notFoundIds.length <= 20) {
            console.log(`   IDs no encontrados: ${notFoundIds.join(', ')}`);
        }
        console.log('\n✨ Proceso completado!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

uploadGeneralData();
