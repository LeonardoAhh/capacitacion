# 🏭 Vertx — Portal HRIS Viñoplastic

Plataforma integral de Recursos Humanos para la gestión de candidatos, empleados, capacitación, inducción, evaluaciones y gamificación.

---

## ⚙️ Tecnologías Principales

| Categoría | Tecnología |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) — App Router |
| **Base de datos** | [Firebase / Firestore](https://firebase.google.com/) |
| **Estilos** | CSS Modules puros (sin Tailwind en runtime) |
| **Animaciones** | Framer Motion + Motion |
| **Iconos** | Lucide React + React Icons |
| **Gráficas** | Recharts |
| **Calendario** | React Big Calendar |
| **Drag & Drop** | @dnd-kit (core, sortable, utilities) |
| **Avatares** | DiceBear (@dicebear/core + @dicebear/collection) |
| **PDF** | jsPDF + jsPDF-autotable |
| **Excel** | XLSX |
| **Fechas** | date-fns |
| **Confetti** | canvas-confetti |
| **PWA** | next-pwa (Service Worker + Workbox) |
| **MFA** | otplib + qrcode |
| **Google Drive** | googleapis |
| **UI Primitives** | @radix-ui/react-dropdown-menu |

---

## 🎨 Sistema de Diseño

### Temas disponibles

La plataforma soporta **cuatro temas**, conmutables en tiempo real desde `ThemeSelector`. Se aplican vía el atributo `data-theme` en el `<html>`.

| Tema | Descripción |
|---|---|
| `light` (default) | **Editorial White** — Fondo blanco puro, acento Ámbar `#f59e0b` |
| `dark` | **Dark Glass Viñoplastic** — Fondo Navy profundo `#060612`, acento Azul corporativo |
| `blue` | Fondo azul claro, acento `#0055ff` |
| `vinoplastic` | Azul marino `#1e3a8a` institucional, fondos slate |

### Sistema tipográfico

Todas las fuentes se cargan **únicamente** en `src/app/layout.js` y se exponen como variables CSS globales:

| Variable CSS | Fuente | Uso |
|---|---|---|
| `--font-body` | **Roboto** (300/400/500/700) | Texto general, formularios, etiquetas |
| `--font-serif` | **Montserrat** (400–800) | Títulos y encabezados dramáticos |
| `--font-mono` | **Roboto Mono** | Código, datos técnicos |

> Playfair Display se importa adicionalmente vía CSS para usos editoriales específicos.

### Variables CSS globales de diseño

El sistema completo de tokens vive en `src/styles/globals.css`:

- **Colores semánticos:** `--color-primary`, `--color-secondary`, `--color-accent`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`
- **Fondos:** `--bg-primary`, `--bg-secondary`, `--app-background`, `--card-background`
- **Textos:** `--text-primary`, `--text-secondary`, `--text-tertiary`
- **Espaciado (grid de 8pt):** `--spacing-xs` → `--spacing-3xl`
- **Radios:** `--radius-sm` → `--radius-full`
- **Sombras:** `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Transiciones:** `--transition-fast` / `--transition-base` / `--transition-slow` con bezier spring

---

## 🗂️ Estructura del Proyecto

```
src/
├── app/                      # Rutas Next.js App Router
├── components/               # Componentes React
│   ├── auth/                 # Pantallas de autenticación
│   ├── features/             # Módulos de negocio completos
│   ├── guards/               # Guardias y middlewares visuales
│   ├── layout/               # Elementos estructurales persistentes
│   └── ui/                   # Átomos y moléculas reutilizables
├── contexts/                 # Estado global (Context API)
├── hooks/                    # Custom hooks de React
├── lib/                      # Servicios y utilidades del servidor
├── utils/                    # Helpers puros del cliente
├── styles/                   # CSS global y sistema de cursos
└── middleware.js             # Guardia de rutas con autenticación
```

---

## 📂 Rutas de la Aplicación (`src/app/`)

### Rutas públicas
| Ruta | Descripción |
|---|---|
| `/` | Landing page — componente `ShapeHero` |
| `/login` | Login de administradores/RRHH |
| `/candidatos` | Login de candidatos |
| `/training/login` | Login de empleados (módulo Training) |
| `/offline` | Página fallback sin conexión (PWA) |
| `/presentacion` | Presentación corporativa |

### Rutas protegidas — Sesión `admin`
| Ruta | Descripción |
|---|---|
| `/dashboard` | Panel principal RRHH (Bento Grid, estadísticas) |
| `/dashboard/candidates` | Vista de candidatos del dashboard |
| `/dashboard/programacion` | Programación de actividades |
| `/dashboard/training/registro` | Registro de trainings desde el dashboard |
| `/employees` | Gestión completa de empleados |
| `/capacitacion` | Módulo completo de capacitación |
| `/capacitacion/analisis` | Análisis de datos de capacitación |
| `/capacitacion/calendario` | Calendario de eventos y cursos |
| `/capacitacion/catalogo` | Catálogo de cursos |
| `/capacitacion/comparacion` | Comparativo de desempeño |
| `/capacitacion/cumplimiento` | Tablero de cumplimiento |
| `/capacitacion/empleados` | Empleados en capacitación |
| `/capacitacion/examen` | Generador de exámenes |
| `/capacitacion/examen/respuestas` | Dashboard de respuestas y banco de preguntas |
| `/capacitacion/grupos` | Gestión de grupos |
| `/capacitacion/matriz` | Matriz de capacitación |
| `/capacitacion/perfil` | Perfil detallado del empleado (General, ILUO, Training, Docs, Promociones) |
| `/capacitacion/promociones` | Gestión de promociones y ascensos |
| `/capacitacion/registro` | Registro de nuevas capacitaciones |
| `/induccion` | Portal de inducción (gestión admin) |
| `/induccion/cursos/[id]/editar` | Editor de cursos dinámico (ruta dinámica) |
| `/iluo-manager` | Gestión de matrices ILUO |
| `/mural` | Mural / tablero de avisos con confetti |
| `/reports` | Reportes y exportaciones |
| `/profile` | Perfil del usuario administrador (MFA, avatar) |
| `/complete-profile` | Completar perfil al primer acceso |

### Rutas protegidas — Sesión `candidate`
| Ruta | Descripción |
|---|---|
| `/candidatos/dashboard` | Dashboard del candidato (cursos, roadmap, exámenes, contacto) |

### Rutas protegidas — Sesión `training`
| Ruta | Descripción |
|---|---|
| `/training/dashboard` | Dashboard del empleado en capacitación |

### Rutas API (Serverless)
| Ruta | Descripción |
|---|---|
| `/api/auth/session` | Crear/destruir sesión firmada con HMAC |
| `/api/csrf` | Generación de token CSRF |
| `/api/drive-image` | Proxy de imágenes desde Google Drive |
| `/api/gallery-upload` | Subida de imágenes a la galería |
| `/api/upload` | Subida general de archivos |
| `/api/test-auth` | Diagnóstico de autenticación |

---

## 🧩 Componentes (`src/components/`)

### 🔐 `auth/` — Autenticación
- `CandidateLogin` — Login de candidatos con validación
- `ModernLogin` — Login de administradores estilo editorial
- `TrainingLogin` — Login del módulo de entrenamiento
- `UnifiedLogin` — Login unificado reutilizable
- `LoginBase/loginAnimations` — Animaciones compartidas de login
- `LoginBase/mergeStyles` — Utilidad de fusión de estilos

### 🚀 `features/` — Módulos de negocio
- **`CandidateSidebar/`** — Sidebar y header móvil del candidato
- **`CatalogSeeder/`** — Seeder visual del catálogo de cursos
- **`Courses/`** — Reproductor de cursos interactivo completo
  - `CoursePlayer` — Reproductor principal
  - `CourseWizardModal` — Asistente de creación de cursos
  - `SlideRenderer` — Renderizador de slides
  - `TableOfContents` — Tabla de contenidos
  - `CompletionScreen` — Pantalla de finalización con confetti
  - **`Editor/`** — Editor de cursos drag & drop
    - `SlideEditorPanel`, `SlideList`, `RichTextEditor`, `IconPicker`, `ImageUploader`, `MediaUploader`
    - Editores por tipo de slide: `TitleSlide`, `ContentSlide`, `QuizSlide`, `StepsSlide`, `ComparisonSlide`, `IconGridSlide`, `DynamicSlide`
  - **`slides/`** — Renders de cada tipo: `TitleSlide`, `ContentSlide`, `BenefitsSlide`, `DefinitionSlide`, `ObjectiveSlide`, `QuizSlide`, `StepsSlide`, `ComparisonSlide`, `IconGridSlide`
- **`Dashboard/`** — Componentes del panel RRHH
  - `DashboardBentoGrid`, `HeroStatsRow`, `AlertsRow`, `QuickActionsGrid`
  - `CandidatoCard`, `CandidateDrawer`, `EmployeeDrawer`
  - `CounterAnimation`
- **`DynamicCredits/`** — Créditos animados dinámicos
- **`Gamification/`** — Sistema de logros y niveles
  - `BadgesGallery` — Galería de insignias
  - `CertificateCard` — Tarjeta de certificado descargable
  - `LevelProgress` — Barra de nivel y XP
  - `TrainingCompliance` — Cumplimiento de capacitación
- **`Induccion/`** — Portal de inducción
  - `InduccionLayout`, `InduccionSidebar`, `CourseCard`, `GallerySection`, `AuditTimeline`
  - Vistas: `CandidateCoursesView`, `GalleryView`, `InteractiveCoursesView`, `MaterialView`
- **`Profile/`** — Perfil avanzado
  - `AdminManager` — Gestión de administradores
  - `MFASetup` — Configuración MFA (OTP + QR)
- **`QuestionManager/`** — Banco de preguntas para exámenes
- **`SetupWizard/`** — Asistente de configuración inicial
- **`Training/`** — Módulo de seguimiento de entrenamiento
  - `CourseCard`, `CourseViewer`, `EditEmployeeModal`, `EmployeeAssignmentsModal`
  - `EvaluationModal`, `MonitoringControls`, `MonitoringStatsRow`, `MonitoringTable`
- **`TriviaGame/`** — Juego de trivia para gamificación
- **`employees/`** — CRUD de empleados
  - `EmployeeCards`, `EmployeeFilters`, `EmployeeForm`, `EmployeeTable`

### 🛡️ `guards/` — Protecciones visuales
- `DemoGuard` — Bloquea acciones en modo demo
- `MaintenanceGuard` + `MaintenanceScreen` — Pantalla de mantenimiento
- `PWAPrompt` — Prompt de instalación como app móvil
- `pwa/OfflineIndicator` — Indicador de conexión perdida
- `pwa/UpdatePrompt` — Prompt de actualización del Service Worker

### 📐 `layout/` — Estructura persistente
- `AdminLayout` — Layout base para vistas admin
- `Logo/AnimatedLogo` + `Logo/LogoVinoPlastic` — Logo animado y estático
- `MainSidebar` — Sidebar principal de navegación
- `Navbar/Navbar` + `Navbar/MotivationalWidget` — Barra superior con widget motivacional
- `ProfileDropdown` — Menú desplegable de perfil
- `ThemeSelector` + `ThemeSelectorModal` — Selector de tema
- `ThemeToggle` — Toggle rápido light/dark
- `UserMenu` — Menú de usuario

### 🧩 `ui/` — Componentes atómicos reutilizables
`AILoadingState`, `AccessibleChart`, `Avatar`, `AvatarSelector`, `BackButton`, `BackgroundLines`, `Badge`, `Button`, `Card`, `Charts`, `Combobox`, `ConfirmDialog`, `Dialog`, `Drawer`, `EmployeeSearchBar`, `EmployeeSkeleton`, `FormField`, `HyperText`, `Input`, `LazyIframe`, `ModuleCard`, `Progress`, `Select`, `ShapeHero`, `ActionSearchBar`, `Skeleton`, `SkeletonCard`, `SparklesText`, `SwitchButton`, `Table`, `Tabs`, `Toast`, `WelcomeModal`, `icons/gemini`

---

## 🔒 Seguridad (`src/middleware.js`)

El middleware intercepta **todas las peticiones** antes de que lleguen a las páginas:

1. **Rate Limiting** — APIs protegidas contra abuso (`src/lib/rateLimit.js`)
2. **CSRF** — Token de doble submit para mutaciones en `/api/` (`src/lib/csrf.js`)
3. **Autenticación por tipo de sesión** — Cookie HMAC-signed con tres roles:
   - `admin` → Rutas de RRHH y administración
   - `candidate` → Dashboard del candidato
   - `training` → Dashboard de entrenamiento
4. **Sanitización de inputs** — `src/utils/sanitize.js`
5. **MFA** — Autenticación de dos factores con TOTP (`otplib`) y QR code

---

## 🪝 Hooks personalizados (`src/hooks/`)

| Hook | Función |
|---|---|
| `useCandidateData` | Datos del candidato desde Firestore |
| `useCatalogs` | Catálogos de cursos y materias |
| `useComplianceRecalc` | Recálculo de cumplimiento de capacitación |
| `useConfirm` | Modal de confirmación reutilizable |
| `useCsrf` | Obtención del token CSRF |
| `useDashboardStats` | Estadísticas del panel RRHH |
| `useDebounce` | Debounce para búsquedas |
| `useEmployeeCRUD` | Alta/baja/modificación de empleados |
| `useEmployeeDates` | Manejo de fechas laborales |
| `useEmployeePagination` | Paginación de listados |
| `useEmployeeSearch` | Búsqueda y filtrado de empleados |
| `useEmployees` | Listado reactivo de empleados |
| `useFirestoreCache` | Cache local de queries de Firestore |
| `useFormValidation` | Validación de formularios |
| `useGamification` | Lógica de puntos, niveles e insignias |
| `useIsMobile` | Detección de dispositivo móvil |
| `useLazyLoad` | Carga diferida con Intersection Observer |
| `useLocalStorage` | Persistencia en localStorage |
| `useNotifications` | Notificaciones push / in-app |
| `useOfflineStorage` | Almacenamiento offline con IndexedDB |
| `usePWAInstall` | Prompt de instalación PWA |
| `useServiceWorker` | Gestión del Service Worker |
| `useTrainingData` | Datos del módulo de entrenamiento |

---

## 📚 Librerías de servicio (`src/lib/`)

| Archivo | Descripción |
|---|---|
| `firebase.js` | Inicialización de Firebase App + Firestore |
| `firebaseService.js` | Funciones CRUD sobre Firestore |
| `sessionApi.js` | Llamadas a `/api/auth/session` |
| `cookieSign.js` | Firma y verificación HMAC de cookies |
| `csrf.js` | Middleware CSRF (servidor) |
| `rateLimit.js` | Rate limiter en memoria para APIs |
| `courseService.js` | Servicio de cursos interactivos |
| `trainingDataService.js` | Servicio de datos de entrenamiento |
| `compliance.js` + `complianceUtils.js` | Lógica de cumplimiento de capacitación |
| `promotionUtils.js` | Lógica de evaluación para promociones |
| `induccionAudit.js` | Auditoría de acciones en inducción |
| `drive.js` | Integración con Google Drive API |
| `upload.js` | Manejo de subida de archivos |
| `imageUtils.js` | Utilidades de procesamiento de imágenes |
| `rhUtils.js` | Utilidades generales de RRHH |
| `utils.js` | Helpers genéricos |
| `icons.js` | Mapa de iconos de Lucide |
| `seedCapacitacion.js` + `seedHistorial.js` | Scripts de seed de datos |
| `updateCourseValidity.js` | Actualización masiva de vigencias |
| `pwa/serviceWorkerManager.js` | Gestión del Service Worker desde el cliente |

---

## 🛠️ Utilidades del cliente (`src/utils/`)

| Archivo | Descripción |
|---|---|
| `formatters.js` | Formateo de fechas, monedas, porcentajes |
| `nameUtils.js` | Normalización y formateo de nombres |
| `sanitize.js` | Sanitización de inputs de usuario |
| `exportUtils.js` | Exportación a Excel / CSV |
| `importUtils.js` | Importación desde Excel |
| `pdfGenerator.js` | Generación de PDFs con jsPDF |
| `dc3Generator.js` | Generador de constancias DC-3 |
| `gamificationConfig.js` | Configuración de niveles, XP e insignias |
| `storage.js` | Abstracción de localStorage / sessionStorage |
| `debounce.js` | Función debounce utilitaria |

---

## 📱 PWA (Progressive Web App)

La plataforma es completamente instalable como app nativa en móviles y escritorio:

- **Service Worker** generado automáticamente por `next-pwa` con Workbox
- **Caché estratégico** por categoría de recurso (fuentes, imágenes, JS, CSS, datos)
- **Offline fallback** → redirige a `/offline` cuando no hay red
- **Indicador de conexión** (`OfflineIndicator`) visible en tiempo real
- **Prompt de actualización** (`UpdatePrompt`) cuando hay nueva versión del SW
- **Manifest** completo con iconos para iOS y Android

---

## 🗄️ Datos y plantillas (`public/`)

- `examenes/induccion_empresa.json` — Examen de inducción corporativa
- `evaluaciones.json` — Banco de evaluaciones
- `templates/plantilla_capacitaciones.json` — Plantilla de importación de capacitaciones
- `Manual.html` — Manual de usuario interactivo con capturas
- `assets/` — Imágenes paso a paso del manual

---

## 🚀 Comandos

```bash
# Servidor de desarrollo (HMR activo, PWA desactivada)
npm run dev

# Compilar para producción (minifica, optimiza, genera Service Worker)
npm run build

# Iniciar servidor de producción (requiere build previo)
npm run start

# Linting
npm run lint
```

> El proyecto inicia en `http://localhost:3000` por defecto.

---

## 📜 Scripts de mantenimiento (`scripts/`)

- `fix-backgrounds.ps1` — Corrección masiva de fondos en CSS Modules
- `fix-dark-backgrounds.ps1` — Corrección de fondos en modo oscuro

---

*Vertx — Plataforma HRIS Viñoplastic · Querétaro, México*
