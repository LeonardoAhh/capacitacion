import { NextResponse } from 'next/server';
import { createCsrfToken } from '@/lib/csrf';

export async function GET() {
    const token = createCsrfToken();

    const response = NextResponse.json({ success: true });

    response.headers.set('X-CSRF-Token', token);

    response.cookies.set('csrf_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24,
    });

    return response;
}
