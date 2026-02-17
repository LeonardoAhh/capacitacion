import { NextResponse } from 'next/server';

const RATE_LIMITS = {
    'auth:login': { maxRequests: 5, windowMs: 60 * 1000 },
    'auth:google': { maxRequests: 10, windowMs: 60 * 1000 },
    'api:default': { maxRequests: 100, windowMs: 60 * 1000 },
    'api:upload': { maxRequests: 10, windowMs: 60 * 1000 },
    'api:write': { maxRequests: 50, windowMs: 60 * 1000 },
};

const rateLimitStore = new Map();

function getClientIdentifier(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    return `${ip}:${userAgent.slice(0, 50)}`;
}

function getRateLimitKey(identifier, endpoint) {
    return `${identifier}:${endpoint}`;
}

function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now > data.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}

setInterval(cleanupExpiredEntries, 60 * 1000);

export function checkRateLimit(request, endpoint = 'api:default') {
    const identifier = getClientIdentifier(request);
    const key = getRateLimitKey(identifier, endpoint);
    const limitConfig = RATE_LIMITS[endpoint] || RATE_LIMITS['api:default'];

    const now = Date.now();
    const existing = rateLimitStore.get(key);

    if (!existing || now > existing.resetAt) {
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + limitConfig.windowMs,
        });

        return {
            allowed: true,
            remaining: limitConfig.maxRequests - 1,
            resetAt: now + limitConfig.windowMs,
        };
    }

    if (existing.count >= limitConfig.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: existing.resetAt,
            retryAfter: Math.ceil((existing.resetAt - now) / 1000),
        };
    }

    existing.count += 1;
    rateLimitStore.set(key, existing);

    return {
        allowed: true,
        remaining: limitConfig.maxRequests - existing.count,
        resetAt: existing.resetAt,
    };
}

export function withRateLimit(handler, endpoint = 'api:default') {
    return async (request, context) => {
        const result = checkRateLimit(request, endpoint);

        if (!result.allowed) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
                    retryAfter: result.retryAfter,
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': String(RATE_LIMITS[endpoint]?.maxRequests || 100),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
                        'Retry-After': String(result.retryAfter),
                    },
                }
            );
        }

        const response = await handler(request, context);

        if (response instanceof NextResponse) {
            response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS[endpoint]?.maxRequests || 100));
            response.headers.set('X-RateLimit-Remaining', String(result.remaining));
            response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
        }

        return response;
    };
}

export function rateLimitMiddleware(request) {
    const pathname = request.nextUrl.pathname;

    let endpoint = 'api:default';

    if (pathname.includes('/auth/')) {
        if (pathname.includes('login')) {
            endpoint = 'auth:login';
        } else if (pathname.includes('google')) {
            endpoint = 'auth:google';
        }
    } else if (pathname.includes('/upload')) {
        endpoint = 'api:upload';
    }

    return checkRateLimit(request, endpoint);
}
