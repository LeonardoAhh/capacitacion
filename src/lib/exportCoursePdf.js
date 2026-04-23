/**
 * exportCoursePdf — Generate a styled PDF from course slide data.
 *
 * Uses jsPDF (already installed) to create a multi-page document
 * with headings, body text, bullets, images, steps, comparisons,
 * and icon grids. Interactive slides (quiz, video, sim) get a
 * placeholder page.
 *
 * @param {Object}  course   { title, description }
 * @param {Array}   slides   [{ type, data }]
 * @param {Object}  opts     { dark?: boolean }
 * @returns {Promise<void>}  triggers browser download
 */
import jsPDF from 'jspdf';

/* ── Constants ── */
const PAGE_W = 297;         // A4 landscape width (mm)
const PAGE_H = 210;         // A4 landscape height (mm)
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CONTENT_H = PAGE_H - MARGIN * 2;

/* ── Color palette (light theme for PDF) ── */
const C = {
    bg: '#FFFFFF',
    text: '#1a1a1a',
    muted: '#6b7280',
    accent: '#f54e00',
    accentLight: '#fff3ed',
    border: '#e5e5e5',
    cardBg: '#f9fafb',
};

/* ── Helpers ── */

/**
 * Sanitize text for jsPDF (Helvetica = WinAnsiEncoding only).
 * Strips emoji and non-Latin1 chars, keeps Spanish characters.
 */
function sanitize(text) {
    if (!text) return '';
    return text
        // Remove emoji and symbols outside Latin-1
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
        .replace(/[\u{200D}\u{20E3}\u{FE0F}]/gu, '')
        // Replace common unicode with ASCII equivalents
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\u2014/g, ' - ')
        .replace(/\u2013/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/\u2022/g, '-')
        .replace(/\u25CF/g, '-')
        .replace(/\u2192/g, '>')
        .replace(/\u2713/g, 'Si')
        .replace(/\u2717/g, 'No')
        // Strip any remaining non-Latin1 characters
        .replace(/[^\x20-\x7E\xA0-\xFF\n\t]/g, '')
        .trim();
}

