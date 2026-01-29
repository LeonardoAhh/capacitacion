import { NextResponse } from 'next/server';

export function middleware(request) {
    const authCookie = request.cookies.get('firebaseAuth'); // Nota: Firebase client-side auth no setea cookies automticamente
    // Para una proteccin real server-side con Firebase, necesitamos setear una session cookie.
    // Como esta es una app client-side mayormente, usaremos proteccin bsica basada en rutas.

    // Rutas protegidas
    const protectedRoutes = ['/dashboard', '/employees'];
    const path = request.nextUrl.pathname;

    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

    // Si estmos protegiendo rutas sin session cookies reales, 
    // lo mejor que podemos hacer ac sera chequear tokens personalizados si los estuvieramos enviando.
    // Sin embargo, dado el setup actual "Client-Side Auth", el middleware tiene visibilidad limitada.

    // ESTRATEGIA: La landing page se muestra en '/' y el AuthProvider del cliente 
    // redirige a dashboard si el usuario ya está logueado.
    // Las rutas protegidas se manejan client-side en cada página.

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
