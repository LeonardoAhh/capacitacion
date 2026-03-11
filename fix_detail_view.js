const fs = require('fs');

// 1. Fix new/page.js
const newPageFile = './src/app/employees/new/page.js';
let newPageContent = fs.readFileSync(newPageFile, 'utf8');

newPageContent = newPageContent.replace(
    'const { formErrors, validateForm, clearErrors } = useFormValidation();',
    'const { errors: formErrors, validate: validateForm, clearError: clearErrors } = useFormValidation();'
);
newPageContent = newPageContent.replace(/formErrors\.name/g, '(formErrors && formErrors.name)');
newPageContent = newPageContent.replace(/formErrors\.employeeId/g, '(formErrors && formErrors.employeeId)');

fs.writeFileSync(newPageFile, newPageContent, 'utf8');
console.log('Fixed new form validation hook variables');


// 2. Fix page.js to render EmployeeDetail
const pageFile = './src/app/employees/page.js';
let pageContent = fs.readFileSync(pageFile, 'utf8');

// The block starts at: /* DETAIL VIEW */
// Ends at: )} \n </div> \n </div>
const detailStart = '/* DETAIL VIEW */';
const detailEnd = `</div>
            </div>`;

// Wait, looking at the exact file contents:
const exactStartCode = `/* DETAIL VIEW */
                        <div className={styles.detailView}>
                            <BackButton onClick={handleBackToList} label="Volver a la lista" />`;

// Let's use string manipulation to find the exact block bounds
const startIndex = pageContent.indexOf('/* DETAIL VIEW */');

// To find the end of the DETAIL VIEW, it ends before:
// {/* Confirmation Dialog */}
const dialogIndex = pageContent.indexOf('{/* Confirmation Dialog */}');

// Backtrack from dialogIndex to find the end of the outer container. 
// Actually we can just locate `</div>` just before `{/* Confirmation Dialog */}` padding.
// The structure in page.js was:
/*
                    ) : (
                        /* DETAIL VIEW *\/
                        ...
                    )}
                </div>
            </div>

            {/* Confirmation Dialog *\/}
*/

if (startIndex !== -1 && dialogIndex !== -1) {
    // We want everything from `/* DETAIL VIEW */` to `)}`
    // Let's find the `)}` that closes the `{!selectedEmployee ? ( ... ) : ( ... )}` ternary
    
    // An easier way: Match from `/* DETAIL VIEW */` to `)}` right before `</div>\n            </div>\n\n            {/* Confirmation Dialog */}`
    const endTernaryIndex = pageContent.lastIndexOf(')}', dialogIndex);
    
    if (endTernaryIndex !== -1 && endTernaryIndex > startIndex) {
        const replacement = `/* DETAIL VIEW */
                        <EmployeeDetail
                            employee={selectedEmployee}
                            onBack={handleBackToList}
                            onUpdate={updateEmployee}
                            onDelete={handleDeleteEmployee}
                            onImageError={handleImageError}
                            isDeleting={isDeleting}
                        />
                    `;
        
        const before = pageContent.substring(0, startIndex);
        const after = pageContent.substring(endTernaryIndex + 2); // skip ")}"
        
        fs.writeFileSync(pageFile, before + replacement + ')}' + after, 'utf8');
        console.log('Successfully replaced old Detail View with EmployeeDetail Component in page.js');
    } else {
        console.log('Could not properly find the end of the ternary.');
    }
} else {
    console.log('Could not find start or end index for detail view.');
}