/** Fetch image URL -> base64 data URI */
async function imgToBase64(url) {
    try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/** Strip HTML tags for plain-text extraction */
function stripHtml(html) {
    if (!html) return '';
    return sanitize(html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim());
}

/** Wrap text and return lines array */
function wrapText(doc, text, maxWidth) {
    if (!text) return [];
    return doc.splitTextToSize(text, maxWidth);
}

/** Draw page background and decoration */
function drawPageBg(doc, slideNum) {
    // Subtle warm background
    doc.setFillColor('#faf9f7');
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
    // Top accent line
    doc.setFillColor(C.accent);
    doc.rect(0, 0, PAGE_W, 1.5, 'F');
    // Left accent bar
    doc.setFillColor(C.accent);
    doc.rect(0, 0, 3, PAGE_H, 'F');
    // Slide number circle top-left
    if (slideNum > 0) {
        doc.setFillColor(C.accent);
        doc.circle(14, 12, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor('#FFFFFF');
        doc.text(String(slideNum), 14, 13, { align: 'center' });
    }
}

/** Add page number footer */
function addFooter(doc, pageNum, totalPages, courseTitle) {
    // Footer line
    doc.setDrawColor(C.border);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(C.muted);
    doc.text(sanitize(courseTitle), MARGIN, PAGE_H - 8);
    doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
}

/* ── Slide type badge labels ── */
const BADGE = {
    title: 'Portada', objective: 'Objetivo', definition: 'Definición',
    content: 'Contenido', icon_grid: 'Conceptos', benefits: 'Beneficios',
    comparison: 'Comparación', steps: 'Proceso', quiz: 'Evaluación',
    group_quiz: 'Evaluación', video: 'Video', flashcard: 'Tarjetas',
    fill_blank: 'Completar', checklist: 'Checklist', dynamic: 'Dinámica',
    group_dynamic: 'Dinámica', freeform: 'Lienzo Libre',
    thermal_sim: 'Simulación', env_sim: 'Simulación',
    iceberg_sim: 'Simulación', radar_sim: 'Simulación',
};

/* ══════════════════════════════════════════════════════
   Slide renderers
   ══════════════════════════════════════════════════════ */

async function renderTitle(doc, data, courseTitle) {
    const title = sanitize(data.heading || courseTitle || 'Sin titulo');
    const subtitle = data.subtitle || data.body || '';

    // Big accent block
    doc.setFillColor(C.accent);
    doc.rect(0, 0, PAGE_W, 70, 'F');
    // Title on accent
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor('#FFFFFF');
    const titleLines = wrapText(doc, title, CONTENT_W - 20);
    doc.text(titleLines, PAGE_W / 2, 35, { align: 'center' });

    // Subtitle below
    if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(C.muted);
        const subLines = wrapText(doc, stripHtml(subtitle), CONTENT_W * 0.7);
        doc.text(subLines, PAGE_W / 2, 90, { align: 'center' });
    }

    // Course title at bottom
    doc.setFontSize(9);
    doc.setTextColor(C.muted);
    doc.text(sanitize(courseTitle), PAGE_W / 2, PAGE_H - 20, { align: 'center' });
}

async function renderContentSlide(doc, data, y) {
    const heading = data.heading || data.title || '';
    const body = stripHtml(data.body || '');
    const bullets = Array.isArray(data.bullets) ? data.bullets : [];
    const gallery = Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : data.image ? [data.image] : [];

    // Two-column layout if images exist
    const hasImages = gallery.length > 0;
    const textW = hasImages ? CONTENT_W * 0.55 : CONTENT_W;
    const imgColX = MARGIN + textW + 8;
    const imgColW = hasImages ? CONTENT_W - textW - 8 : 0;

    // Heading
    if (heading) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(C.text);
        const hLines = wrapText(doc, sanitize(heading), textW);
        doc.text(hLines, MARGIN, y);
        y += hLines.length * 8 + 4;
        // Underline
        doc.setDrawColor(C.accent);
        doc.setLineWidth(0.8);
        doc.line(MARGIN, y - 2, MARGIN + 40, y - 2);
        y += 4;
    }

    // Body
    if (body) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(C.text);
        const bLines = wrapText(doc, body, textW);
        doc.text(bLines, MARGIN, y);
        y += bLines.length * 4.5 + 4;
    }

    // Bullets
    if (bullets.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        for (const item of bullets) {
            const text = typeof item === 'string' ? item : (item.text || item.title || '');
            if (!text) continue;
            doc.setFillColor(C.accent);
            doc.circle(MARGIN + 4, y - 1.2, 1.5, 'F');
            doc.setTextColor(C.text);
            const bLines = wrapText(doc, sanitize(text), textW - 10);
            doc.text(bLines, MARGIN + 8, y);
            y += bLines.length * 4.5 + 2;

            // Bullet note/desc
            const note = typeof item === 'object' ? (item.note || item.desc || '') : '';
            if (note) {
                doc.setFontSize(9);
                doc.setTextColor(C.muted);
                const nLines = wrapText(doc, note, textW - 10);
                doc.text(nLines, MARGIN + 8, y);
                y += nLines.length * 4 + 1;
                doc.setFontSize(10);
            }
        }
    }

    // Snippet/callout
    if (data.snippet?.text) {
        y += 4;
        doc.setFillColor(C.accentLight);
        const snippetText = stripHtml(data.snippet.text);
        const sLines = wrapText(doc, snippetText, textW - 16);
        const snippetH = sLines.length * 4.5 + 10;
        doc.roundedRect(MARGIN, y - 4, textW, snippetH, 3, 3, 'F');
        if (data.snippet.title) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(C.accent);
            doc.text(data.snippet.title, MARGIN + 6, y + 1);
            y += 5;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(C.text);
        doc.text(sLines, MARGIN + 6, y + 1);
        y += snippetH;
    }

    // Images (right column)
    if (hasImages) {
        let imgY = MARGIN + 16;
        const maxImgH = (CONTENT_H - 16) / Math.min(gallery.length, 3);
        for (const url of gallery.slice(0, 6)) {
            const b64 = await imgToBase64(url);
            if (b64) {
                try {
                    const imgH = Math.min(maxImgH - 4, 55);
                    doc.addImage(b64, 'JPEG', imgColX, imgY, imgColW, imgH, undefined, 'MEDIUM');
                    imgY += imgH + 4;
                } catch { /* skip broken images */ }
            }
        }
    }

    return y;
}

