import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let driveClient = null;
function getDriveClient() {
    if (driveClient) return driveClient;
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;

    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    driveClient = google.drive({ version: 'v3', auth: oauth2Client });
    return driveClient;
}

async function fetchViaDriveApi(fileId) {
    const drive = getDriveClient();
    if (!drive) return null;

    try {
        const meta = await drive.files.get({
            fileId,
            fields: 'id, mimeType, size',
            supportsAllDrives: true,
        });
        const contentType = meta.data?.mimeType || 'application/octet-stream';
        if (!contentType.startsWith('image/')) return null;

        const res = await drive.files.get(
            { fileId, alt: 'media', supportsAllDrives: true },
            { responseType: 'arraybuffer' }
        );
        const buffer = res.data;
        if (!buffer || buffer.byteLength < 100) return null;
        return { buffer, contentType };
    } catch (err) {
        console.warn(`[drive-image] API auth fallback falló para id=${fileId}:`, err.message);
        return null;
    }
}

/**
 * GET /api/drive-image?id=FILE_ID&sz=w1920
 * Proxy que descarga una imagen pública de Google Drive y la sirve
 * directamente, evitando CORS y redirects del navegador.
 *
 * Drive ya no responde de forma confiable a `uc?export=view`
 * (regresa HTML o página de virus-scan). Probamos varios endpoints
 * en cascada y validamos que el content-type sea realmente imagen.
 */

const buildEndpoints = (id, sz) => [
    `https://lh3.googleusercontent.com/d/${id}=${sz}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=${sz}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/uc?export=view&id=${id}`,
];

async function tryFetch(url) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            redirect: 'follow',
        });

        if (!res.ok) return null;

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) return null;

        const buffer = await res.arrayBuffer();
        if (!buffer || buffer.byteLength < 100) return null;

        return { buffer, contentType };
    } catch {
        return null;
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const sz = searchParams.get('sz') || 'w1920';

    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9=]+$/.test(sz)) {
        return NextResponse.json({ error: 'Tamaño inválido' }, { status: 400 });
    }

    for (const url of buildEndpoints(fileId, sz)) {
        const result = await tryFetch(url);
        if (result) {
            return new NextResponse(result.buffer, {
                status: 200,
                headers: {
                    'Content-Type': result.contentType,
                    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
                },
            });
        }
    }

    // Fallback final: usar Drive API autenticada (OAuth refresh token).
    // Bypasea problemas de permisos públicos porque actuamos como dueño.
    const apiResult = await fetchViaDriveApi(fileId);
    if (apiResult) {
        return new NextResponse(apiResult.buffer, {
            status: 200,
            headers: {
                'Content-Type': apiResult.contentType,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
            },
        });
    }

    console.warn(`[drive-image] todos los endpoints fallaron para id=${fileId}`);
    return NextResponse.json(
        {
            error:
                'No se pudo obtener la imagen desde Drive. Verifica que el archivo exista y que el GOOGLE_REFRESH_TOKEN esté vigente.',
        },
        { status: 502 }
    );
}
