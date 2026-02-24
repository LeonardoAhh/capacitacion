import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drive-image?id=FILE_ID
 * Proxy que descarga la imagen de Drive y la sirve directamente,
 * evitando restricciones CORS y redirects del navegador.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    try {
        // Intentar con uc?export=view primero
        const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        const res = await fetch(driveUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            redirect: 'follow',
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'No se pudo obtener la imagen' }, { status: 502 });
        }

        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
            },
        });
    } catch (err) {
        console.error('[drive-image proxy]', err.message);
        return NextResponse.json({ error: 'Error al obtener imagen' }, { status: 500 });
    }
}
