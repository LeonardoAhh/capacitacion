import { NextResponse } from 'next/server';
import { uploadFile, createFolder, findFolder } from '@/lib/drive';
import { deserializeSession } from '@/lib/cookieSign';

export const dynamic = 'force-dynamic';

const ROOT_FOLDER_NAME = 'VERT_RH_FILES';
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Verifica que existe una cookie de sesión admin válida en la request.
 * La cookie __session es httpOnly, por lo que sólo puede ser leída server-side.
 */
function verifySessionCookie(request) {
    try {
        const sessionCookie = request.cookies.get('__session');
        if (!sessionCookie?.value) {
            return { valid: false, error: 'Sesión requerida' };
        }

        const session = deserializeSession(sessionCookie.value);

        if (!session || session?.type !== 'admin') {
            return { valid: false, error: 'Acceso no autorizado' };
        }

        return { valid: true };
    } catch {
        return { valid: false, error: 'Sesión inválida' };
    }
}

export async function POST(request) {
    try {
        // ====== VERIFICACIÓN DE AUTENTICACIÓN ======
        const authResult = verifySessionCookie(request);

        if (!authResult.valid) {
            return NextResponse.json(
                {
                    error: 'No autorizado',
                    message: authResult.error,
                    code: 'AUTH_REQUIRED'
                },
                { status: 401 }
            );
        }

        // ====== PROCESAMIENTO DEL ARCHIVO ======
        const formData = await request.formData();
        const file = formData.get('file');
        const employeeId = formData.get('employeeId');
        const docType = formData.get('docType');

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
        console.error('[API Upload] Error:', error);

        // Error de token de Google Drive expirado
        if (error.code === 'DRIVE_TOKEN_EXPIRED' || error.message?.includes('invalid_grant')) {
            return NextResponse.json(
                {
                    error: 'Token de Google Drive expirado',
                    message: 'La conexión con Google Drive ha expirado. Contacta al administrador para renovar el acceso.',
                    code: 'DRIVE_TOKEN_EXPIRED'
                },
                { status: 503 }
            );
        }

        // En desarrollo: incluir detalles para depuración
        const responseBody = {
            error: 'Error interno al procesar la subida',
            message: IS_DEV ? (error.message || 'Error desconocido') : 'Error interno del servidor',
        };

        if (IS_DEV) {
            const missingVars = [];
            if (!process.env.GOOGLE_CLIENT_ID) missingVars.push('GOOGLE_CLIENT_ID');
            if (!process.env.GOOGLE_CLIENT_SECRET) missingVars.push('GOOGLE_CLIENT_SECRET');
            if (!process.env.GOOGLE_REFRESH_TOKEN) missingVars.push('GOOGLE_REFRESH_TOKEN');
            responseBody.debug = {
                stack: error.stack,
                missingEnvVars: missingVars,
                hasRootId: !!process.env.GOOGLE_DRIVE_ROOT_ID,
            };
        }

        return NextResponse.json(responseBody, { status: 500 });
    }
}
