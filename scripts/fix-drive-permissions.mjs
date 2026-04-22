// scripts/fix-drive-permissions.mjs
// Recorre recursivo la carpeta raíz de Drive y aplica permiso público (anyone:reader)
// a cada archivo que aún no lo tenga. Usa OAuth refresh token de .env.local.

import { google } from 'googleapis';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env.local') });

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_DRIVE_ROOT_ID,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    console.error('Faltan variables OAuth en .env.local');
    process.exit(1);
}
if (!GOOGLE_DRIVE_ROOT_ID) {
    console.error('Falta GOOGLE_DRIVE_ROOT_ID en .env.local');
    process.exit(1);
}

const oauth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);
oauth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth });

const stats = { folders: 0, files: 0, alreadyPublic: 0, madePublic: 0, errors: 0 };

async function listChildren(parentId) {
    const items = [];
    let pageToken;
    do {
        const res = await drive.files.list({
            q: `'${parentId}' in parents and trashed=false`,
            fields: 'nextPageToken, files(id, name, mimeType)',
            pageSize: 1000,
            pageToken,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        items.push(...(res.data.files || []));
        pageToken = res.data.nextPageToken;
    } while (pageToken);
    return items;
}

async function isPublic(fileId) {
    try {
        const res = await drive.permissions.list({
            fileId,
            fields: 'permissions(id, type, role)',
            supportsAllDrives: true,
        });
        return (res.data.permissions || []).some(p => p.type === 'anyone');
    } catch {
        return false;
    }
}

async function makePublic(fileId, name) {
    try {
        if (await isPublic(fileId)) {
            stats.alreadyPublic++;
            return;
        }
        await drive.permissions.create({
            fileId,
            requestBody: { role: 'reader', type: 'anyone' },
            supportsAllDrives: true,
        });
        stats.madePublic++;
        console.log(`  ✓ público: ${name}`);
    } catch (err) {
        stats.errors++;
        console.warn(`  ✗ error en ${name}: ${err.message}`);
    }
}

async function walk(folderId, depth = 0) {
    const items = await listChildren(folderId);
    const indent = '  '.repeat(depth);
    for (const item of items) {
        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
        if (isFolder) {
            stats.folders++;
            console.log(`${indent}📁 ${item.name}`);
            await makePublic(item.id, item.name);
            await walk(item.id, depth + 1);
        } else {
            stats.files++;
            console.log(`${indent}📄 ${item.name} [${item.mimeType}]`);
            await makePublic(item.id, item.name);
        }
    }
}

console.log(`\n→ Procesando carpeta raíz: ${GOOGLE_DRIVE_ROOT_ID}\n`);
const t0 = Date.now();
try {
    await walk(GOOGLE_DRIVE_ROOT_ID);
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n=== Resumen (${sec}s) ===`);
    console.log(`Carpetas:        ${stats.folders}`);
    console.log(`Archivos:        ${stats.files}`);
    console.log(`Ya públicos:     ${stats.alreadyPublic}`);
    console.log(`Hechos públicos: ${stats.madePublic}`);
    console.log(`Errores:         ${stats.errors}`);
} catch (err) {
    console.error('Fallo fatal:', err.message);
    process.exit(1);
}
