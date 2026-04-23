'use client';

import React, { useState, useCallback, useRef, useMemo, memo } from 'react';
import Image from 'next/image';
import { ICON_CATALOG } from '@/components/features/Courses/Editor/IconPicker';
import ThermalSimSlide from '@/components/features/Courses/slides/ThermalSimSlide';
import EnvSimSlide from '@/components/features/Courses/slides/EnvSimSlide';
import IcebergLineaSimSlide from '@/components/features/Courses/slides/IcebergLineaSimSlide';
import RadarSupervisorSimSlide from '@/components/features/Courses/slides/RadarSupervisorSimSlide';
import FreeformSlide from '@/components/features/Courses/slides/FreeformSlide';
import s from './slides-v2.module.css';

/* Build a lookup map: icon name → React component */
const ICON_MAP = Object.fromEntries(ICON_CATALOG.map(({ name, Icon }) => [name, Icon]));

/**
 * Detect if image URL is from the Drive proxy (/api/drive-image?id=...).
 * Drive images go through our own caching proxy — skip Next.js Image optimization
 * to avoid double-proxy overhead. Firebase Storage URLs use Next.js optimization.
 */
const isDriveUrl = (url) => typeof url === 'string' && url.includes('/api/drive-image');

/**
 * Append size hint to Drive proxy URL for right-sized images.
 * Avoids downloading full-res when a smaller version suffices.
 */
function optimizeSrc(url, width = 800) {
    if (!isDriveUrl(url)) return url;
    const sep = url.includes('?') ? '&' : '?';
    // Only append sz if not already present
    if (url.includes('sz=')) return url;
    return `${url}${sep}sz=w${width}`;
}

/* ═══════════════════════════════════════════════════
   SlideRendererV2 — Unified slide renderer
   No cards · No emojis · 2-column where useful · Responsive
   ═══════════════════════════════════════════════════ */

/* ── Helpers ──────────────────────────────────────── */

/**
 * Sanitiza colores legacy guardados en HTML que rompen contraste en tema oscuro.
 * - Negros casi-puros (#000, #111827, #1f2937…) y blancos puros (#fff, #ffffff)
 *   se eliminan para que herede `--ds-text` del tema activo.
 * - Resto de colores (acentos del design system) se respetan.
 */
