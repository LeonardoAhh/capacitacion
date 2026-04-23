import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';
// Allow Vercel/Next.js to cache responses (ISR-style) — revalidate every 7 days
export const revalidate = 604800;

/* ── In-memory LRU cache (per-serverless-instance) ── */
const CACHE_MAX = 200;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const cache = new Map();

function cacheGet(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry;
}

function cacheSet(key, buffer, contentType) {
    // Evict oldest when full
    if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
    }
    cache.set(key, { buffer, contentType, ts: Date.now() });
}

/* ── Drive OAuth client (lazy singleton) ── */
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

/* ── Fetch strategies ── */

/**
 * Primary: lh3.googleusercontent.com (Google's CDN — fastest)
 */
async function fetchViaLh3(fileId, sz) {
    try {
        const url = `https://lh3.googleusercontent.com/d/${fileId}=${sz}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
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

/**
 * Fallback: Drive thumbnail endpoint
 */
async function fetchViaThumbnail(fileId, sz) {
    try {
        const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=${sz}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
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

/**
 * Last resort: Drive API with OAuth (authenticated, always works)
 */
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
        console.warn(`[drive-image] API auth fallback failed for id=${fileId}:`, err.message);
        return null;
    }
}

/* ── Response headers (aggressive caching) ── */
const CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable',
    'CDN-Cache-Control': 'public, max-age=2592000',
    'Vercel-CDN-Cache-Control': 'public, max-age=2592000',
};

/**
 * GET /api/drive-image?id=FILE_ID&sz=w800
 *
 * Proxy that fetches a Google Drive image and serves it with aggressive caching.
 * Uses lh3 CDN first (fastest), then Drive thumbnail, then authenticated API.
 * In-memory cache avoids repeated fetches within the same serverless instance.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const sz = searchParams.get('sz') || 'w800';

    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9=]+$/.test(sz)) {
        return NextResponse.json({ error: 'Tamaño inválido' }, { status: 400 });
    }

    const cacheKey = `${fileId}_${sz}`;

    // Check in-memory cache first
    const cached = cacheGet(cacheKey);
    if (cached) {
        return new NextResponse(cached.buffer, {
            status: 200,
            headers: {
                'Content-Type': cached.contentType,
                'X-Cache': 'HIT',
                ...CACHE_HEADERS,
            },
        });
    }

    // Try strategies in order of speed
    const result =
        await fetchViaLh3(fileId, sz) ||
        await fetchViaThumbnail(fileId, sz) ||
        await fetchViaDriveApi(fileId);

    if (result) {
        // Store in memory for subsequent requests
        cacheSet(cacheKey, result.buffer, result.contentType);

        return new NextResponse(result.buffer, {
            status: 200,
            headers: {
                'Content-Type': result.contentType,
                'X-Cache': 'MISS',
                ...CACHE_HEADERS,
            },
        });
    }

    console.warn(`[drive-image] all endpoints failed for id=${fileId}`);
    return NextResponse.json(
        {
            error:
                'No se pudo obtener la imagen desde Drive. Verifica que el archivo exista y que el GOOGLE_REFRESH_TOKEN esté vigente.',
        },
        { status: 502 }
    );
}
