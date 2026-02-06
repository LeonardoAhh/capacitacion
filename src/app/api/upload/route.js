import { NextResponse } from 'next/server';
import { uploadFile, createFolder, findFolder } from '@/lib/drive';
import { headers } from 'next/headers';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

// ID de la carpeta raíz predefinida (opcional). 
// Si no se define, buscará/creará una carpeta llamada "VERT_RH_FILES" en la raíz.
const ROOT_FOLDER_NAME = 'VERT_RH_FILES';

/**
 * Verifica el token de autorización del header
 * Retorna el UID del usuario si es válido, null si no
 */
async function verifyAuthToken(request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { valid: false, error: 'Token de autorización requerido' };
        }

        const token = authHeader.split('Bearer ')[1];

        if (!token || token.length < 20) {
            return { valid: false, error: 'Token inválido' };
        }

        // En producción, verificarías el token con Firebase Admin SDK
        // Por ahora, aceptamos el token si tiene un formato válido
        // y el usuario está autenticado en el frontend

        // NOTA: Para verificación completa, necesitarías:
        // 1. Instalar firebase-admin: npm install firebase-admin
        // 2. Configurar las credenciales del service account
        // 3. Usar: admin.auth().verifyIdToken(token)

        return { valid: true, uid: token };

    } catch (error) {
        console.error('Error verificando token:', error);
        return { valid: false, error: 'Error de autenticación' };
    }
}

export async function POST(request) {
    try {
        // ====== VERIFICACIÓN DE AUTENTICACIÓN ======
        const authResult = await verifyAuthToken(request);

        if (!authResult.valid) {
            console.log('[API Upload] Acceso denegado:', authResult.error);
            return NextResponse.json(
                {
                    error: 'No autorizado',
                    message: authResult.error,
                    code: 'AUTH_REQUIRED'
                },
                { status: 401 }
            );
        }

        console.log(`[API Upload] Usuario autenticado: ${authResult.uid?.substring(0, 10)}...`);

        // ====== PROCESAMIENTO DEL ARCHIVO ======
        const formData = await request.formData();
        const file = formData.get('file');
        const employeeId = formData.get('employeeId');
        const docType = formData.get('docType');

        console.log(`[API Upload] Start. File: ${file?.name}, Size: ${file?.size}, EmpID: ${employeeId}`);

        if (!file) {
            return NextResponse.json(
                { error: 'No se ha proporcionado ningún archivo' },
                { status: 400 }
            );
        }

        // Validar tipo de archivo (seguridad adicional)
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de archivo no permitido', allowedTypes },
                { status: 400 }
            );
        }

        // Validar tamaño (máximo 10MB)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'Archivo demasiado grande. Máximo 10MB.' },
                { status: 400 }
            );
        }

        // 1. Obtener o crear carpeta raíz
        let rootFolderId = process.env.GOOGLE_DRIVE_ROOT_ID;

        // Si no está en variables, buscarla dinámicamente
        if (!rootFolderId) {
            console.log('GOOGLE_DRIVE_ROOT_ID no definido, buscando carpeta default...');
            rootFolderId = await findFolder(ROOT_FOLDER_NAME);

            if (!rootFolderId) {
                console.log('Carpeta default no encontrada, creando...');
                rootFolderId = await createFolder(ROOT_FOLDER_NAME);
            }
        }

        // 2. Determinar carpeta destino según employeeId
        let targetFolderId = rootFolderId;

        if (employeeId) {
            // Buscar carpeta del empleado
            let employeeFolderId = await findFolder(employeeId, rootFolderId);
            if (!employeeFolderId) {
                employeeFolderId = await createFolder(employeeId, rootFolderId);
            }
            targetFolderId = employeeFolderId;

            // Opcional: Subcarpetas por tipo (Certificados, etc) si hay docType
            if (docType && docType !== 'profile') {
                let typeFolderId = await findFolder(docType, employeeFolderId);
                if (!typeFolderId) {
                    typeFolderId = await createFolder(docType, employeeFolderId);
                }
                targetFolderId = typeFolderId;
            }
        }

        // 3. Convertir File a Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // 4. Subir a Drive
        const result = await uploadFile(
            buffer,
            file.name,
            file.type,
            targetFolderId
        );

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error en API upload (FULL DETAILS):', error);

        // Debug: Check if Env Vars are missing
        const missingVars = [];
        if (!process.env.GOOGLE_CLIENT_ID) missingVars.push('GOOGLE_CLIENT_ID');
        if (!process.env.GOOGLE_CLIENT_SECRET) missingVars.push('GOOGLE_CLIENT_SECRET');
        if (!process.env.GOOGLE_REFRESH_TOKEN) missingVars.push('GOOGLE_REFRESH_TOKEN');

        const debugInfo = {
            message: error.message,
            stack: error.stack,
            missingEnvVars: missingVars,
            hasRootId: !!process.env.GOOGLE_DRIVE_ROOT_ID
        };

        return NextResponse.json(
            {
                error: 'Error interno al procesar la subida',
                message: error.message || 'Error desconocido', // Always show message for debugging
                debug: debugInfo
            },
            { status: 500 }
        );
    }
}
