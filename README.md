# 🏢 Portal RRHH - Viñoplastic

¡Bienvenido al código fuente del Portal de Recursos Humanos! 
Esta aplicación gestiona la selección, perfiles, inducción, exámenes, capacitación y gamificación de los candidatos y empleados de la empresa.

---

## �️ Tecnologías Principales

- **Framework:** [Next.js 14](https://nextjs.org/) (Usando el moderno *App Router*)
- **Estilos:** CSS Modules puristas (Patrón de diseño *Editorial White* con detalles en color Ámbar)
- **Animaciones:** Framer Motion (`framer-motion`)
- **Iconos:** Lucide React (`lucide-react`)
- **Frontend / PWA:** Soporte nativo para funcionar como aplicación instalable en móviles (`next-pwa`)

---

## 📂 Estructura del Proyecto

El proyecto está diseñado pensando en la escalabilidad y una clara separación de responsabilidades. Toda la aplicación vive dentro de la carpeta `src/`.

### `src/app/` (Rutas de la Aplicación)
Aquí es donde funciona la magia del **App Router de Next.js**. Cada subcarpeta que contiene un archivo `page.js` se convierte en una URL accesible.

- `api/`: Endpoints del backend (funciones Serverless que interactúan con la base de datos).
- `candidatos/`, `capacitacion/`, `dashboard/`, `employees/`, `induccion/`, `training/`, etc: Páginas completas, cada una alberga su propia lógica de vistas para las diferentes partes del sistema.
- `modulos/`: El portal principal de lanzamiento (Landing "Editorial") donde el usuario selecciona a qué área del HRIS va a ingresar.
- `login/`: Rutas de autenticación.
- `layout.js`: El molde principal (HTML base, metadatos, fuentes tipo Geist/Playfair).

---

### `src/components/` (Nuestros Bloques de Lego)
El corazón visual de la aplicación. Se divide en cinco categorías semánticas para evitar que se amontonen:

- 🔐 **`auth/`**: Todo el núcleo del inicio de sesión.
  - `LoginBase` (La estructura CSS maestra compartida)
  - `UnifiedLogin`, `CandidateLogin`, `ModernLogin`, `TrainingLogin` (Variantes con su lógica)

- 🚀 **`features/`**: Componentes grandes que representan un fragmento importante de una vista o lógica de negocio (mini-aplicaciones).
  - Ejemplos: `Dashboard`, `Gamification` (medallero, niveles), `Courses` (reproductor interactivo), `TriviaGame`, `Profile`.

- 🛡️ **`guards/`**: Componentes protectores ("Middlewares visuales") que envuelven la app.
  - Ejemplos: `DemoGuard` (protege rutas contra usuarios modo demo), `MaintenanceGuard` (activa la pantalla de mantenimiento), `PWAPrompt` (incita la instalación móvil).

- 📐 **`layout/`**: Elementos constantes del armazón de la página.
  - Ejemplos: `Navbar` (Barra superior), `ProfileDropdown` (Menú del usuario), `UserMenu`, `ThemeSelector`.

- 🧩 **`ui/`**: Componentes puramente visuales, **altamente reutilizables** y "tontos" (sin lógica compleja del negocio).
  - Ejemplos: `ModuleCard` (tarjetas de módulos blancas), `EmployeeSearchBar`, `Charts`, `Avatars`, botones, etc.

---

### ⚙️ Lógica y Configuración

- **`src/contexts/`**: Almacena el Estado Global de React usando *Context API*. Destaca el `AuthContext.js` que se encarga de saber quién está logueado en cualquier parte del portal y gestionar la permanencia de la sesión.
- **`src/hooks/`**: Funciones reutilizables de React (`useAuth`, modales, etc.).
- **`src/lib/` y `src/utils/`**: Funciones ayudantes agnósticas (formatear fechas, procesar colores, conexiones de base de datos como firebase o supabase).
- **`src/data/`**: Información "quemada", catálogos que no cambian a menudo.
- **`src/middleware.js`**: El archivo guardia que revisa el token de seguridad o las cookies *antes* de que cargue el contenido de `src/app/`, interceptando ataques o sesiones vencidas.

---

## 🚀 Comandos Útiles

Recuerda que para ejecutar o compilar este proyecto requieres **Node.js**:

- **Iniciar entorno de Desarrollo (Dev Server):**
  \`\`\`bash
  npm run dev
  \`\`\`
  *El proyecto inicia por defecto en `http://localhost:3000`. Con Hot Module Replacement (HMR) activo.*

- **Compilar para Producción:**
  \`\`\`bash
  npm run build
  \`\`\`
  *Minifica CSS/JS, optimiza imágenes e inyecta el Service Worker de la PWA. Debes correrlo antes de desplegar.*

- **Probar la versión de Producción:**
  \`\`\`bash
  npm run start
  \`\`\`
  *Previamente debes haber corrido `npm run build`.*

---

## 🎨 Lineamientos de Diseño: "Editorial White"
El nuevo flujo de diseño de la aplicación establece las siguientes premisas que todo componente nuevo debe seguir:

1. **Jerarquía Tipográfica:** Tipografía 'Playfair Display' (serif clásico) para encabezados dramáticos y 'Geist' (sans-serif limpio) para detalles y formularios.
2. **Minimalismo y Contraste:** Uso fuerte de blanco puro (`#ffffff`) y off-white (`#fafaf8`) para los fondos, alejándose del gris corporativo.
3. **El Color Ámbar (`#f59e0b`):** Único color primario en botones, líneas decorativas y hovers para llamar a la acción.
4. **CSS Modules:** Todo el estilo se maneja mediante módulos `.module.css` asegurando aislamiento.

¡Disfruta desarrollando en el Portal Viñoplastic HRIS!
