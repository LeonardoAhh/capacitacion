const fs = require('fs');
const file = './src/app/employees/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove openCreateDrawer function if it exists
content = content.replace(/const openCreateDrawer = \([\s\S]*?};\n/m, '');

// 2. We don't have openCreateDrawer anymore. It was probably just setting state. Let's redirect instead.
// Look for where openCreateDrawer is called and replace it with router.push
content = content.replace(/openCreateDrawer/g, "() => router.push('/employees/new')");

// 3. Remove all Drawer code from the bottom of the file
const drawerRegex = /\{\/\* Drawer para Crear\/Editar Empleado \*\/\}.*?<\/Drawer>/s;
content = content.replace(drawerRegex, '');

// 4. Remove states that we don't need
const statesToRemove = [
    /const \[isDrawerOpen.*?;\n/g,
    /const \[drawerMode.*?;\n/g,
    /const \[formData.*?;\n/g,
    /const \[isSaving.*?;\n/g,
    /const \[photoFile.*?;\n/g,
    /const \[photoPreview.*?;\n/g,
    /const \[uploadProgress.*?;\n/g,
    /const \{ errors: formErrors.*?;\n/g
];
statesToRemove.forEach(regex => {
    content = content.replace(regex, '');
});

// Remove unused functions
content = content.replace(/const getEmptyFormData = \(\) => \(\{[\s\S]*?\}\);\n/m, '');
content = content.replace(/const handleInputChange = \([\s\S]*?};\n/m, '');
content = content.replace(/const handlePhotoChange = \([\s\S]*?};\n/m, '');
content = content.replace(/const handleRemovePhoto = \([\s\S]*?};\n/m, '');
content = content.replace(/const handleSave = async \([\s\S]*?};\n/m, '');

fs.writeFileSync(file, content, 'utf8');
console.log('page.js purged of Drawer logic and linked to /employees/new successfully!');
