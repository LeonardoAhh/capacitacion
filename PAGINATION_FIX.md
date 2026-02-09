# 🔧 Corrección: Selector de Items por Página

## ❌ Problema Reportado
El selector de "Mostrar X por página" no funcionaba. Al cambiar el valor a 4 u 8, no se recargaban los empleados con el nuevo tamaño de página.

## 🔍 Causa Raíz

El problema tenía dos partes:

### 1. **Hook no reactivo a cambios**
El hook `useEmployees` aceptaba el parámetro `itemsPerPage`, pero **no tenía un efecto que detectara cambios** en ese valor.

```javascript
// ❌ ANTES: itemsPerPage cambiaba pero el hook no se actualizaba
export const useEmployees = (itemsPerPage = 6) => {
    // ... código del hook
    // ❌ Faltaba un useEffect que detectara cambios en itemsPerPage
}
```

### 2. **Llamada manual incorrecta**
En `page.js`, el onChange llamaba a `refresh()`, pero esto **no reseteaba la paginación correctamente**:

```javascript
// ❌ ANTES: refresh() no reseteaba cursores ni página
onChange={(e) => {
    setItemsPerPage(Number(e.target.value));
    refresh(); // ❌ No resetea page, cursors, etc.
}}
```

## ✅ Solución Implementada

### 1. **Agregado useEffect al Hook**

```javascript
// ✅ AHORA: Hook detecta cambios automáticamente
import { useState, useCallback, useRef, useEffect } from 'react';

export const useEmployees = (itemsPerPage = 6) => {
    // ...
    
    // ✅ NUEVO: Reset pagination when itemsPerPage changes
    useEffect(() => {
        // Reset to page 1 and clear cursors
        setPage(1);
        lastVisibleRef.current = null;
        firstVisibleRef.current = null;
        cursorsStackRef.current = [];
        // Reload data with new page size
        loadEmployees('initial');
    }, [itemsPerPage, loadEmployees]);
    
    // ...
}
```

**Qué hace:**
- ✅ Detecta cambios en `itemsPerPage`
- ✅ Resetea la página a 1
- ✅ Limpia todos los cursores de paginación
- ✅ Recarga los datos con el nuevo tamaño

### 2. **Simplificado onChange en page.js**

```javascript
// ✅ AHORA: Solo actualiza el estado, el effect hace el resto
<select
    id="itemsPerPage"
    value={itemsPerPage}
    onChange={(e) => {
        setItemsPerPage(Number(e.target.value));
        // ✅ El useEffect del hook se encarga del resto
    }}
>
```

### 3. **Opciones Actualizadas**

```javascript
// ❌ ANTES: Opciones incorrectas
<option value={4}>4</option>
<option value={8}>8</option>

// ✅ AHORA: Opciones correctas según especificación
<option value={6}>6</option>   {/* Default */}
<option value={12}>12</option>
<option value={24}>24</option>
<option value={50}>50</option>
```

## 🎯 Resultado

### Comportamiento Esperado
1. Usuario cambia selector de "6" a "12"
2. `setItemsPerPage(12)` actualiza el estado
3. Hook detecta cambio vía useEffect
4. Automáticamente:
   - ✅ Resetea a página 1
   - ✅ Limpia cursores de paginación
   - ✅ Recarga empleados con limit(12)
5. UI muestra 12 empleados por página

### Flujo de Datos
```
User selecciona "12"
    ↓
setItemsPerPage(12)
    ↓
itemsPerPage cambia de 6 a 12
    ↓
useEffect detecta cambio
    ↓
setPage(1) + clear cursors
    ↓
loadEmployees('initial')
    ↓
Firestore query con limit(12)
    ↓
UI muestra 12 empleados
```

## 📁 Archivos Modificados

### `useEmployees.js`
- ✅ Agregado `useEffect` al import
- ✅ Agregado useEffect que detecta cambios en `itemsPerPage`
- ✅ Resetea paginación automáticamente

### `page.js`
- ✅ Removido llamada manual a `refresh()`
- ✅ Cambiadas opciones de 4/8 a 6/12/24/50

## ✅ Testing

Prueba esto:
1. Abre `/employees`
2. Verás 6 empleados (default)
3. Cambia selector a "12"
4. Deberías ver hasta 12 empleados
5. Cambia a "24"
6. Deberías ver hasta 24 empleados

**Nota**: Si tienes menos empleados que el límite seleccionado, verás todos los disponibles.

---

**Fecha**: 2026-02-09  
**Status**: ✅ Resuelto  
**Complejidad**: Media  
**Impacto**: Alto (funcionalidad de usuario)
