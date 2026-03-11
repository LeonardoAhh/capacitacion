const fs = require('fs');
const file = './src/app/employees/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Drawer imports
content = content.replace(/import\s*\{\s*Drawer,\s*DrawerContent,\s*DrawerHeader,\s*DrawerTitle,\s*DrawerFooter,\s*DrawerClose\s*\}\s*from\s*'@\/components\/ui\/Drawer\/Drawer';/, '');

// 2. Remove states
content = content.replace(/\s*\/\/ Drawer states\s*const \[isDrawerOpen, setIsDrawerOpen\] = useState\(false\);\s*const \[drawerMode, setDrawerMode\] = useState\('create'\);\s*const \[formData, setFormData\] = useState\(getEmptyFormData\(\)\);\s*const \[isSaving, setIsSaving\] = useState\(false\);\s*const \[photoFile, setPhotoFile\] = useState\(null\);\s*const \[photoPreview, setPhotoPreview\] = useState\(null\);\s*const \[uploadProgress, setUploadProgress\] = useState\(0\);/, '');

// 3. Remove Validation State
content = content.replace(/\s*\/\/ Form validation\s*const { errors: formErrors, validate, clearError, clearAllErrors } = useFormValidation\(\);/, '');

// 4. Remove the Drawer JSX block entirely
const drawerRegex = /\{\/\* DRAWER for Create\/Edit Employee \*\/\}[\s\S]*?<\/Drawer>/;
content = content.replace(drawerRegex, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Cleaned up Drawer, variables, and imports');
