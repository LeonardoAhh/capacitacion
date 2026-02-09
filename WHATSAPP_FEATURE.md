# 📱 Funcionalidad de WhatsApp en Candidatos

## ✨ Característica Implementada

Se agregó la capacidad de enviar mensajes de WhatsApp a los candidatos directamente desde la tabla de monitoreo, con mensajes predefinidos relacionados con su capacitación.

---

## 🎯 Ubicación

**Página**: `/dashboard/candidates`

**Vista**: Tabla de candidatos en capacitación

---

## 🔧 Funcionalidades

### 1. **Botón de WhatsApp por Candidato**
- ✅ Botón verde con ícono de WhatsApp en cada fila
- ✅ Se deshabilita si el candidato no tiene teléfono registrado
- ✅ Previene que se abra el drawer del candidato al hacer click
- ✅ Hover effect con elevación y sombra

### 2. **Modal de Selección de Mensajes**
Al hacer click en el botón de WhatsApp:
- ✅ Se abre un modal con 5 mensajes predefinidos
- ✅ Muestra el nombre del candidato
- ✅ Vista previa del mensaje personalizado
- ✅ Diseño responsive y con dark mode

### 3. **Mensajes Predefinidos**

#### ✅ **Revisión de Progreso**
```
Hola [Nombre], ¿cómo vas con tu capacitación? Nos gustaría saber si tienes alguna duda o necesitas ayuda.
```

#### ❓ **Consulta de Problemas**
```
Hola [Nombre], hemos notado que no has avanzado mucho en tus cursos. ¿Hay algún problema o dificultad que podamos ayudarte a resolver?
```

#### ⏰ **Recordatorio de Inactividad**
```
Hola [Nombre], notamos que no has ingresado a la plataforma recientemente. Recuerda que es importante completar tus cursos a tiempo. ¿Necesitas ayuda?
```

#### 🎯 **Recordatorio de Finalización**
```
Hola [Nombre], te recordamos completar los cursos pendientes. Cualquier duda que tengas, estamos para ayudarte.
```

#### 🤝 **Ofrecimiento de Apoyo**
```
Hola [Nombre], queremos ofrecerte nuestro apoyo en tu proceso de capacitación. ¿Hay algo en lo que podamos asistirte?
```

---

## 💻 Implementación Técnica

### Estructura de Datos

```javascript
// Estado del modal
const [whatsappModal, setWhatsappModal] = useState({
    isOpen: false,
    candidate: null
});

// Array de templates
const messageTemplates = [
    {
        id: 'progress_check',
        title: '✅ Revisión de Progreso',
        message: (name) => `Hola ${name}, ...`
    },
    // ...más templates
];
```

### Flujo de Ejecución

1. **Usuario hace click** en botón de WhatsApp
   ```javascript
   handleWhatsApp(candidate, e)
   ```

2. **Se abre el modal** con el candidato seleccionado
   ```javascript
   setWhatsappModal({ isOpen: true, candidate })
   ```

3. **Usuario selecciona mensaje**
   ```javascript
   sendWhatsAppMessage(template)
   ```

4. **Se limpia el número de teléfono** (elimina espacios, guiones)
   ```javascript
   const cleanPhone = phone.replace(/\D/g, '');
   ```

5. **Se genera el mensaje** con el nombre del candidato
   ```javascript
   const message = template.message(name);
   const encodedMessage = encodeURIComponent(message);
   ```

6. **Se abre WhatsApp Web** en nueva pestaña
   ```javascript
   window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
   ```

---

## 🎨 Estilos Principales

### Botón de WhatsApp
```css
.whatsappButton {
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    border-radius: 8px;
    transition: all 0.2s ease;
}

.whatsappButton:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
}
```

### Modal de Templates
```css
.templateButton {
    background: #f5f5f7;
    border: 2px solid transparent;
    transition: all 0.2s ease;
}

.templateButton:hover {
    border-color: #25D366;
    background: rgba(37, 211, 102, 0.05);
    transform: translateX(4px);
}
```

---

## 📋 Requisitos de Datos

### Campo Necesario en Employee/Candidate
```javascript
{
    name: "Juan Pérez",
    phone: "5215512345678",  // ✅ Requerido para WhatsApp
    // ... otros campos
}
```

**Nota**: El número se limpia automáticamente (se eliminan espacios, guiones, paréntesis, etc.)

---

## 🔍 Casos de Uso

### Caso 1: **Candidato Inactivo**
```
Situación: No ha ingresado en 7 días
Acción: Click en WhatsApp → Seleccionar "⏰ Recordatorio de Inactividad"
Resultado: Se abre WhatsApp con mensaje personalizado
```

### Caso 2: **Candidato con Problemas**
```
Situación: Progreso estancado en 20%
Acción: Click en WhatsApp → Seleccionar "❓ Consulta de Problemas"
Resultado: Mensaje preguntando sobre dificultades
```

### Caso 3: **Sin Número de Teléfono**
```
Situación: Candidato sin phone registrado
Acción: Botón aparece deshabilitado (gris)
Resultado: Tooltip indica "Sin número de teléfono"
```

---

## 📱 Responsive Design

### Desktop (>768px)
- Modal en el centro de la pantalla
- Ancho máximo: 600px
- Todas las templates visibles

### Mobile (<768px)
- Modal ocupa 95% del ancho
- Padding reducido
- Fuentes más pequeñas
- Templates apiladas verticalmente

---

## 🌙 Dark Mode Support

✅ **Modal**: Fondo oscuro (#1c1c1e)  
✅ **Templates**: Fondo #2c2c2e  
✅ **Texto**: Colores ajustados para contraste  
✅ **Botón cerrar**: Fondo semi-transparente

---

## ✅ Testing Checklist

- [x] Botón aparece en cada fila de candidatos
- [x] Botón se deshabilita si no hay teléfono
- [x] Modal se abre al hacer click
- [x] Click en modal overlay cierra el modal
- [x] Click en X cierra el modal
- [x] Nombre del candidato aparece en subtitle
- [x] Preview de mensajes muestra nombre correcto
- [x] Click en template abre WhatsApp Web
- [x] Número se limpia correctamente
- [x] Mensaje se codifica para URL
- [x] Modal responsive en mobile
- [x] Dark mode funciona correctamente

---

## 🚀 Próximas Mejoras Sugeridas

1. **Historial de Mensajes** 
   - Guardar registro de mensajes enviados
   - Mostrar última fecha de contacto

2. **Templates Personalizados**
   - Permitir al admin crear sus propios templates
   - Guardar en Firestore

3. **Envío Masivo**
   - Seleccionar múltiples candidatos
   - Enviar mismo mensaje a todos

4. **Integración con WhatsApp Business API**
   - Envío directo sin abrir navegador
   - Confirmación de entrega

---

**Fecha de Implementación**: 2026-02-09  
**Versión**: 1.0  
**Status**: ✅ Completado y Funcional
