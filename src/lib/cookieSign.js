/**
 * Firma y verificación de cookies de sesión usando Web Crypto API (HMAC-SHA256).
 * Compatible con Edge Runtime, Node.js y navegadores.
 */

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production';
const SEPARATOR = '.';
const encoder = new TextEncoder();

/** Importa la clave HMAC desde el secreto */
async function getHmacKey() {
    const keyData = encoder.encode(SESSION_SECRET);
    return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

/** ArrayBuffer → hex string */
function bufToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/** hex string → Uint8Array */
function hexToUint8(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

/**
 * Serializa y firma un objeto de sesión.
 * @param {{ type: string, ts: number }} data
 * @returns {Promise<string>} "base64urlPayload.hmacHex"
 */
export async function serializeSession(data) {
    const payload = btoa(JSON.stringify(data))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const key = await getHmacKey();
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const signature = bufToHex(sigBuffer);

    return `${payload}${SEPARATOR}${signature}`;
}

/**
 * Verifica la firma y deserializa la cookie de sesión.
 * Usa crypto.subtle.verify (tiempo constante, evita timing attacks).
 * @param {string} cookieValue
 * @returns {Promise<{ type: string, ts: number } | null>}
 */
export async function deserializeSession(cookieValue) {
    try {
        if (!cookieValue) return null;

        const sepIdx = cookieValue.lastIndexOf(SEPARATOR);
        if (sepIdx === -1) return null;

        const payload = cookieValue.slice(0, sepIdx);
        const signature = cookieValue.slice(sepIdx + 1);

        if (!payload || !signature) return null;

        const key = await getHmacKey();
        const sigBytes = hexToUint8(signature);

        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            sigBytes,
            encoder.encode(payload)
        );

        if (!valid) return null;

        // base64url → base64 normal → JSON
        const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(b64));
    } catch {
        return null;
    }
}
