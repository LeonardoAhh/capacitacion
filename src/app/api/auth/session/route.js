import { NextResponse } from 'next/server';

/**
 * POST /api/auth/session — Crea una cookie de sesión HTTP-only.
 * Body: { type: 'admin' | 'candidate' | 'training' }
 */
export async function POST(request) {
    try {
        const { type } = await request.json();

        if (!['admin', 'candidate', 'training'].includes(type)) {
            return NextResponse.json(
                { error: 'Tipo de sesión inválido' },
                { status: 400 }
            );
        }

        // Duración de la cookie: admin 24h, candidatos/training 2h
        const maxAge = type === 'admin' ? 24 * 60 * 60 : 2 * 60 * 60;

        const response = NextResponse.json({ success: true });

        response.cookies.set('__session', JSON.stringify({ type, ts: Date.now() }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge,
        });

        return response;
    } catch (error) {
        console.error('Error creating session cookie:', error);
        return NextResponse.json(
            { error: 'Error al crear sesión' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/auth/session — Elimina la cookie de sesión.
 */
export async function DELETE() {
    const response = NextResponse.json({ success: true });

    response.cookies.set('__session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // Expira inmediatamente
    });

    return response;
}