function sanitizeLegacyColors(html) {
  if (!html || typeof html !== 'string') return html;
  // Lista de hex problemáticos que el editor antiguo guardaba como "Negro"/"Blanco"
  const NEUTRALS = /#(?:000(?:000)?|111827|1f2937|374151|4b5563|fff(?:fff)?|f9fafb|f3f4f6)\b/i;
  return html
    // Atributo legacy <font color="#xxx">
    .replace(/\s+color="(#[0-9a-f]{3,8})"/gi, (m, hex) =>
      NEUTRALS.test(hex) ? '' : m
    )
    // style="color:#xxx" inline
    .replace(/color\s*:\s*(#[0-9a-f]{3,8})\s*;?/gi, (m, hex) =>
      NEUTRALS.test(hex) ? '' : m
    );
}

function renderBody(body) {
  if (!body) return null;
  // Detecta tags HTML O entidades (&gt; &amp; &nbsp; &#39; etc).
  // El RichTextEditor emite innerHTML donde `>` se serializa como `&gt;`,
  // por lo que el body puede no tener tags pero sí entidades — debe parsearse igual.
  const hasMarkup = /<[a-z][\s\S]*?>|&(?:[a-z]+|#\d+);/i.test(body);
  if (hasMarkup) {
    // Si carece de tags de bloque, envolver en <p> para preservar layout
    const hasBlock = /<(?:p|div|ul|ol|li|h\d|br|blockquote|pre)\b/i.test(body);
    const cleaned = sanitizeLegacyColors(body);
    const html = hasBlock ? cleaned : `<p>${cleaned}</p>`;
    return <div className={s.body} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <div className={s.body}>{body.split('\n').map((p, i) => <p key={i}>{p}</p>)}</div>;
}

function normalizeList(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, i) => {
    if (typeof item === 'string') return { id: `i-${i}`, text: item.trim() };
    return { id: item.id || `i-${i}`, text: (item.text || item.title || '').trim(), note: (item.note || item.desc || '').trim() };
  }).filter(it => it.text);
}

/* ── Font size class map ──────────────────────────── */
const FS_CLASS = { sm: s.fsSm, lg: s.fsLg, xl: s.fsXl };

/* ── Main renderer ────────────────────────────────── */
const SlideRendererV2 = memo(function SlideRendererV2({ slide, courseTitle, onQuizSubmit, onCheckChange, commitmentValue, onCommitmentChange }) {
  if (!slide) return null;

  const { type, data = {} } = slide;
  const fsCls = FS_CLASS[data.fontSize] || '';

  let content;
  switch (type) {
    case 'title':       content = <TitleV2 data={data} courseTitle={courseTitle} />; break;
    case 'objective':   content = <ObjectiveV2 data={data} />; break;
    case 'definition':  content = <DefinitionV2 data={data} />; break;
    case 'content':     content = <ContentV2 data={data} />; break;
    case 'icon_grid':   content = <IconGridV2 data={data} />; break;
    case 'benefits':    content = <BenefitsV2 data={data} />; break;
    case 'comparison':  content = <ComparisonV2 data={data} />; break;
    case 'steps':       content = <StepsV2 data={data} />; break;
    case 'quiz':
    case 'group_quiz':  content = <QuizV2 data={data} type={type} onQuizSubmit={onQuizSubmit} />; break;
    case 'video':       content = <VideoV2 data={data} />; break;
    case 'flashcard':   content = <FlashcardV2 data={data} />; break;
    case 'fill_blank':  content = <FillBlankV2 data={data} onQuizSubmit={onQuizSubmit} />; break;
    case 'checklist':   content = <ChecklistV2 data={data} onCheckChange={onCheckChange} />; break;
    case 'dynamic':
    case 'group_dynamic': content = <DynamicV2 data={data} commitmentValue={commitmentValue} onCommitmentChange={onCommitmentChange} />; break;
    case 'thermal_sim':  content = <ThermalSimSlide data={data} />; break;
    case 'env_sim':      content = <EnvSimSlide data={data} />; break;
    case 'iceberg_sim':  content = <IcebergLineaSimSlide data={data} />; break;
    case 'radar_sim':    content = <RadarSupervisorSimSlide data={data} />; break;
    case 'freeform':
      return (
        <div className={s.freeformWrapper}>
          <FreeformSlide data={data} />
        </div>
      );
    default:
      content = (
        <article className={s.slide}>
          <div className={s.inner}>
            <span className={s.label}>Tipo no soportado: {type}</span>
            <pre className={s.pre}>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </article>
      );
  }

  return fsCls ? <div className={fsCls}>{content}</div> : content;
});

export default SlideRendererV2;

/* ═══════════════════════════════════════════════════
   INDIVIDUAL SLIDE TYPES
   ═══════════════════════════════════════════════════ */

/* ── 1. TITLE ─────────────────────────────────────── */
function TitleV2({ data }) {
  return (
    <article className={`${s.slide} ${s.titleSlide}`} role="region" aria-label={data.title}>
      <div className={s.titleContent}>
        <span className={s.label}>Capacitación</span>
        <h1 className={s.titleH1}>{data.title}</h1>
        {data.subtitle && <p className={s.subtitle}>{data.subtitle}</p>}
        {data.tags?.length > 0 && (
          <div className={s.tagRow}>
            {data.tags.map((tag, i) => <span key={i} className={s.tag}>{tag}</span>)}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── 2. OBJECTIVE ─────────────────────────────────── */
function ObjectiveV2({ data }) {
  return (
    <article className={s.slide} role="region" aria-label="Objetivo">
      <div className={s.inner}>
        <span className={s.label}>Objetivo</span>
        <h2 className={s.heading}>{data.heading}</h2>
        {renderBody(data.body)}
        {data.badge && (
          <div className={s.badgeRow}>
            <span className={s.accentBadge}>{data.badge}</span>
            {data.badgeSubtitle && <span className={s.mutedText}>{data.badgeSubtitle}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── 3. DEFINITION ────────────────────────────────── */
function DefinitionV2({ data }) {
  return (
    <article className={s.slide} role="region" aria-label={data.heading}>
      <div className={s.inner}>
        <span className={s.label}>Definición</span>
        <h2 className={s.heading}>{data.heading}</h2>
        {renderBody(data.body)}
        {data.highlights?.length > 0 && (
          <div className={s.highlightRow}>
            {data.highlights.map((h, i) => <span key={i} className={s.highlight}>{h}</span>)}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── 4. CONTENT ───────────────────────────────────── */
function ContentV2({ data }) {
  const { heading, body, bullets, image, images, tag, snippet } = data;
  const gallery = Array.isArray(images) && images.length > 0 ? images : image ? [image] : [];
  const hasImages = gallery.length > 0;
  const [lightbox, setLightbox] = useState(null);

  return (
    <article className={`${s.slide} ${hasImages ? s.twoCol : ''}`} role="region" aria-label={heading}>
      <div className={s.inner}>
        {tag && <span className={s.label}>{tag}</span>}
        <h2 className={s.heading}>{heading}</h2>
        {renderBody(body)}
        {bullets?.length > 0 && (
          <ul className={s.bulletList}>
            {bullets.map((b, i) => <li key={i}><span className={s.bulletDot} />{b}</li>)}
          </ul>
        )}
        {snippet && (
          <div className={`${s.snippet} ${s[`snippet--${snippet.type}`] || ''}`}>
            {snippet.title && <strong>{snippet.title}</strong>}
            <p>{snippet.text}</p>
          </div>
        )}
      </div>
      {hasImages && (
        <div className={s.mediaCol}>
          {gallery.length > 1 ? (
            <div className={s.galleryGrid} data-count={gallery.length}>
              {gallery.map((url, idx) => (
                <Image key={idx} src={optimizeSrc(url, 600)} alt={`${heading || 'Imagen'} ${idx + 1}`} className={s.galleryImg} width={700} height={525} sizes="(max-width: 640px) 50vw, 33vw" style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized={isDriveUrl(url)} onClick={() => setLightbox(url)} />
              ))}
            </div>
          ) : (
            <Image src={optimizeSrc(gallery[0], 800)} alt={`${heading || 'Imagen'} 1`} className={s.contentImg} width={1400} height={788} sizes="(max-width: 768px) 100vw, 50vw" style={{ width: '100%', height: 'auto', maxHeight: '450px', objectFit: 'contain' }} unoptimized={isDriveUrl(gallery[0])} onClick={() => setLightbox(gallery[0])} />
          )}
        </div>
      )}
      {lightbox && <Lightbox src={lightbox} alt={heading} onClose={() => setLightbox(null)} />}
    </article>
  );
}

/* ── 5. ICON GRID ─────────────────────────────────── */
function IconGridV2({ data }) {
  const { heading, description, items = [] } = data;
  return (
    <article className={s.slide} role="region" aria-label={heading}>
      <div className={s.inner}>
        <span className={s.label}>Conceptos</span>
        <h2 className={s.heading}>{heading}</h2>
        {description && <p className={s.desc}>{description}</p>}
        <div className={s.iconGrid} data-count={Math.min(items.length, 6)}>
          {items.slice(0, 6).map((item, i) => {
            const IconComp = item.image ? null : ICON_MAP[item.icon];
            return (
              <div key={i} className={s.iconCard}>
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.label || ''} className={s.iconCircleImg} />
                ) : IconComp ? (
                  <div className={s.iconCircle}><IconComp size={28} aria-hidden="true" /></div>
                ) : (
                  <div className={s.iconCircle}>{item.label?.charAt(0) || '•'}</div>
                )}
                <h3 className={s.iconLabel}>{item.label}</h3>
                {item.description && <p className={s.iconDesc}>{item.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

/* ── 6. BENEFITS ──────────────────────────────────── */
function BenefitsV2({ data }) {
  return (
    <article className={s.slide} role="region" aria-label={data.heading}>
      <div className={s.inner}>
        <span className={s.label}>Beneficios</span>
        <h2 className={s.heading}>{data.heading}</h2>
        <ul className={s.benefitList}>
          {(data.items || []).map((item, i) => {
            const text = typeof item === 'object' ? item.text : item;
            return (
              <li key={i} className={s.benefitItem}>
                <span className={s.benefitCheck}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                </span>
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

/* ── 7. COMPARISON ────────────────────────────────── */
function ComparisonV2({ data }) {
  const leftTitle = data.left?.title || data.col1Title || '';
  const rightTitle = data.right?.title || data.col2Title || '';
  const leftItems = data.left?.items || data.col1Items || [];
  const rightItems = data.right?.items || data.col2Items || [];

  return (
    <article className={s.slide} role="region" aria-label={data.heading}>
      <div className={s.inner}>
        <h2 className={s.heading}>{data.heading}</h2>
        {data.description && <p className={s.desc}>{data.description}</p>}
        <div className={s.compGrid}>
          <div className={s.compCol}>
            <h3 className={s.compColTitle}>{leftTitle}</h3>
            <ul className={s.compList}>
              {leftItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div className={s.compDivider} />
          <div className={s.compCol}>
            <h3 className={s.compColTitle}>{rightTitle}</h3>
            <ul className={s.compList}>
              {rightItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── 8. STEPS ─────────────────────────────────────── */
function StepsV2({ data }) {
  const { heading, steps = [] } = data;
  return (
    <article className={s.slide} role="region" aria-label={heading}>
      <div className={s.inner}>
        <span className={s.label}>Proceso</span>
        <h2 className={s.heading}>{heading}</h2>
        <ol className={s.stepsList}>
          {steps.map((step, idx) => (
            <li key={idx} className={s.stepItem}>
              <div className={s.stepTrack}>
                <span className={s.stepNum}>{idx + 1}</span>
                {idx < steps.length - 1 && <div className={s.stepLine} />}
              </div>
              <div className={s.stepBody}>
                {step.title && <h3 className={s.stepTitle}>{step.title}</h3>}
                {step.desc && <p className={s.stepDesc}>{step.desc}</p>}
                {step.image && <Image src={optimizeSrc(step.image, 600)} alt={step.title || 'Imagen'} className={s.stepImg} width={800} height={400} sizes="(max-width: 768px) 100vw, 50vw" style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover' }} unoptimized={isDriveUrl(step.image)} />}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

/* ── 9. QUIZ ──────────────────────────────────────── */
function QuizV2({ data, type, onQuizSubmit }) {
  const questions = useMemo(() => {
    if (type === 'group_quiz') {
      const opts = data.options || [];
      const correctIdx = opts.findIndex(o => o.id === data.correctOptionId);
      return [{ q: data.question, options: opts.map(o => o.text), correct: correctIdx >= 0 ? correctIdx : 0, explanation: data.explanation }];
    }
    return data.questions || [];
  }, [data, type]);

  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState([]);

  const current = questions[qIdx];
  const finished = results.length === questions.length;
  const score = finished ? Math.round((results.filter(r => r).length / questions.length) * 100) : null;

  const submit = useCallback(() => {
    if (selected === null) return;
    const correct = selected === current.correct;
    setAnswered(true);
    setResults(prev => [...prev, correct]);
  }, [selected, current]);

  const next = useCallback(() => {
    if (qIdx < questions.length - 1) {
      setQIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
    } else if (onQuizSubmit && score !== null) {
      onQuizSubmit(score);
    }
  }, [qIdx, questions.length, onQuizSubmit, score]);

  if (!current && !finished) return null;

  if (finished) {
    const passed = score >= (data.passingScore || 60);
    return (
      <article className={s.slide} role="region" aria-label="Resultado del quiz">
        <div className={s.inner}>
          <span className={s.label}>Resultado</span>
          <h2 className={s.heading}>{data.heading || 'Evaluación'}</h2>
          <div className={`${s.quizResult} ${passed ? s.quizPassed : s.quizFailed}`}>
            <span className={s.quizScore}>{score}%</span>
            <p>{passed ? 'Aprobado' : 'No aprobado'}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={s.slide} role="region" aria-label={data.heading}>
      <div className={s.inner}>
        <span className={s.label}>Pregunta {qIdx + 1} de {questions.length}</span>
        <h2 className={s.heading}>{data.heading || 'Evaluación'}</h2>
        <p className={s.quizQuestion}>{current.q}</p>
        <div className={s.optionList}>
          {current.options.map((opt, i) => {
            let cls = s.option;
            if (answered && i === current.correct) cls += ` ${s.optionCorrect}`;
            else if (answered && i === selected && i !== current.correct) cls += ` ${s.optionWrong}`;
            else if (!answered && i === selected) cls += ` ${s.optionSelected}`;
            return (
              <button key={i} className={cls} onClick={() => !answered && setSelected(i)} disabled={answered} aria-label={opt}>
                <span className={s.optionLetter}>{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        {answered && current.explanation && <p className={s.explanation}>{current.explanation}</p>}
        {!answered ? (
          <button className={s.primaryBtn} onClick={submit} disabled={selected === null}>Verificar</button>
        ) : (
          <button className={s.primaryBtn} onClick={next}>{qIdx < questions.length - 1 ? 'Siguiente pregunta' : 'Ver resultado'}</button>
        )}
      </div>
    </article>
  );
}

/* ── 10. VIDEO ────────────────────────────────────── */
function VideoV2({ data }) {
  const { heading, videoUrl, caption, autoplay } = data;
  const isYT = videoUrl?.includes('youtube.com/embed');
  const isDirect = /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl || '');
  const ytSrc = isYT ? `${videoUrl}?rel=0&modestbranding=1${autoplay ? '&autoplay=1&mute=1' : ''}` : null;

  return (
    <article className={s.slide} role="region" aria-label={heading || 'Video'}>
      <div className={s.inner}>
        <span className={s.label}>Video</span>
        {heading && <h2 className={s.heading}>{heading}</h2>}
        <div className={s.videoWrap}>
          {ytSrc ? (
            <iframe src={ytSrc} title={heading || 'Video'} className={s.videoIframe} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
          ) : isDirect ? (
            <video className={s.videoNative} controls autoPlay={!!autoplay} muted={!!autoplay} playsInline src={videoUrl} />
          ) : (
            <div className={s.videoPlaceholder}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5,3 19,12 5,21" /></svg>
              <p>{videoUrl ? 'URL de video no reconocida' : 'Sin URL de video'}</p>
            </div>
          )}
        </div>
        {caption && <p className={s.caption}>{caption}</p>}
      </div>
    </article>
  );
}

/* ── 11. FLASHCARD ────────────────────────────────── */
function FlashcardV2({ data }) {
  const { heading, cards = [] } = data;
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[idx];

  const flip = () => setFlipped(f => !f);
  const goNext = () => { setFlipped(false); setIdx(i => Math.min(i + 1, cards.length - 1)); };
  const goPrev = () => { setFlipped(false); setIdx(i => Math.max(i - 1, 0)); };

  if (!card) return null;
  return (
    <article className={s.slide} role="region" aria-label={heading}>
      <div className={s.inner}>
        <span className={s.label}>Tarjeta {idx + 1} de {cards.length}</span>
        {heading && <h2 className={s.heading}>{heading}</h2>}
        <div className={s.flashScene} onClick={flip} role="button" tabIndex={0} aria-label={flipped ? 'Mostrando respuesta' : 'Clic para voltear'} onKeyDown={(e) => e.key === 'Enter' && flip()}>
          <div className={`${s.flashCard} ${flipped ? s.flashFlipped : ''}`}>
            <div className={s.flashFront}><p>{card.front}</p></div>
            <div className={s.flashBack}><p>{card.back}</p></div>
          </div>
        </div>
        <div className={s.flashNav}>
          <button className={s.outlineBtn} onClick={goPrev} disabled={idx === 0}>Anterior</button>
          <button className={s.outlineBtn} onClick={goNext} disabled={idx === cards.length - 1}>Siguiente</button>
        </div>
      </div>
    </article>
  );
}

/* ── 12. FILL BLANK ───────────────────────────────── */
function FillBlankV2({ data, onQuizSubmit }) {
  const { sentence = '', answers = [], explanation = '' } = data;
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef(null);
  const parts = sentence.split('___');

  const handleSubmit = useCallback(() => {
    if (!value.trim()) return;
    const norm = (str) => String(str || '').trim().toLowerCase();
    const correct = answers.some(a => norm(a) === norm(value));
    setSubmitted(true);
    setIsCorrect(correct);
    if (onQuizSubmit) onQuizSubmit(correct ? 100 : 0);
  }, [value, answers, onQuizSubmit]);

  const retry = () => { setValue(''); setSubmitted(false); setIsCorrect(false); setTimeout(() => inputRef.current?.focus(), 50); };

  return (
    <article className={s.slide} role="region" aria-label="Completa la frase">
      <div className={s.inner}>
        <span className={s.label}>Completar</span>
        <div className={s.fillSentence}>
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              <span>{part}</span>
              {i < parts.length - 1 && (
                submitted ? (
                  <span className={`${s.fillAnswer} ${isCorrect ? s.fillCorrect : s.fillWrong}`}>
                    {value}{!isCorrect && answers[0] && <small className={s.fillHint}> → {answers[0]}</small>}
                  </span>
                ) : (
                  <input ref={inputRef} type="text" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} className={s.fillInput} placeholder="..." autoFocus maxLength={100} />
                )
              )}
            </React.Fragment>
          ))}
        </div>
        {!submitted && <button className={s.primaryBtn} onClick={handleSubmit} disabled={!value.trim()}>Verificar</button>}
        {submitted && (
          <div className={`${s.feedbackBox} ${isCorrect ? s.feedbackOk : s.feedbackBad}`}>
            <p>{isCorrect ? 'Correcto' : `Incorrecto. Respuesta: "${answers[0]}"`}</p>
            {explanation && <p className={s.explanationText}>{explanation}</p>}
            {!isCorrect && <button className={s.outlineBtn} onClick={retry}>Reintentar</button>}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── 13. CHECKLIST ────────────────────────────────── */
function ChecklistV2({ data, onCheckChange }) {
  const { heading, items = [], requireAll = false } = data;
  const [checked, setChecked] = useState(() => new Set());
  const allDone = checked.size === items.length && items.length > 0;
  const progress = items.length > 0 ? Math.round((checked.size / items.length) * 100) : 0;

  const toggle = useCallback((id) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (onCheckChange) onCheckChange(next.size === items.length);
      return next;
    });
  }, [items.length, onCheckChange]);

  return (
    <article className={s.slide} role="region" aria-label={heading}>
      <div className={s.inner}>
        <span className={s.label}>Checklist</span>
        <h2 className={s.heading}>{heading}</h2>
        <div className={s.progressTrack}><div className={s.progressFill} style={{ width: `${progress}%` }} /><span className={s.progressLabel}>{checked.size}/{items.length}</span></div>
        <ul className={s.checkList}>
          {items.map(item => {
            const done = checked.has(item.id);
            return (
              <li key={item.id} className={`${s.checkItem} ${done ? s.checkDone : ''}`}>
                <button className={`${s.checkBox} ${done ? s.checkBoxDone : ''}`} onClick={() => toggle(item.id)} role="checkbox" aria-checked={done} aria-label={item.text}>
                  {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>}
                </button>
                <span className={s.checkText}>{item.text}</span>
              </li>
            );
          })}
        </ul>
        {allDone && <p className={s.successMsg}>Lista completa</p>}
        {requireAll && !allDone && <p className={s.hintMsg}>Marca todos los items para continuar</p>}
      </div>
    </article>
  );
}

/* ── 14. DYNAMIC ACTIVITY ─────────────────────────── */
function DynamicV2({ data, commitmentValue = '', onCommitmentChange }) {
  const heading = data.heading || 'Dinámica';
  const materials = normalizeList(data.materials);
  const steps = normalizeList(data.steps);
  const debriefQs = normalizeList(data.debriefQuestions || data.debrief);

  return (
    <article className={s.slide} role="region" aria-label={heading}>
      <div className={s.inner}>
        <span className={s.label}>Dinámica</span>
        <h2 className={s.heading}>{heading}</h2>

        {/* Meta chips */}
        <div className={s.metaRow}>
          {data.modality && <span className={s.chip}>{data.modality}</span>}
          {data.duration && <span className={s.chip}>{data.duration}</span>}
          {(data.participants?.min || data.participants?.max) && (
            <span className={s.chip}>{data.participants.min || 1}–{data.participants.max || data.participants.min || 1} personas</span>
          )}
        </div>

        {data.instructions && <div className={s.infoBlock}><h3>Instrucciones</h3><p>{data.instructions}</p></div>}
        {data.scenario && <div className={s.infoBlock}><h3>Escenario</h3><p>{data.scenario}</p></div>}

        <div className={s.dynamicGrid}>
          {materials.length > 0 && (
            <div className={s.infoBlock}><h3>Materiales</h3><ul>{materials.map(m => <li key={m.id}>{m.text}{m.note && <small> — {m.note}</small>}</li>)}</ul></div>
          )}
          {steps.length > 0 && (
            <div className={s.infoBlock}><h3>Pasos</h3><ol>{steps.map(st => <li key={st.id}>{st.text}{st.note && <small> — {st.note}</small>}</li>)}</ol></div>
          )}
        </div>

        {debriefQs.length > 0 && (
          <div className={s.infoBlock}><h3>Preguntas de cierre</h3><ul>{debriefQs.map(q => <li key={q.id}>{q.text}</li>)}</ul></div>
        )}

        {typeof onCommitmentChange === 'function' && (
          <div className={s.infoBlock}>
            <h3>Compromiso</h3>
            <p>{data.commitmentPrompt || 'Escribe tu compromiso de acción.'}</p>
            <textarea className={s.textarea} value={commitmentValue} onChange={e => onCommitmentChange(e.target.value)} placeholder={data.commitmentPlaceholder || 'Tu compromiso...'} rows={3} maxLength={280} />
          </div>
        )}
      </div>
    </article>
  );
}

/* ── Lightbox (shared) ────────────────────────────── */
function Lightbox({ src, alt, onClose }) {
  return (
    <div className={s.lightbox} onClick={onClose} role="dialog" aria-label="Imagen ampliada">
      <Image src={src} alt={alt || 'Imagen'} className={s.lightboxImg} width={1400} height={1050} sizes="90vw" style={{ width: 'auto', height: 'auto', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} unoptimized onClick={(e) => e.stopPropagation()} />
      <button className={s.lightboxClose} onClick={onClose} aria-label="Cerrar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
}