async function renderObjective(doc, data, y) {
    const heading = data.heading || data.title || 'Objetivo';
    const body = stripHtml(data.body || data.objective || '');
    const items = Array.isArray(data.items) ? data.items : [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(C.text);
    doc.text(heading, MARGIN, y);
    y += 10;

    if (body) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(C.text);
        const lines = wrapText(doc, body, CONTENT_W);
        doc.text(lines, MARGIN, y);
        y += lines.length * 5 + 6;
    }

    for (const item of items) {
        const text = typeof item === 'string' ? item : (item.text || item.title || '');
        if (!text) continue;
        doc.setTextColor(C.accent);
        doc.setFont('helvetica', 'bold');
        doc.text('→', MARGIN + 2, y);
        doc.setTextColor(C.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = wrapText(doc, text, CONTENT_W - 12);
        doc.text(lines, MARGIN + 10, y);
        y += lines.length * 4.5 + 3;
    }
    return y;
}

async function renderDefinition(doc, data, y) {
    const term = data.heading || data.term || data.title || '';
    const definition = stripHtml(data.body || data.definition || '');

    if (term) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(C.accent);
        doc.text(term, MARGIN, y);
        y += 12;
    }

    if (definition) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(C.text);
        const lines = wrapText(doc, definition, CONTENT_W);
        doc.text(lines, MARGIN, y);
        y += lines.length * 5 + 4;
    }
    return y;
}

async function renderSteps(doc, data, y) {
    const heading = data.heading || data.title || 'Proceso';
    const steps = Array.isArray(data.steps) ? data.steps : [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(C.text);
    doc.text(heading, MARGIN, y);
    y += 10;

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const title = step.title || `Paso ${i + 1}`;
        const desc = stripHtml(step.desc || step.description || '');

        // Step number circle
        doc.setFillColor(C.accent);
        doc.circle(MARGIN + 5, y - 1.5, 4, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor('#FFFFFF');
        doc.text(String(i + 1), MARGIN + 5, y, { align: 'center' });

        // Step title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(C.text);
        doc.text(title, MARGIN + 14, y);
        y += 6;

        // Step description
        if (desc) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(C.muted);
            const lines = wrapText(doc, desc, CONTENT_W - 14);
            doc.text(lines, MARGIN + 14, y);
            y += lines.length * 4 + 2;
        }

        // Step image
        if (step.image) {
            const b64 = await imgToBase64(step.image);
            if (b64) {
                try {
                    doc.addImage(b64, 'JPEG', MARGIN + 14, y, 80, 40, undefined, 'MEDIUM');
                    y += 44;
                } catch { /* skip */ }
            }
        }

        y += 4;

        // Page break if needed
        if (y > CONTENT_H + MARGIN - 20 && i < steps.length - 1) {
            doc.addPage();
            y = MARGIN + 10;
        }
    }
    return y;
}

