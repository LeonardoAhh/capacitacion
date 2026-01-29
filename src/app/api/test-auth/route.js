import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Mostrar estado de variables (Ocultando secretos)
        const debugEnv = {
            HAS_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
            HAS_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
            HAS_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
            REFRESH_TOKEN_LENGTH: process.env.GOOGLE_REFRESH_TOKEN?.length || 0,
            ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_ID || 'No definido (Usará fallback)'
        };

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
            return NextResponse.json({
                status: 'ERROR_CONFIG',
                message: 'Faltan variables de entorno críticas',
                env: debugEnv
            }, { status: 500 });
        }

        // 2. Intentar inicializar Auth
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // 3. Intentar llamada real a Drive
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
            firstFile: response.data.files[0] || 'Ninguno',
            env: debugEnv
        });

    } catch (error) {
        console.error('Test Auth Error:', error);
        return NextResponse.json({
            status: 'ERROR_CONNECTION',
            message: error.message,
            stack: error.stack,
            errorObj: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }, { status: 500 });
    }
}
