import { NextResponse } from 'next/server';
import { deserializeSession } from '@/lib/cookieSign';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { csrfMiddleware } from '@/lib/csrf';

// ─── Configuración de rutas ────────────────────────────────────────────────────

/** Rutas públicas — accesibles sin cookie de sesión */
const PUBLIC_ROUTES = ['/', '/login', '/candidatos', '/training/login', '/organigrama'];

/** Rutas que requieren sesión tipo 'admin' */
const ADMIN_ROUTES = [
    '/dashboard',
    '/employees',
    '/capacitacion',
    '/reports',
    '/profile',
    '/iluo-manager',
    '/induccion',
    '/complete-profile',
    '/test',
];

/** Rutas que requieren sesión tipo 'candidate' */
const CANDIDATE_ROUTES = ['/candidatos/dashboard'];

/** Rutas que requieren sesión tipo 'training' */
const TRAINING_ROUTES = ['/training/dashboard'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isPublicRoute(pathname) {
    return PUBLIC_ROUTES.some(route =>
        pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
    ) && !CANDIDATE_ROUTES.some(r => pathname.startsWith(r))
        && !TRAINING_ROUTES.some(r => pathname.startsWith(r));
}

function getRequiredSessionType(pathname) {
    if (CANDIDATE_ROUTES.some(r => pathname.startsWith(r))) return 'candidate';
    if (TRAINING_ROUTES.some(r => pathname.startsWith(r))) return 'training';
    if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) return 'admin';
    return null;
}

function getLoginUrl(sessionType) {
    switch (sessionType) {
        case 'candidate': return '/candidatos';
        case 'training': return '/training/login';
        case 'admin':
        default: return '/login';
    }
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

    // 3. Determinar qué tipo de sesión requiere esta ruta
    const requiredType = getRequiredSessionType(pathname);

    // Si la ruta no está mapeada (archivos estáticos, etc.), dejar pasar
    if (!requiredType) {
        return NextResponse.next();
    }

    // 4. Verificar y validar la cookie de sesión firmada con HMAC
    const sessionCookie = request.cookies.get('__session');
    const session = sessionCookie ? await deserializeSession(sessionCookie.value) : null;

    // 5. Sin cookie válida → redirigir al login correspondiente
    if (!session) {
        const loginUrl = getLoginUrl(requiredType);
        const url = request.nextUrl.clone();
        url.pathname = loginUrl;
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // 6. Cookie válida pero tipo incorrecto → redirigir al login correcto
    if (session.type !== requiredType) {
        const loginUrl = getLoginUrl(requiredType);
        const url = request.nextUrl.clone();
        url.pathname = loginUrl;
        return NextResponse.redirect(url);
    }

    // 7. Cookie válida → permitir acceso
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*|manifest\\.json|icons/).*)'],
};

