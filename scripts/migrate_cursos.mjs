/**
 * migrate_cursos.mjs
 *
 * Migrates the Firestore "cursos" collection (+ slides subcollection) to Supabase.
 *
 * Usage:
 *   node migrate_cursos.mjs
 *   node migrate_cursos.mjs --dry-run
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (private_key from service account JSON)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────

const FIREBASE_PROJECT_ID   = process.env.FIREBASE_PROJECT_ID
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const FIREBASE_PRIVATE_KEY  = (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
const SUPABASE_URL          = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

const DRY_RUN = process.argv.includes('--dry-run')

// ── Validate env ──────────────────────────────────────────────────────────────

const missingFirebase = !FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY
const missingSupabase = !SUPABASE_URL || !SUPABASE_SERVICE_KEY

if (missingFirebase) {
  console.error('Missing Firebase env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
  process.exit(1)
}
if (missingSupabase) {
  console.error('Missing Supabase env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// ── Init clients ──────────────────────────────────────────────────────────────

initializeApp({
  credential: cert({
    projectId:   FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey:  FIREBASE_PRIVATE_KEY,
  }),
})

const db       = getFirestore()
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely coerce any value to boolean; non-boolean values use the fallback */
function toBool(val, fallback = false) {
  if (typeof val === 'boolean') return val
  return fallback
}

/** Recursively convert Firestore Timestamps to ISO strings */
function convertTimestamps(obj) {
  if (obj instanceof Timestamp) return obj.toDate().toISOString()
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(convertTimestamps)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, convertTimestamps(v)]))
}

const BATCH_SIZE = 200

/** Upsert rows into a Supabase table in batches */
async function upsert(table, rows) {
  if (!rows.length) {
    console.log(`  (empty) "${table}"`)
    return
  }
  if (DRY_RUN) {
    console.log(`  [dry-run] Would upsert ${rows.length} rows into "${table}"`)
    return
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' })
    if (error) throw new Error(`"${table}" upsert failed (batch ${i / BATCH_SIZE + 1}): ${error.message}`)
  }
  console.log(`  ✓ ${rows.length} rows → "${table}"`)
}

// ── Migrators ─────────────────────────────────────────────────────────────────

async function migrateCursos() {
  console.log('\n→ Fetching cursos from Firestore...')
  const snap = await db.collection('cursos').get()
  const docs  = snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }))
  console.log(`  Found ${docs.length} cursos`)

  const cursoRows = docs.map(d => ({
    id:                 d.id,
    title:              d.title,
    description:        d.description          ?? null,
    category:           d.category             ?? null,
    duration:           d.duration             ?? null,
    instructor:         d.instructor           ?? null,
    instructor_role:    d.instructorRole       ?? null,
    company:            d.company              ?? null,
    year:               d.year                 ?? null,
    published:          toBool(d.published, false),
    slide_count:        typeof d.slideCount === 'number' ? d.slideCount : 0,
    // created_by is intentionally null: Firebase UIDs are not valid Supabase Auth UUIDs.
    // Populate this column manually after Auth migration.
    created_by:         null,
    contenido_url:      d.contenidoUrl         ?? null,
    candidate_view:     toBool(d.candidateView, false),
    puestos_aplicables: Array.isArray(d.puestosAplicables) ? d.puestosAplicables : [],
    tipo:               d.tipo                 ?? null,
    activo:             toBool(d.activo, true),
    native_course_id:   d.nativeCourseId       ?? null,
    examen_url:         d.examenUrl            ?? null,
    orden:              d.orden                ?? null,
    created_at:         d.createdAt            ?? null,
    updated_at:         d.updatedAt            ?? null,
  }))

  await upsert('cursos', cursoRows)
  return docs
}

async function migrateSlides(cursoDocs) {
  console.log('\n→ Fetching slides subcollection...')

  const allSlides = []

  for (const d of cursoDocs) {
    const slidesSnap = await db.collection('cursos').doc(d.id).collection('slides').get()
    slidesSnap.docs.forEach(s => {
      const raw = s.data()
      allSlides.push({
        id:       `${d.id}_${s.id}`,
        curso_id: d.id,
        order:    raw.order    ?? 0,
        type:     raw.type     ?? 'content',
        data:     convertTimestamps(raw.data ?? {}),
      })
    })
  }

  console.log(`  Found ${allSlides.length} slides across ${cursoDocs.length} cursos`)
  await upsert('slides', allSlides)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60))
  console.log('  Firestore → Supabase  |  cursos + slides')
  if (DRY_RUN) console.log('  MODE: DRY RUN — no data will be written')
  console.log('='.repeat(60))

  const cursoDocs = await migrateCursos()
  await migrateSlides(cursoDocs)

  console.log('\n' + '='.repeat(60))
  console.log('  Migration complete.')
  console.log('='.repeat(60))
  console.log('\nNext steps:')
  console.log('  1. Migrate Firebase Auth users to Supabase Auth')
  console.log('  2. UPDATE cursos SET created_by = <supabase_uid>')
  console.log('     WHERE id IN (SELECT id FROM cursos WHERE created_by IS NULL)')
}

main().catch(err => {
  console.error('\nMigration failed:', err)
  process.exit(1)
})
