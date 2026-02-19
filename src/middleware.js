import { NextResponse } from 'next/server';

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
    '/modulos',
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

function parseSessionCookie(cookieValue) {
    try {
        return JSON.parse(cookieValue);
    } catch {
        return null;
    }
}

// ─── Middleware ─────────────────────────────────────────────────────────────────

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Rutas públicas: siempre accesibles
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // 2. Determinar qué tipo de sesión requiere esta ruta
    const requiredType = getRequiredSessionType(pathname);

    // Si la ruta no está mapeada (ej: /api, archivos estáticos), dejar pasar
    if (!requiredType) {
        return NextResponse.next();
    }

    // 3. Verificar cookie de sesión
    const sessionCookie = request.cookies.get('__session');
    const session = sessionCookie ? parseSessionCookie(sessionCookie.value) : null;

    // 4. Sin cookie → redirigir al login correspondiente
    if (!session) {
        const loginUrl = getLoginUrl(requiredType);
        const url = request.nextUrl.clone();
        url.pathname = loginUrl;
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    // 5. Cookie existe pero tipo incorrecto → redirigir al login correcto
    if (session.type !== requiredType) {
        const loginUrl = getLoginUrl(requiredType);
        const url = request.nextUrl.clone();
        url.pathname = loginUrl;
        return NextResponse.redirect(url);
    }

    // 6. Cookie válida → permitir acceso
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*|manifest\\.json|icons/).*)'],
};
