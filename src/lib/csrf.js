import { NextResponse } from 'next/server';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf_token';

const tokenStore = new Map();

function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function createCsrfToken(sessionId = 'default') {
    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    tokenStore.set(`${sessionId}:${token}`, { expiresAt });

    return token;
}

export function validateCsrfToken(token, sessionId = 'default') {
    if (!token) return false;

    const key = `${sessionId}:${token}`;
    const stored = tokenStore.get(key);

    if (!stored) return false;

    if (Date.now() > stored.expiresAt) {
        tokenStore.delete(key);
        return false;
    }

    return true;
}

export function invalidateCsrfToken(token, sessionId = 'default') {
    tokenStore.delete(`${sessionId}:${token}`);
}

export function withCsrfProtection(handler) {
    return async (request, context) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
            const token = createCsrfToken();
            const response = await handler(request, context);

            if (response instanceof NextResponse) {
                response.headers.set('X-CSRF-Token', token);
            }

            return response;
        }

        const csrfToken = request.headers.get(CSRF_HEADER);
        const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;

        const tokenToValidate = csrfToken || cookieToken;

        if (!tokenToValidate || !validateCsrfToken(tokenToValidate)) {
            return NextResponse.json(
                { error: 'Invalid CSRF token' },
                { status: 403 }
            );
        }

        invalidateCsrfToken(tokenToValidate);

        return handler(request, context);
    };
}

export function csrfMiddleware(request) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return null;
    }

    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith('/api/auth')) {
        return null;
    }

    const csrfToken = request.headers.get(CSRF_HEADER);

    if (!csrfToken || !validateCsrfToken(csrfToken)) {
        return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
        );
    }

    return null;
}

export function getCsrfHeaders() {
    return {
        [CSRF_HEADER]: '',
    };
}

setInterval(() => {
    const now = Date.now();
    for (const [key, data] of tokenStore.entries()) {
        if (now > data.expiresAt) {
            tokenStore.delete(key);
        }
    }
}, 60 * 60 * 1000);
