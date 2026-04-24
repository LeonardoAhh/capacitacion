import { NextResponse } from 'next/server';
import { deserializeSession } from '@/lib/cookieSign';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { csrfMiddleware } from '@/lib/csrf';

// ─── Configuración de rutas ────────────────────────────────────────────────────

/** Rutas públicas — accesibles sin cookie de sesión */
const PUBLIC_ROUTES = [
    '/', '/login', '/organigrama', '/quiz',
    '/presentacion', // viewer público de cursos
    '/mural',        // empleados consultan resultados por ID
    '/offline',      // PWA fallback
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isPublicRoute(pathname) {
    return PUBLIC_ROUTES.some(route =>
        pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
    );
}

// ─── Middleware ─────────────────────────────────────────────────────────────────

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Rutas de API — aplicar rate limiting
    if (pathname.startsWith('/api/')) {
        const rateLimitResult = rateLimitMiddleware(request);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes. Intenta más tarde.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimitResult.retryAfter ?? 60),
                        'X-RateLimit-Remaining': '0',
                    },
                }
            );
        }

        // CSRF: proteger mutaciones en /api/ que no sean de autenticación ni upload
        if (
            !pathname.startsWith('/api/auth') &&
            !pathname.startsWith('/api/upload') &&
            !pathname.startsWith('/api/gallery-upload')
        ) {
            const csrfResult = csrfMiddleware(request);
            if (csrfResult) return csrfResult;
        }

        return NextResponse.next();
    }

    // 2. Rutas públicas: siempre accesibles
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // 3. Rutas no públicas requieren cookie de sesión firmada con HMAC
    const sessionCookie = request.cookies.get('__session');
    const session = sessionCookie ? await deserializeSession(sessionCookie.value) : null;

    // 4. Sin cookie válida o tipo incorrecto → redirigir al login
    if (!session || session.type !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        if (!session) url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // 5. Cookie válida → permitir acceso
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*|manifest\\.json|icons/).*)'],
};

