// scripts/check-drive-id.mjs
// Verifica si un FILE_ID de Drive existe y es accesible vía OAuth.
// Uso: node scripts/check-drive-id.mjs <FILE_ID>

import { google } from 'googleapis';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env.local') });

const fileId = process.argv[2];
if (!fileId) {
    console.error('Uso: node scripts/check-drive-id.mjs <FILE_ID>');
    process.exit(1);
}

const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);
oauth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth });

try {
    const meta = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, trashed, parents, owners, webViewLink',
        supportsAllDrives: true,
    });
    console.log('✓ ENCONTRADO');
    console.log(JSON.stringify(meta.data, null, 2));

    const perms = await drive.permissions.list({
        fileId,
        fields: 'permissions(id, type, role, emailAddress)',
        supportsAllDrives: true,
    });
    console.log('\nPermisos:');
    console.log(JSON.stringify(perms.data.permissions, null, 2));
} catch (err) {
    console.error('✗ NO ACCESIBLE');
    console.error('Código:', err.code);
    console.error('Mensaje:', err.message);
}
