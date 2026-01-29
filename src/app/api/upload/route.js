import { NextResponse } from 'next/server';
import { uploadFile, createFolder, findFolder } from '@/lib/drive';

// ID de la carpeta raíz predefinida (opcional). 
// Si no se define, buscará/creará una carpeta llamada "VERT_RH_FILES" en la raíz.
const ROOT_FOLDER_NAME = 'VERT_RH_FILES';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const employeeId = formData.get('employeeId'); // Para organizar por empleado
        const docType = formData.get('docType'); // 'profile', 'certificate', 'document'

        if (!file) {
            return NextResponse.json(
                { error: 'No se ha proporcionado ningún archivo' },
                { status: 400 }
            );
        }

        // 1. Validar carpeta raíz
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_ID;

        if (!rootFolderId) {
            return NextResponse.json(
                {
                    error: 'Configuración faltante',
                    details: 'Falta la variable GOOGLE_DRIVE_ROOT_ID en .env.local. La Service Account necesita una carpeta compartida donde subir archivos.'
                },
                { status: 500 }
            );
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
        console.error('Error en API upload:', error);
        return NextResponse.json(
            {
                error: 'Error interno al procesar la subida',
                details: error.message, // Mensaje técnico
                stack: error.stack, // Stack trace para ver dónde falló
                debug: {
                    hasRootId: !!process.env.GOOGLE_DRIVE_ROOT_ID,
                    rootIdLength: process.env.GOOGLE_DRIVE_ROOT_ID?.length
                }
            },
            { status: 500 }
        );
    }
}
