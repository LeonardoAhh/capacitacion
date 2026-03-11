const fs = require('fs');
const file = './src/app/employees/page.module.css';
const cssToAdd = `

/* === UNIFIED EMPLOYEE DETAIL REDESIGN === */
.unifiedContent {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
    max-width: 1000px;
    margin: 0 auto;
}

.unifiedSection {
    background: #ffffff;
    padding: 2rem;
}

.sectionHeading {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.sectionIcon {
    color: var(--blue-500);
}

.sectionDivider {
    border: 0;
    height: 1px;
    background: var(--border-color);
    margin: 0;
    width: 100%;
}

.infoItem {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.infoItem label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.infoItem span {
    font-size: 0.95rem;
    color: var(--text-primary);
    font-weight: 500;
}

.coursesSection {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
}

.coursesTitle {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
}

.coursesBadgeContainer {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.courseBadge {
    background: #f1f5f9;
    color: var(--text-tertiary);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-family: var(--font-mono);
    border: 1px solid var(--border-color);
}

.progressItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #fafaf8;
    border-radius: 8px;
    margin-bottom: 8px;
    border: 1px solid var(--border-color);
}

.courseId {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.progressSteps {
    display: flex;
    align-items: center;
    gap: 8px;
}

.stepCompleted {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-success);
    background: rgba(16, 185, 129, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
}

.stepPending {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-tertiary);
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
}

.stepInfo {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--blue-500);
    display: flex;
    align-items: center;
    gap: 4px;
}

.documentsList {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.documentItem {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 1rem;
    background: #fafaf8;
    border: 1px solid var(--border-color);
    border-radius: 8px;
}

.documentItem span {
    flex: 1;
    font-weight: 500;
    color: var(--text-primary);
}

.documentLink {
    color: var(--blue-500);
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
}

.documentLink:hover {
    text-decoration: underline;
}

.emptyState {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    background: #fafaf8;
    border: 1px dashed var(--border-color);
    border-radius: 12px;
    color: var(--text-tertiary);
    gap: 12px;
}

.emptyState p {
    font-size: 0.95rem;
    margin: 0;
}
`;

fs.appendFileSync(file, cssToAdd, 'utf8');
console.log("CSS appended.");