async function renderComparison(doc, data, y) {
    const heading = data.heading || data.title || 'Comparación';
    const leftTitle = data.leftTitle || data.goodTitle || '✓';
    const rightTitle = data.rightTitle || data.badTitle || '✗';
    const leftItems = Array.isArray(data.leftItems || data.good) ? (data.leftItems || data.good) : [];
    const rightItems = Array.isArray(data.rightItems || data.bad) ? (data.rightItems || data.bad) : [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(C.text);
    doc.text(heading, MARGIN, y);
    y += 12;

    const colW = (CONTENT_W - 8) / 2;

    // Left column header
    doc.setFillColor('#ecfdf5');
    doc.roundedRect(MARGIN, y - 4, colW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#16a34a');
    doc.text(leftTitle, MARGIN + 4, y + 2);

    // Right column header
    doc.setFillColor('#fef2f2');
    doc.roundedRect(MARGIN + colW + 8, y - 4, colW, 10, 2, 2, 'F');
    doc.setTextColor('#dc2626');
    doc.text(rightTitle, MARGIN + colW + 12, y + 2);
    y += 14;

    const maxLen = Math.max(leftItems.length, rightItems.length);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    for (let i = 0; i < maxLen; i++) {
        const leftText = typeof leftItems[i] === 'string' ? leftItems[i] : (leftItems[i]?.text || '');
        const rightText = typeof rightItems[i] === 'string' ? rightItems[i] : (rightItems[i]?.text || '');

        if (leftText) {
            doc.setTextColor(C.text);
            const lines = wrapText(doc, `• ${leftText}`, colW - 6);
            doc.text(lines, MARGIN + 4, y);
        }
        if (rightText) {
            doc.setTextColor(C.text);
            const lines = wrapText(doc, `• ${rightText}`, colW - 6);
            doc.text(lines, MARGIN + colW + 12, y);
        }
        y += 6;
    }
    return y;
}

async function renderIconGrid(doc, data, y) {
    const heading = data.heading || data.title || '';
    const body = stripHtml(data.body || '');
    const items = Array.isArray(data.items) ? data.items : [];

    if (heading) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(C.text);
        doc.text(sanitize(heading), MARGIN, y);
        y += 4;
        doc.setDrawColor(C.accent);
        doc.setLineWidth(0.8);
        doc.line(MARGIN, y, MARGIN + 40, y);
        y += 6;
    }

    if (body) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(C.muted);
        const bLines = wrapText(doc, body, CONTENT_W);
        doc.text(bLines, MARGIN, y);
        y += bLines.length * 4 + 6;
    }

    const cols = Math.min(items.length, 3);
    const gap = 6;
    const cardW = (CONTENT_W - (cols - 1) * gap) / cols;
    const cardH = 32;

    for (let i = 0; i < items.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = MARGIN + col * (cardW + gap);
        const cardY = y + row * (cardH + gap);

        // Card with border
        doc.setFillColor('#FFFFFF');
        doc.setDrawColor(C.border);
        doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'FD');
        // Accent top bar on card
        doc.setFillColor(C.accent);
        doc.rect(x, cardY, cardW, 1.5, 'F');

        // Extract title from all possible field names
        const item = items[i];
        const title = sanitize(item.title || item.name || item.label || '');
        const desc = sanitize(item.desc || item.description || item.subtitle || item.note || '');

        // Title centered in card
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(C.text);
        if (title) {
            doc.text(title, x + cardW / 2, cardY + (desc ? 12 : 18), { align: 'center' });
        }

        // Description below title
        if (desc) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(C.muted);
            const lines = wrapText(doc, desc, cardW - 8);
            doc.text(lines.slice(0, 2), x + cardW / 2, cardY + 20, { align: 'center' });
        }
    }

    y += Math.ceil(items.length / cols) * (cardH + gap) + 4;
    return y;
}

async function renderBenefits(doc, data, y) {
    return renderObjective(doc, data, y); // Same layout
}

