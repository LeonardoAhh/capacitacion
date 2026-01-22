# Sistema de Gestión de Empleados

Sistema moderno de gestión de empleados construido con Next.js y Firebase.

## 🚀 Características

- **Autenticación**: Login seguro con Firebase Authentication
- **Gestión de Empleados**: CRUD completo de empleados
- **Evaluaciones**: Sistema de 3 evaluaciones con fechas automáticas
- **Plan de Formación**: Seguimiento de entrega por departamento
- **Dashboard**: Panel con estadísticas y alertas
- **Reportes**: Cumplimiento por departamento y mes
- **Tema Oscuro/Claro**: Soporte para ambos modos

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de Firebase con proyecto configurado
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/employee-management-app.git
cd employee-management-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` basado en `.env.example`:
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🚀 Despliegue en Vercel

### Opción 1: Despliegue automático desde GitHub

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com) e inicia sesión
3. Haz clic en "New Project"
4. Importa tu repositorio de GitHub
5. Configura las variables de entorno en la sección "Environment Variables"
6. Haz clic en "Deploy"

### Opción 2: Despliegue con Vercel CLI

1. Instala Vercel CLI:
```bash
npm i -g vercel
```

2. Ejecuta:
```bash
vercel
```

3. Sigue las instrucciones y configura las variables de entorno

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── dashboard/      # Panel principal
│   ├── employees/      # Gestión de empleados
│   ├── login/          # Autenticación
│   ├── reports/        # Reportes de formación
│   ├── layout.js       # Layout principal
│   └── page.js         # Página de inicio
├── components/
│   └── Navbar/         # Barra de navegación
├── contexts/
│   ├── AuthContext.js  # Contexto de autenticación
│   └── ThemeContext.js # Contexto del tema
├── lib/
│   └── firebase.js     # Configuración de Firebase
└── styles/
    └── globals.css     # Estilos globales
```

## 🔧 Configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Authentication con Email/Password
4. Crea una base de datos Firestore
5. Configura las reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /employees/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🎨 Tecnologías Utilizadas

- **Framework**: Next.js 14
- **UI**: CSS Modules con variables CSS
- **Backend**: Firebase (Authentication + Firestore)
- **Fuente**: Inter (Google Fonts)

## 📄 Licencia

Este proyecto es privado y de uso interno.

---

Desarrollado con ❤️
