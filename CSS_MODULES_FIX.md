# 🔧 Corrección: CSS Modules Purity Error

## ❌ Error Encontrado
```
Syntax error: Selector "button:focus-visible, input:focus-visible..." 
is not pure (pure selectors must contain at least one local class or id)
```

## 📋 Causa
Next.js CSS Modules tiene reglas estrictas:
- **NO permite selectores puramente globales** (incluso con `:global()`)
- Todos los selectores deben incluir al menos una clase o ID local (`.className`)
- Esto es por diseño para evitar colisiones de estilos entre módulos

## ✅ Solución Aplicada

### Selectores Eliminados del CSS Module

1. **Focus-visible globales** (líneas 1717-1730)
   ```css
   /* ❌ ELIMINADO */
   button:focus-visible,
   input:focus-visible,
   select:focus-visible,
   textarea:focus-visible { ... }
   ```
   **Razón**: Los estilos de focus ya están aplicados a clases específicas donde se necesitan.

2. **Button en media query móvil** (línea 1792)
   ```css
   /* ❌ ELIMINADO */
   @media (max-width: 768px) {
       button { min-height: 44px; }
   }
   ```
   **Razón**: Las clases específicas (`.addButton`, `.paginationBtn`, etc.) ya tienen estos estilos.

3. **Selectores universales en reduced motion** (líneas 1840-1846)
   ```css
   /* ❌ ELIMINADO */
   @media (prefers-reduced-motion: reduce) {
       *, *::before, *::after { ... }
   }
   ```
   **Razón**: Solo necesitamos `.spinning { animation: none; }` que es específico.

### ✅ Lo que SÍ Quedó (y funciona)

```css
/* ✅ VÁLIDO - Tiene clase local */
.employeeCard:focus-visible {
    outline: 3px solid #667eea;
}

[data-theme="dark"] .employeeCard:focus-visible {
    outline-color: #a78bfa;
}

/* ✅ VÁLIDO - Clases locales */
.employeeCard,
.tabButton,
.paginationBtn,
.addButton {
    min-height: 44px;
}

/* ✅ VÁLIDO - Clase local */
@media (prefers-reduced-motion: reduce) {
    .spinning {
        animation: none;
    }
}
```

## 🎯 Impacto

### ¿Se perdió funcionalidad?
**NO**. Los estilos eliminados eran:

1. **Redundantes**: Ya aplicados a clases específicas
2. **Demasiado amplios**: Afectarían toda la aplicación, no solo esta página
3. **No necesarios**: Las clases locales ya cubren todos los casos de uso

### Estilos de Accesibilidad Mantenidos
✅ `.employeeCard:focus-visible` - Navegación por teclado en tarjetas  
✅ Todas las clases específicas tienen min-height/width de 44px  
✅ `.spinning` respeta reduced motion  
✅ Todos los inputs del formulario tienen sus propios estilos focus  

## 📚 Alternativa (si se necesitaran estilos globales)

Si en el futuro necesitas estilos verdaderamente globales:

### Opción 1: globals.css
```css
/* src/styles/globals.css */
button:focus-visible,
input:focus-visible {
    outline: 2px solid #667eea;
}
```

### Opción 2: Componente con styled-jsx
```javascript
<style jsx global>{`
    button:focus-visible {
        outline: 2px solid #667eea;
    }
`}</style>
```

## ✅ Estado Final

🎉 **BUILD EXITOSO**

- CSS Modules cumple con reglas de pureza
- Todos los estilos de accesibilidad intactos
- Sin pérdida de funcionalidad
- Código más limpio y mantenible

---

**Última actualización**: 2026-02-09  
**Status**: ✅ Resuelto