async function renderChecklist(doc, data, y) {
    const heading = data.heading || data.title || 'Checklist';
    const items = Array.isArray(data.items) ? data.items : [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(C.text);
    doc.text(heading, MARGIN, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const item of items) {
        const text = typeof item === 'string' ? item : (item.text || item.title || '');
        if (!text) continue;
        // Checkbox
        doc.setDrawColor(C.border);
        doc.rect(MARGIN + 2, y - 3, 4, 4);
        doc.setTextColor(C.text);
        const lines = wrapText(doc, text, CONTENT_W - 12);
        doc.text(lines, MARGIN + 10, y);
        y += lines.length * 4.5 + 3;
    }
    return y;
}

async function renderFlashcard(doc, data, y) {
    const heading = data.heading || data.title || 'Tarjetas';
    const cards = Array.isArray(data.cards) ? data.cards : [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(C.text);
    doc.text(heading, MARGIN, y);
    y += 10;

    for (const card of cards) {
        const front = typeof card === 'string' ? card : (card.front || card.question || card.title || '');
        const back = typeof card === 'object' ? (card.back || card.answer || card.desc || '') : '';

        doc.setFillColor(C.cardBg);
        const cardH = 18;
        doc.roundedRect(MARGIN, y - 3, CONTENT_W, cardH, 2, 2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(C.text);
        doc.text(stripHtml(front), MARGIN + 6, y + 2);

        if (back) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(C.muted);
            const lines = wrapText(doc, stripHtml(back), CONTENT_W - 12);
            doc.text(lines.slice(0, 2), MARGIN + 6, y + 8);
        }
        y += cardH + 3;
    }
    return y;
}

/** Placeholder for interactive slides */
function renderInteractivePlaceholder(doc, type, data, y) {
    const label = BADGE[type] || type;
    const heading = data.heading || data.title || data.question || label;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(C.text);
    doc.text(heading, MARGIN, y);
    y += 10;

    doc.setFillColor(C.cardBg);
    doc.roundedRect(MARGIN, y - 3, CONTENT_W, 20, 3, 3, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(C.muted);
    doc.text(`[ ${label} — Contenido interactivo disponible en la plataforma ]`, MARGIN + 8, y + 6);
    y += 28;
    return y;
}

/* ══════════════════════════════════════════════════════
   Main export function
   ══════════════════════════════════════════════════════ */

export async function exportCoursePdf(course, slides, opts = {}) {
    const { onProgress } = opts;
    const courseTitle = course?.title || 'Curso';

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    const totalSlides = slides.length;

    for (let i = 0; i < totalSlides; i++) {
        if (i > 0) doc.addPage();
        if (onProgress) onProgress(i + 1, totalSlides);

        const slide = slides[i];
        const { type, data = {} } = slide;

        // Page background + decoration
        drawPageBg(doc, type === 'title' ? 0 : i + 1);

        // Badge label at top-right
        const badge = BADGE[type] || type;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(C.muted);
        if (type !== 'title') {
            doc.setFillColor(C.accentLight);
            const badgeText = sanitize(badge.toUpperCase());
            const bw = doc.getTextWidth(badgeText) + 6;
            doc.roundedRect(PAGE_W - MARGIN - bw, MARGIN - 2, bw + 2, 7, 2, 2, 'F');
            doc.setTextColor(C.accent);
            doc.text(badgeText, PAGE_W - MARGIN, MARGIN + 2, { align: 'right' });
        }

        let y = MARGIN + 16;

        switch (type) {
            case 'title':
                await renderTitle(doc, data, courseTitle);
                break;
            case 'objective':
                await renderObjective(doc, data, y);
                break;
            case 'definition':
                await renderDefinition(doc, data, y);
                break;
            case 'content':
                await renderContentSlide(doc, data, y);
                break;
            case 'icon_grid':
                await renderIconGrid(doc, data, y);
                break;
            case 'benefits':
                await renderBenefits(doc, data, y);
                break;
            case 'comparison':
                await renderComparison(doc, data, y);
                break;
            case 'steps':
                await renderSteps(doc, data, y);
                break;
            case 'checklist':
                await renderChecklist(doc, data, y);
                break;
            case 'flashcard':
                await renderFlashcard(doc, data, y);
                break;
            case 'quiz':
            case 'group_quiz':
            case 'fill_blank':
            case 'video':
            case 'dynamic':
            case 'group_dynamic':
            case 'thermal_sim':
            case 'env_sim':
            case 'iceberg_sim':
            case 'radar_sim':
                renderInteractivePlaceholder(doc, type, data, y);
                break;
            case 'freeform':
                renderInteractivePlaceholder(doc, type, data, y);
                break;
            default:
                renderInteractivePlaceholder(doc, type, data, y);
        }
    }

    // Add page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        addFooter(doc, p, totalPages, courseTitle);
    }

    // Generate filename and download
    const safeName = courseTitle.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '').trim().replace(/\s+/g, '_');
    doc.save(`${safeName || 'curso'}.pdf`);
}
