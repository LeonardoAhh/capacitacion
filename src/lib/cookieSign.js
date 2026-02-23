import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production';
const ALGORITHM = 'sha256';
const SEPARATOR = '.';

/**
 * Genera la firma HMAC-SHA256 de un payload serializado.
 * @param {string} payload - JSON string del payload
 * @returns {string} firma en hex
 */
function sign(payload) {
    return createHmac(ALGORITHM, SESSION_SECRET)
        .update(payload)
        .digest('hex');
}

/**
 * Serializa y firma un objeto de sesión.
 * @param {{ type: string, ts: number }} data
 * @returns {string} "base64payload.hmacSignature"
 */
export function serializeSession(data) {
    const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
    const signature = sign(payload);
    return `${payload}${SEPARATOR}${signature}`;
}

/**
 * Verifica y deserializa la cookie de sesión firmada.
 * Usa comparación de tiempo constante para evitar timing attacks.
 * @param {string} cookieValue
 * @returns {{ type: string, ts: number } | null}
 */
export function deserializeSession(cookieValue) {
    try {
        if (!cookieValue) return null;

        const parts = cookieValue.split(SEPARATOR);
        if (parts.length !== 2) return null;

        const [payload, signature] = parts;
        const expectedSig = sign(payload);

        // Comparación de tiempo constante (evita timing attacks)
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSig, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) return null;
        if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
        return null;
    }
}
