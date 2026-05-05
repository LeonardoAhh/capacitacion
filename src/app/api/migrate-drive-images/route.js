import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/* ─────────────────────────────────────────────────────────────
   ENV helpers
───────────────────────────────────────────────────────────── */
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

/* ─────────────────────────────────────────────────────────────
   1. Extract Drive fileId from any supported URL format
───────────────────────────────────────────────────────────── */
function extractFileId(url) {
  if (!url || typeof url !== 'string') return null;

  // /api/drive-image?id=FILE_ID  (internal proxy)
  let m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  // https://drive.google.com/file/d/FILE_ID/view
  m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  // https://drive.google.com/thumbnail?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  // (already covered by the first pattern, but kept explicit)
  m = url.match(/drive\.google\.com\/(?:thumbnail|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  // https://lh3.googleusercontent.com/d/FILE_ID=s...
  m = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  return null;
}

/* ─────────────────────────────────────────────────────────────
   2. Download the image from Google Drive
   Strategies: lh3 CDN → Drive thumbnail (mirrors drive-image/route.js)
───────────────────────────────────────────────────────────── */
async function fetchViaLh3(fileId) {
  try {
    const url = `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 100) return null;
    return { buffer, contentType };
  } catch {
    return null;
  }
}

async function fetchViaThumbnail(fileId) {
  try {
    const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 100) return null;
    return { buffer, contentType };
  } catch {
    return null;
  }
}

async function downloadDriveImage(fileId) {
  const result = await fetchViaLh3(fileId) ?? await fetchViaThumbnail(fileId);
  return result; // null if both fail
}

/* ─────────────────────────────────────────────────────────────
   3. Upload buffer to Firebase Storage via REST API
   Docs: https://firebase.google.com/docs/storage/web/upload-files#upload_files_with_the_cloud_storage_for_firebase_sdks
───────────────────────────────────────────────────────────── */
/**
 * Returns a short extension from a MIME type.
 */
function extFromMime(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
  };
  return map[mime] ?? 'jpg';
}

/**
 * Uploads a Buffer to Firebase Storage using the REST upload API.
 * Returns the permanent download URL (alt=media).
 *
 * @param {Buffer} buffer
 * @param {string} contentType  e.g. 'image/jpeg'
 * @param {string} storagePath  e.g. 'course_assets/abc123.jpg'
 * @returns {Promise<string>}   download URL
 */
async function uploadToStorage(buffer, contentType, storagePath) {
  // The upload endpoint expects the path double-encoded in the URL
  const encodedPath = encodeURIComponent(storagePath);

  const uploadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o` +
    `?uploadType=media&name=${encodedPath}&key=${API_KEY}`;

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: buffer,
    signal: AbortSignal.timeout(30_000),
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Storage upload failed (${uploadRes.status}): ${text}`);
  }

  // Build the public download URL
  // Format: .../o/ENCODED_PATH?alt=media
  const downloadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodedPath}?alt=media`;

  return downloadUrl;
}

/* ─────────────────────────────────────────────────────────────
   4. Update a Firestore document field via REST API
   Supports dot-notation paths like "data.items.2.image"
───────────────────────────────────────────────────────────── */

/**
 * Converts a dot-notation fieldPath into a Firestore REST PATCH body.
 *
 * Firestore REST PATCH supports dot-notation field masks natively:
 * PATCH .../doc?updateMask.fieldPaths=data.items.2.image
 * body: { fields: { "data": { mapValue: { fields: { "items": { ... } } } } } }
 *
 * However, building a fully nested mapValue tree is complex when the path
 * contains array indices. Instead we use the simpler approach:
 *   - updateMask with dot-notation key
 *   - body with the dot-notation key as a top-level field name
 *   (Firestore treats this correctly for nested maps, but NOT for arrays)
 *
 * For array index segments (numeric path parts), we must reconstruct the
 * full parent map. We do a GET first to read the current value, patch it
 * in memory, and send the entire top-level key back.
 *
 * @param {string} courseId
 * @param {string} slideId
 * @param {string} fieldPath   e.g. "data.image" | "data.items.2.image"
 * @param {string} newValue
 */
async function updateFirestoreField(courseId, slideId, fieldPath, newValue) {
  const docPath =
    `projects/${PROJECT_ID}/databases/(default)/documents` +
    `/cursos/${courseId}/slides/${slideId}`;
  const baseUrl = `https://firestore.googleapis.com/v1/${docPath}`;
  const authParam = `key=${API_KEY}`;

  const segments = fieldPath.split('.');
  const hasArrayIndex = segments.some(s => /^\d+$/.test(s));

  if (!hasArrayIndex) {
    /* ── Simple dot-notation update (maps only) ── */
    // Firestore field value wrapper for a string
    const fieldValue = { stringValue: newValue };

    // Build the nested fields object from the dot-notation path
    // Firestore REST accepts { "data.image": { stringValue: "..." } }
    // as the body when combined with updateMask.fieldPaths=data.image
    const body = {
      fields: {
        [fieldPath]: fieldValue,
      },
    };

    const patchUrl =
      `${baseUrl}?updateMask.fieldPaths=${encodeURIComponent(fieldPath)}&${authParam}`;

    const res = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firestore PATCH failed (${res.status}): ${text}`);
    }
    return;
  }

  /* ── Path contains array index(es) — must GET → mutate → PATCH top-level key ── */
  // The top-level key is segments[0] (e.g. "data")
  const topKey = segments[0];

  // GET current document
  const getRes = await fetch(`${baseUrl}?${authParam}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!getRes.ok) {
    const text = await getRes.text();
    throw new Error(`Firestore GET failed (${getRes.status}): ${text}`);
  }
  const doc = await getRes.json();

  // Convert Firestore document fields → plain JS object
  function firestoreToJs(value) {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return Number(value.integerValue);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.nullValue !== undefined) return null;
    if (value.arrayValue) {
      return (value.arrayValue.values || []).map(firestoreToJs);
    }
    if (value.mapValue) {
      const obj = {};
      for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
        obj[k] = firestoreToJs(v);
      }
      return obj;
    }
    return null;
  }

  // Convert plain JS object → Firestore field value
  function jsToFirestore(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      return Number.isInteger(val)
        ? { integerValue: String(val) }
        : { doubleValue: val };
    }
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(jsToFirestore) } };
    }
    if (typeof val === 'object') {
      const fields = {};
      for (const [k, v] of Object.entries(val)) {
        fields[k] = jsToFirestore(v);
      }
      return { mapValue: { fields } };
    }
    return { nullValue: null };
  }

  // Extract current top-level value as JS
  const topFirestoreVal = doc.fields?.[topKey];
  const topJs = topFirestoreVal ? firestoreToJs(topFirestoreVal) : {};

  // Traverse and mutate at the nested path (segments[1..])
  const innerSegments = segments.slice(1);
  let cursor = topJs;
  for (let i = 0; i < innerSegments.length - 1; i++) {
    const seg = innerSegments[i];
    const idx = /^\d+$/.test(seg) ? Number(seg) : seg;
    if (cursor[idx] === undefined || cursor[idx] === null) {
      cursor[idx] = /^\d+$/.test(innerSegments[i + 1]) ? [] : {};
    }
    cursor = cursor[idx];
  }
  const lastSeg = innerSegments[innerSegments.length - 1];
  cursor[/^\d+$/.test(lastSeg) ? Number(lastSeg) : lastSeg] = newValue;

  // PATCH only the top-level key back (avoids overwriting unrelated fields)
  const patchBody = {
    fields: {
      [topKey]: jsToFirestore(topJs),
    },
  };
  const patchUrl =
    `${baseUrl}?updateMask.fieldPaths=${encodeURIComponent(topKey)}&${authParam}`;

  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patchBody),
    signal: AbortSignal.timeout(15_000),
  });

  if (!patchRes.ok) {
    const text = await patchRes.text();
    throw new Error(`Firestore PATCH failed (${patchRes.status}): ${text}`);
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/migrate-drive-images
   Body: { courseId, slideId, fieldPath, driveUrl }
───────────────────────────────────────────────────────────── */
export async function POST(request) {
  /* ── Validate env ── */
  if (!API_KEY || !PROJECT_ID || !BUCKET) {
    return NextResponse.json(
      { success: false, error: 'Firebase env vars not configured on server.' },
      { status: 500 }
    );
  }

  /* ── Parse body ── */
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const { courseId, slideId, fieldPath, driveUrl } = body ?? {};

  if (!courseId || !slideId || !fieldPath || !driveUrl) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: courseId, slideId, fieldPath, driveUrl.' },
      { status: 400 }
    );
  }

  /* ── Skip if already a Firebase Storage URL ── */
  if (
    typeof driveUrl === 'string' &&
    driveUrl.includes('firebasestorage.googleapis.com')
  ) {
    return NextResponse.json({ success: true, newUrl: driveUrl, skipped: true });
  }

  /* ── Step 1: extract fileId ── */
  const fileId = extractFileId(driveUrl);
  if (!fileId) {
    return NextResponse.json(
      { success: false, error: `Could not extract Drive fileId from URL: ${driveUrl}` },
      { status: 422 }
    );
  }

  /* ── Step 2: download from Drive ── */
  const imageData = await downloadDriveImage(fileId);
  if (!imageData) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to download Drive image (id=${fileId}). ` +
          `Both lh3 and thumbnail endpoints failed.`,
      },
      { status: 502 }
    );
  }

  /* ── Step 3: upload to Firebase Storage ── */
  const ext = extFromMime(imageData.contentType);
  const storagePath = `course_assets/${courseId}/${slideId}_${Date.now()}.${ext}`;

  let newUrl;
  try {
    newUrl = await uploadToStorage(imageData.buffer, imageData.contentType, storagePath);
  } catch (err) {
    console.error('[migrate-drive-images] Storage upload error:', err);
    return NextResponse.json(
      { success: false, error: `Storage upload error: ${err.message}` },
      { status: 502 }
    );
  }

  /* ── Step 4: update Firestore ── */
  try {
    await updateFirestoreField(courseId, slideId, fieldPath, newUrl);
  } catch (err) {
    console.error('[migrate-drive-images] Firestore update error:', err);
    // Image was uploaded but Firestore failed — return the URL so the
    // caller can decide what to do (e.g. retry only the Firestore step).
    return NextResponse.json(
      {
        success: false,
        error: `Image uploaded but Firestore update failed: ${err.message}`,
        newUrl, // caller can still use this
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, newUrl });
}
