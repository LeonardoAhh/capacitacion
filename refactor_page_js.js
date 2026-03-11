const fs = require('fs');
const file = './src/app/employees/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Agregar el import de EmployeeDetail
if (!content.includes('import { EmployeeDetail }')) {
    content = content.replace(
        "import Image from 'next/image';", 
        "import Image from 'next/image';\nimport { EmployeeDetail } from './components/EmployeeDetail';"
    );
}

// 2. Insertar `handleInlineUpdate` function para que EmployeeDetail pueda guardar in situ
if (!content.includes('handleInlineUpdate')) {
    const fnCode = `    // ============================================================================
    // INLINE EDITING UPDATE
    // ============================================================================
    const handleInlineUpdate = async (id, payload) => {
        try {
            const res = await updateEmployee(id, payload);
            if (!res.success) {
                showToast(res.error || 'Error al actualizar', 'error');
                return;
            }
            showToast('Actualizado', 'success');
            // Refresh detailed view local object temporarily manually because standard refresh doesn't trigger selectedEmployee UI update instantly without flash
            setSelectedEmployee(prev => ({ ...prev, ...payload }));
            refresh();
        } catch (e) {
            showToast('Error al actualizar', 'error');
        }
    };
`;
    // Add before handleBackToList
    content = content.replace("    const handleBackToList = () => {", fnCode + "\n    const handleBackToList = () => {");
}

// 3. Reemplazar la vista DETAIL VIEW completa dentro de page.js con el nuevo componente
const detailViewRegex = /\/\* DETAIL VIEW \*\/[\s\S]*?(?=\/\* Drawer para Crear\/Editar Empleado \*\/)/;
const newDetailViewCode = `/* DETAIL VIEW */
                        <EmployeeDetail
                            employee={selectedEmployee}
                            onBack={handleBackToList}
                            onUpdate={handleInlineUpdate}
                            onDelete={handleDeleteEmployee}
                            onImageError={handleImageError}
                            isDeleting={isDeleting}
                        />
                    )}
                </div>
            </div>

            `;
content = content.replace(detailViewRegex, newDetailViewCode);

// 4. Modificar el drawerMode a default 'add', remover 'edit' y remover openEditDrawer
content = content.replace(/drawerMode/g, "'add'");
// Removed openEditDrawer implementation entirely:
content = content.replace(/const openEditDrawer = \([\s\S]*?};/m, "");

fs.writeFileSync(file, content, 'utf8');
console.log('page.js successfully restructured to use new EmployeeDetail with Inline Editing');
