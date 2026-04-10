-- ============================================================
-- Vertx Training Platform — Supabase Schema
-- Migrated from Firebase / Firestore
-- Generated: 2026-04-08
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ROLES (custom role definitions)
-- ============================================================
CREATE TABLE roles (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ
);

-- ============================================================
-- USERS (admin/staff accounts)
-- ============================================================
CREATE TABLE users (
    id                 TEXT PRIMARY KEY,   -- Firebase Auth UID (keep for migration)
    email              TEXT NOT NULL UNIQUE,
    name               TEXT,
    username           TEXT UNIQUE,
    rol                TEXT NOT NULL DEFAULT 'demo',
    avatar_seed        TEXT,
    avatar_style       TEXT,
    sidebar_animation  TEXT,
    fecha_ingreso      DATE,
    genero             TEXT,
    departamento       TEXT,
    puesto             TEXT,
    updated_at         TIMESTAMPTZ,
    -- Supabase Auth foreign key (populated after auth migration)
    auth_uid           UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_rol ON users(rol);

-- ============================================================
-- POSITIONS (job position catalog)
-- ============================================================
CREATE TABLE positions (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name              TEXT NOT NULL UNIQUE,
    department        TEXT,
    required_courses  TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_positions_name ON positions(name);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE employees (
    id                   TEXT PRIMARY KEY,  -- employeeId
    name                 TEXT NOT NULL,
    curp                 TEXT,
    phone                TEXT,
    position             TEXT,
    department           TEXT,
    area                 TEXT,
    shift                TEXT,              -- '1' | '2' | '3' | '4' | 'Mixto'
    start_date           TIMESTAMPTZ,
    contract_end_date    TIMESTAMPTZ,
    eval1_date           TIMESTAMPTZ,
    eval2_date           TIMESTAMPTZ,
    eval3_date           TIMESTAMPTZ,
    status               TEXT DEFAULT 'Activo',
    is_candidato         BOOLEAN DEFAULT false,
    access_code_uses     INTEGER DEFAULT 0,
    last_login_candidate TIMESTAMPTZ,
    cursos_completados   TEXT[] DEFAULT '{}',
    courses_progress     JSONB DEFAULT '{}',
    avatar               TEXT,
    theme                TEXT,
    nickname             TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_position ON employees(position);
CREATE INDEX idx_employees_department ON employees(department);

-- ============================================================
-- EMPLOYEES_PROGRAMACION (employees in training schedules)
-- ============================================================
CREATE TABLE employees_programacion (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name         TEXT NOT NULL,
    employee_id  TEXT REFERENCES employees(id) ON DELETE SET NULL,
    position     TEXT,
    area         TEXT,
    department   TEXT,
    shift        TEXT,
    access_code  TEXT,
    role         TEXT DEFAULT 'employee',
    active       BOOLEAN DEFAULT true,
    programacion JSONB DEFAULT '[]',
    avatar       TEXT,
    theme        TEXT,
    nickname     TEXT,
    created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_emp_prog_employee_id ON employees_programacion(employee_id);

-- ============================================================
-- CURSOS (native courses)
-- ============================================================
CREATE TABLE cursos (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    description         TEXT,
    category            TEXT,
    duration            TEXT,
    instructor          TEXT,
    instructor_role     TEXT,
    company             TEXT,
    year                TEXT,
    published           BOOLEAN DEFAULT false,
    slide_count         INTEGER DEFAULT 0,
    created_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
    contenido_url       TEXT,
    candidate_view      BOOLEAN DEFAULT false,
    puestos_aplicables  TEXT[] DEFAULT '{}',
    tipo                TEXT,               -- 'link' | 'native'
    activo              BOOLEAN DEFAULT true,
    native_course_id    TEXT,
    examen_url          TEXT,
    orden               INTEGER,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cursos_published ON cursos(published);
CREATE INDEX idx_cursos_tipo ON cursos(tipo);

-- ============================================================
-- SLIDES (subcollection of cursos)
-- ============================================================
CREATE TABLE slides (
    id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    curso_id  TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    "order"   INTEGER NOT NULL,
    type      TEXT NOT NULL,  -- 'title' | 'content' | 'objective' | 'quiz' | 'benefits' | 'group_dynamic' | 'group_quiz'
    data      JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_slides_curso_id ON slides(curso_id);
CREATE INDEX idx_slides_order ON slides(curso_id, "order");

-- ============================================================
-- CURSOS_INDUCCION (induction courses)
-- ============================================================
CREATE TABLE cursos_induccion (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre              TEXT,
    title               TEXT,
    puestos_aplicables  TEXT[] DEFAULT '{}',
    activo              BOOLEAN DEFAULT true,
    examen_url          TEXT,
    native_course_id    TEXT REFERENCES cursos(id) ON DELETE SET NULL,
    tipo                TEXT,
    duracion            TEXT
);

-- ============================================================
-- PROGRAMACION (training schedule events)
-- ============================================================
CREATE TABLE programacion (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    employee_id  TEXT,
    course_id    TEXT,
    assigned_at  TIMESTAMPTZ DEFAULT now(),
    status       TEXT DEFAULT 'pending'
);

CREATE INDEX idx_programacion_employee_id ON programacion(employee_id);
CREATE INDEX idx_programacion_course_id ON programacion(course_id);

-- ============================================================
-- TRAINING_RECORDS
-- ============================================================
CREATE TABLE training_records (
    id              TEXT PRIMARY KEY,  -- employeeId
    employee_id     TEXT UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    name            TEXT,
    position        TEXT,
    department      TEXT,
    matrix          JSONB DEFAULT '{}',
    updated_at      TIMESTAMPTZ DEFAULT now(),
    -- Promotion data (embedded)
    promotion_position_start_date TEXT,
    promotion_exam_attempts        JSONB DEFAULT '[]',
    promotion_scheduled_exam       BOOLEAN DEFAULT false,
    promotion_performance_score    NUMERIC
);

-- Training history entries (one row per course completion)
CREATE TABLE training_history (
    id            BIGSERIAL PRIMARY KEY,
    record_id     TEXT NOT NULL REFERENCES training_records(id) ON DELETE CASCADE,
    course_name   TEXT,
    date          DATE,
    score         NUMERIC,
    status        TEXT   -- 'approved' | 'failed'
);

CREATE INDEX idx_training_history_record_id ON training_history(record_id);

-- ============================================================
-- PROMOTION_RULES
-- ============================================================
CREATE TABLE promotion_rules (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    current_position      TEXT NOT NULL,
    promotion_to          TEXT NOT NULL,
    temporality_months    INTEGER,
    exam_min_score        NUMERIC,
    matrix_min_coverage   NUMERIC,
    performance_min_score NUMERIC
);

CREATE INDEX idx_promo_rules_position ON promotion_rules(current_position);

-- ============================================================
-- PROMOTIONS
-- ============================================================
CREATE TABLE promotions (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    from_pos    TEXT,
    to_pos      TEXT,
    date        DATE,
    status      TEXT,
    data        JSONB DEFAULT '{}'
);

-- ============================================================
-- GROUPS
-- ============================================================
CREATE TABLE groups (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name    TEXT,
    members TEXT[] DEFAULT '{}'  -- array of employeeIds
);

CREATE INDEX idx_groups_members ON groups USING GIN(members);

-- ============================================================
-- EXAM_QUESTIONS
-- ============================================================
CREATE TABLE exam_questions (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    theme          TEXT NOT NULL,
    department     TEXT,
    type           TEXT DEFAULT 'Múltiple',
    question       TEXT NOT NULL,
    option_a       TEXT,
    option_b       TEXT,
    option_c       TEXT,
    correct_answer TEXT,   -- 'a' | 'b' | 'c'
    is_fixed       BOOLEAN DEFAULT false,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_exam_questions_theme ON exam_questions(theme);
CREATE INDEX idx_exam_questions_department ON exam_questions(department);

-- ============================================================
-- EXAMENES (published exams for candidates)
-- ============================================================
CREATE TABLE examenes (
    id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title              TEXT,
    status             TEXT DEFAULT 'published',
    puestos_aplicables TEXT[] DEFAULT '{}'
);

-- ============================================================
-- MURAL_EXAMS
-- ============================================================
CREATE TABLE mural_exams (
    id               TEXT PRIMARY KEY,  -- employeeId
    employee_id      TEXT,
    first_name       TEXT,
    current_position TEXT,
    promotion_to     TEXT,
    passed           BOOLEAN DEFAULT false,
    score            NUMERIC,
    required_score   NUMERIC,
    recommendations  TEXT[] DEFAULT '{}',
    date             DATE,
    active           BOOLEAN DEFAULT true
);

CREATE INDEX idx_mural_exams_active ON mural_exams(active);

-- ============================================================
-- AUDIT_LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id         BIGSERIAL PRIMARY KEY,
    module     TEXT,
    user_id    TEXT,
    user_name  TEXT,
    action     TEXT,   -- 'create' | 'update' | 'delete' | 'publish' | 'rename' | 'import'
    target     TEXT,
    detail     TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- APP_CONFIG
-- ============================================================
CREATE TABLE app_config (
    key    TEXT PRIMARY KEY,
    value  JSONB NOT NULL DEFAULT '{}'
);

-- Seed default config
INSERT INTO app_config (key, value) VALUES
    ('general', '{"maintenanceMode": false, "maintenanceMessage": "", "maintenanceUntil": null}'),
    ('mural',   '{"successMessage": "", "motivationalMessage": ""}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- USER PROGRESS (subcollection users/{uid}/progress/{courseId})
-- ============================================================
CREATE TABLE user_progress (
    id        BIGSERIAL PRIMARY KEY,
    user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    data      JSONB NOT NULL DEFAULT '{}',
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees_programacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos_induccion       ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacion           ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_rules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE examenes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mural_exams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress          ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records       ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's rol from users table
CREATE OR REPLACE FUNCTION get_my_rol()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT rol FROM users WHERE auth_uid = auth.uid() LIMIT 1;
$$;

-- ── app_config: anyone authenticated can read general; only super_admin writes ──
CREATE POLICY "app_config_read"  ON app_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "app_config_write" ON app_config FOR ALL    USING (get_my_rol() = 'super_admin');

-- ── users: read own row; super_admin reads/writes all ──
CREATE POLICY "users_read_own"       ON users FOR SELECT USING (auth_uid = auth.uid() OR get_my_rol() IN ('super_admin','rh'));
CREATE POLICY "users_update_own"     ON users FOR UPDATE USING (auth_uid = auth.uid());
CREATE POLICY "users_admin_all"      ON users FOR ALL    USING (get_my_rol() = 'super_admin');

-- ── roles: only super_admin ──
CREATE POLICY "roles_admin" ON roles FOR ALL USING (get_my_rol() = 'super_admin');

-- ── positions: authenticated read; super_admin/rh write ──
CREATE POLICY "positions_read"  ON positions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "positions_write" ON positions FOR ALL    USING (get_my_rol() IN ('super_admin','rh'));

-- ── employees: rh/admin/super_admin full; instructor read ──
CREATE POLICY "employees_staff_all"  ON employees FOR ALL    USING (get_my_rol() IN ('super_admin','rh'));
CREATE POLICY "employees_read"       ON employees FOR SELECT USING (get_my_rol() IN ('instructor','demo'));

-- ── cursos / slides: published readable by authenticated; super_admin/instructor write ──
CREATE POLICY "cursos_read"          ON cursos FOR SELECT USING (published = true OR get_my_rol() IN ('super_admin','instructor'));
CREATE POLICY "cursos_write"         ON cursos FOR ALL    USING (get_my_rol() IN ('super_admin','instructor'));
CREATE POLICY "slides_read"          ON slides FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "slides_write"         ON slides FOR ALL    USING (get_my_rol() IN ('super_admin','instructor'));

-- ── mural_exams: public get (no auth needed for active=true); super_admin writes ──
CREATE POLICY "mural_read_active"    ON mural_exams FOR SELECT USING (active = true);
CREATE POLICY "mural_admin_write"    ON mural_exams FOR ALL    USING (get_my_rol() = 'super_admin');

-- ── audit_logs: authenticated create; admin/instructor read ──
CREATE POLICY "audit_create"         ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "audit_read"           ON audit_logs FOR SELECT USING (get_my_rol() IN ('super_admin','instructor'));

-- ── training_records: rh/super_admin/instructor read-write ──
CREATE POLICY "training_records_rw"  ON training_records FOR ALL USING (get_my_rol() IN ('super_admin','rh','instructor'));
CREATE POLICY "training_history_rw"  ON training_history FOR ALL USING (get_my_rol() IN ('super_admin','rh','instructor'));

-- ── user_progress: owner read/write ──
CREATE POLICY "progress_owner"       ON user_progress FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_uid = auth.uid() LIMIT 1)
);

-- ── exam_questions: authenticated read; super_admin/instructor write ──
CREATE POLICY "exam_q_read"          ON exam_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "exam_q_write"         ON exam_questions FOR ALL    USING (get_my_rol() IN ('super_admin','instructor'));

-- ── promotion_rules: authenticated read; super_admin write ──
CREATE POLICY "promo_rules_read"     ON promotion_rules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "promo_rules_write"    ON promotion_rules FOR ALL    USING (get_my_rol() = 'super_admin');

-- ── remaining tables: super_admin/rh full access ──
CREATE POLICY "prog_rw"              ON programacion           FOR ALL USING (get_my_rol() IN ('super_admin','rh','instructor'));
CREATE POLICY "emp_prog_rw"          ON employees_programacion FOR ALL USING (get_my_rol() IN ('super_admin','rh','instructor'));
CREATE POLICY "groups_rw"            ON groups                 FOR ALL USING (get_my_rol() IN ('super_admin','rh','instructor'));
CREATE POLICY "promotions_rw"        ON promotions             FOR ALL USING (get_my_rol() IN ('super_admin','rh'));
CREATE POLICY "examenes_read"        ON examenes               FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "examenes_write"       ON examenes               FOR ALL    USING (get_my_rol() IN ('super_admin','instructor'));
CREATE POLICY "cursos_induccion_r"   ON cursos_induccion       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cursos_induccion_w"   ON cursos_induccion       FOR ALL    USING (get_my_rol() IN ('super_admin','instructor'));
