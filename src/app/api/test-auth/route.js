import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

/**
 * API de diagnóstico de Google Drive
 * PROTEGIDA: Solo accesible con un token especial de administrador
 * En producción, considera eliminar este endpoint completamente
 */
export async function GET(request) {
    try {
        // ====== VERIFICACIÓN DE ACCESO ADMIN ======
        const authHeader = request.headers.get('authorization');
        const adminToken = process.env.ADMIN_DEBUG_TOKEN;

        // Si no hay token de admin configurado, bloquear completamente
        if (!adminToken) {
            return NextResponse.json({
                status: 'DISABLED',
                message: 'Endpoint de diagnóstico deshabilitado en este entorno'
            }, { status: 403 });
        }

        // Verificar token de admin
        if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
            return NextResponse.json({
                status: 'UNAUTHORIZED',
                message: 'Token de administrador requerido'
            }, { status: 401 });
        }

        // ====== DIAGNÓSTICO ======
        // Solo mostrar si las variables existen, NO sus valores
        const debugEnv = {
            HAS_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
            HAS_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
            HAS_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
            HAS_ROOT_FOLDER_ID: !!process.env.GOOGLE_DRIVE_ROOT_ID,
            // NO exponer valores reales
        };

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
            return NextResponse.json({
                status: 'ERROR_CONFIG',
                message: 'Faltan variables de entorno críticas',
                env: debugEnv
            }, { status: 500 });
        }

        // Intentar inicializar Auth
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // Intentar llamada real a Drive
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Listar 1 archivo cualquiera para probar acceso
        const response = await drive.files.list({
            pageSize: 1,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        return NextResponse.json({
            status: 'SUCCESS',
            message: 'Conexión a Google Drive exitosa',
            filesFound: response.data.files.length,
            env: debugEnv
        });

    } catch (error) {
        console.error('Test Auth Error:', error);

        // No exponer detalles del stack trace
        return NextResponse.json({
            status: 'ERROR_CONNECTION',
            message: 'Error de conexión a Google Drive',
            errorType: error.code || 'UNKNOWN'
        }, { status: 500 });
    }
}
