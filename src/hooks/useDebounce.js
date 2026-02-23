/**
 * Re-exporta desde utils/debounce.js para mantener compatibilidad de imports.
 * La lógica centralizada vive en @/utils/debounce
 */
export { useDebounce } from '@/utils/debounce';

// Default export para compatibilidad con: import useDebounce from '@/hooks/useDebounce'
export { useDebounce as default } from '@/utils/debounce';
