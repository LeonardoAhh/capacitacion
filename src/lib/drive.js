import { google } from 'googleapis';
import { Readable } from 'stream';

// Configuración de OAuth2
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URI (no se usa en flujo refresh, pero se requiere)
);

// Establecer credenciales (Refresh Token es la clave para acceso perpetuo)
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Sube un archivo a Google Drive usando OAuth2 (actuando como el usuario)
 */
export async function uploadFile(buffer, name, mimeType, folderId = null) {
    try {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileMetadata = {
            name: name,
        };

        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const media = {
            mimeType: mimeType,
            body: stream,
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink, thumbnailLink',
            supportsAllDrives: true,
        });

        // Nota: Con OAuth no necesitamos dar permisos explícitos de "anyone" 
        // porque el archivo es tuyo. Pero si quieres que sea público:
        await drive.permissions.create({
            fileId: file.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Construir URL pública estable para imágenes
        const directUrl = `https://drive.google.com/thumbnail?id=${file.data.id}&sz=w1000`;

        return {
            id: file.data.id,
            viewLink: directUrl,
            downloadLink: file.data.webContentLink
        };
    } catch (error) {
        console.error('Error subiendo archivo a Drive (OAuth):', error);
        throw error;
    }
}

// Mantenemos estas funciones auxiliares igual
export async function createFolder(name, parentId = null) {
    try {
        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
        };
        if (parentId) fileMetadata.parents = [parentId];

        const file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
            supportsAllDrives: true,
        });
        return file.data.id;
    } catch (error) {
        console.error('Error creando carpeta:', error);
        throw error;
    }
}

export async function findFolder(name, parentId = null) {
    try {
        let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
        if (parentId) query += ` and '${parentId}' in parents`;

        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        return res.data.files.length > 0 ? res.data.files[0].id : null;
    } catch (error) {
        return null;
    }
}
