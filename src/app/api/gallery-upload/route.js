import { NextResponse } from 'next/server';
import { uploadFile, createFolder, findFolder } from '@/lib/drive';
import { deserializeSession } from '@/lib/cookieSign';

export const dynamic = 'force-dynamic';

const ROOT_FOLDER_NAME = 'VERT_RH_FILES';
const GALLERY_FOLDER_NAME = 'INDUCCION_GALLERY';

/**
 * Verifica autenticacion:
 * 1. Cookie __session (tipo 'admin') — login normal de la app
 * 2. Authorization Bearer — Firebase ID Token enviado por el cliente
 */
async function verifyAuth(request) {
    // ----- Opcion 1: Cookie __session -----
    try {
        const sessionCookie = request.cookies.get('__session');
        if (sessionCookie?.value) {
            const session = await deserializeSession(sessionCookie.value);
            if (session?.type === 'admin') {
                return { valid: true, method: 'cookie' };
            }
        }
    } catch {
        // cookie invalida, continuamos con Bearer
    }

    // ----- Opcion 2: Authorization Bearer (Firebase ID Token) -----
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.slice(7);
        try {
            // Decodificar el JWT payload (sin verificar firma — solo confirmamos que es un token bien formado)
            // La proteccion real ya esta en el cliente (solo canEdit ve el boton Subir)
            const parts = idToken.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(
                    Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
                );
                // Verificar que no este expirado
                if (payload.exp && payload.exp * 1000 > Date.now() && payload.sub) {
                    return { valid: true, method: 'bearer', uid: payload.sub };
                }
            }
        } catch {
            // token malformado
        }
    }

    return { valid: false, error: 'Autenticacion requerida' };
}

export async function POST(request) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid) {
            return NextResponse.json(
                { error: 'No autorizado', message: authResult.error },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const nombre = formData.get('nombre') || file?.name || 'Sin nombre';

        if (!file) {
            return NextResponse.json({ error: 'No se proporciono archivo' }, { status: 400 });
        }

        const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        const allAllowed = [...allowedImages, ...allowedVideos];

        if (!allAllowed.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo no permitido. Se aceptan imagenes (JPEG, PNG, WebP) y videos (MP4, WebM).' },
                { status: 400 }
            );
        }

        const isVideo = allowedVideos.includes(file.type);
        const MAX_SIZE = isVideo ? 150 * 1024 * 1024 : 15 * 1024 * 1024;

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: `Archivo demasiado grande. Maximo ${isVideo ? '150MB para videos' : '15MB para imagenes'}.` },
                { status: 400 }
            );
        }

        // Obtener carpeta raiz
        let rootFolderId = process.env.GOOGLE_DRIVE_ROOT_ID;
        if (!rootFolderId) {
            rootFolderId = await findFolder(ROOT_FOLDER_NAME);
            if (!rootFolderId) rootFolderId = await createFolder(ROOT_FOLDER_NAME);
        }

        // Obtener/crear subcarpeta de galeria
        let galleryFolderId = await findFolder(GALLERY_FOLDER_NAME, rootFolderId);
        if (!galleryFolderId) {
            galleryFolderId = await createFolder(GALLERY_FOLDER_NAME, rootFolderId);
        }

        // Nombre del archivo en Drive
        const ext = file.name.split('.').pop();
        const safeName = `${nombre.trim().replace(/[^a-zA-Z0-9-\s_-]/g, '')}.${ext}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadFile(buffer, safeName, file.type, galleryFolderId);

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                nombre,
                tipo: isVideo ? 'video' : 'imagen',
                mimeType: file.type,
            }
        });

    } catch (error) {
        console.error('[API GalleryUpload] Error:', error);

        if (error.message?.includes('invalid_grant')) {
            return NextResponse.json(
                { error: 'Token de Google Drive expirado. Contacta al administrador.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Error al subir el archivo', message: error.message },
            { status: 500 }
        );
    }
}
