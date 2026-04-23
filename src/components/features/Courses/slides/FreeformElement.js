'use client';
import React, { useMemo } from 'react';
import DriveImage from '@/components/ui/DriveImage/DriveImage';

// DOMPurify es DOM-only — no funciona en SSR. Se importa dinámico en useEffect
// o se guarda referencia al módulo sólo cuando window existe.
let _DOMPurify = null;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line global-require
  _DOMPurify = require('dompurify');
}

/**
 * Sanitiza HTML usando DOMPurify cuando está disponible (cliente).
 * En SSR devuelve el string sin cambios — Next.js ya no hidrata
 * dangerouslySetInnerHTML desde servidor si el contenido cambia en cliente.
 * @param {string} html
 * @returns {string}
 */
function sanitize(html) {
  if (!_DOMPurify) return html;
  return _DOMPurify.sanitize(html, {
    // Cubre tags que RichTextEditor emite vía document.execCommand:
    //  - <font color="..."> de foreColor (navegadores legacy)
    //  - <span style="color:..."> de foreColor (modernos)
    //  - <b>/<i>/<u>/<strike> de bold/italic/underline/strikeThrough
    //  - <div>/<br> de saltos de línea
    //  - <p> de formato bloque
    ALLOWED_TAGS: [
      'p', 'br', 'div', 'span',
      'b', 'strong', 'i', 'em', 'u', 's', 'strike',
      'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'font',
    ],
    ALLOWED_ATTR: [
      'style', 'class',
      'href', 'target', 'rel',
      'color', 'face', 'size',  // legacy <font>
    ],
  });
}

// ── TextElement ───────────────────────────────────────────────────────────────

/**
 * @param {{ el: import('./freeformTypes').SlideElement, posStyle: React.CSSProperties }} props
 */
const TextElement = React.memo(function TextElement({ el, posStyle }) {
  const html = useMemo(() => {
    const raw = el.content ?? '';

    // isHtml explícito evita regex frágil para detectar markup
    const withHtml = el.isHtml
      ? raw
      : raw
          .split('\n')
          .map(p => `<p style="margin:0 0 0.3em">${p || '&nbsp;'}</p>`)
          .join('');

    return sanitize(withHtml);
  }, [el.content, el.isHtml]);

  const textStyle = useMemo(() => ({
    ...posStyle,
    // overflow: visible — texto puede exceder bounding box del elemento;
    // el canvas padre (.freeformSlide) hace clip visual con overflow:hidden.
    overflow:   'visible',
    fontSize:   `${el.fontSize ?? 16}px`,
    fontWeight: el.fontWeight ?? 400,
    textAlign:  el.align ?? 'left',
    color:      el.color ?? 'inherit',
    fontFamily: 'var(--font-body, sans-serif)',
    lineHeight: 1.4,
    wordBreak:  'break-word',
  }), [posStyle, el.fontSize, el.fontWeight, el.align, el.color]);

  return (
    <div
      style={textStyle}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

// ── ImageElement ──────────────────────────────────────────────────────────────

/**
 * @param {{ el: import('./freeformTypes').SlideElement, posStyle: React.CSSProperties }} props
 */
const ImageElement = React.memo(function ImageElement({ el, posStyle }) {
  const containerStyle = useMemo(() => ({
    ...posStyle,
    overflow:     'hidden',
    borderRadius: `${el.radius ?? 8}px`,
  }), [posStyle, el.radius]);

  const imageStyle = useMemo(() => ({
    width:        '100%',
    height:       '100%',
    objectFit:    el.fit ?? 'contain',
    borderRadius: 'inherit',
    display:      'block',
  }), [el.fit]);

  return (
    <div style={containerStyle}>
      <DriveImage
        src={el.src ?? ''}
        alt={el.alt ?? el.src ?? ''}
        showLabel={false}
        style={imageStyle}
      />
    </div>
  );
});

// ── FreeformElement ───────────────────────────────────────────────────────────

/**
 * Renderiza un elemento individual del lienzo libre.
 * @param {{ el: import('./freeformTypes').SlideElement }} props
 */
const FreeformElement = React.memo(function FreeformElement({ el }) {
  const posStyle = useMemo(() => ({
    position:  'absolute',
    left:      `${el.x}%`,
    top:       `${el.y}%`,
    width:     `${el.w}%`,
    height:    `${el.h}%`,
    boxSizing: 'border-box',
  }), [el.x, el.y, el.w, el.h]);

  if (el.kind === 'text')  return <TextElement  el={el} posStyle={posStyle} />;
  if (el.kind === 'image') return <ImageElement el={el} posStyle={posStyle} />;

  return null;
});

export default FreeformElement;
