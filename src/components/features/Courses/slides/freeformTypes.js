/**
 * @fileoverview Tipos JSDoc para FreeformSlide — contrato de datos explícito.
 * Usar en JSDoc con `@type {import('./freeformTypes').SlideElement}`.
 */

/**
 * @typedef {'text' | 'image'} ElementKind
 * @typedef {'contain' | 'cover' | 'fill' | 'none' | 'scale-down'} ObjectFit
 * @typedef {'left' | 'center' | 'right' | 'justify'} TextAlign
 */

/**
 * @typedef {Object} SlideElement
 * @property {string}       id          — Identificador único (requerido para key)
 * @property {ElementKind}  kind        — Tipo de elemento
 * @property {number}       x           — Posición X en % relativo al slide
 * @property {number}       y           — Posición Y en %
 * @property {number}       w           — Ancho en %
 * @property {number}       h           — Alto en %
 * @property {string}       [content]   — Contenido de texto (HTML si isHtml=true)
 * @property {boolean}      [isHtml]    — Indica si content contiene HTML
 * @property {number}       [fontSize]
 * @property {number}       [fontWeight]
 * @property {TextAlign}    [align]
 * @property {string}       [color]
 * @property {string}       [src]       — URL de imagen
 * @property {string}       [alt]       — Texto alternativo para accesibilidad
 * @property {ObjectFit}    [fit]
 * @property {number}       [radius]    — Border radius en px
 */

/**
 * @typedef {Object} SlideData
 * @property {string}        [background] — Color o gradiente de fondo
 * @property {SlideElement[]} [elements]
 */

export {};
