const fs = require('fs');

// 1. Fix calendario/page.js
const calendarioFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/capacitacion/calendario/page.js';
let calContent = fs.readFileSync(calendarioFile, 'utf8');
calContent = calContent.replace(/^```javascript\r?\n/, '');
calContent = calContent.replace(/\r?\n```\r?\n?$/, '');
fs.writeFileSync(calendarioFile, calContent, 'utf8');

// 2. Fix analisis/page.js
const analisisFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/capacitacion/analisis/page.js';
let analContent = fs.readFileSync(analisisFile, 'utf8');
analContent = analContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}\s*return \(\s*<>\s*<main className={styles\.main}/, '</AdminLayout>\n        );\n    }\n\n    return (\n        <>\n            <main className={styles.main}');
// Oh wait, analisis/page.js has:
//                 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
//                     <div className="spinner"></div>
//                 </div>
//             </div>
//         );
//     }
analContent = analContent.replace(/<div className="spinner"><\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*\);\r?\n\s*}/, '<div className="spinner"></div>\n                </div>\n            </AdminLayout>\n        );\n    }');
fs.writeFileSync(analisisFile, analContent, 'utf8');

// 3. Fix reports/page.js
const reportsFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/reports/page.js';
let repContent = fs.readFileSync(reportsFile, 'utf8');
// remove the extra </AdminLayout> we just added by mistake since we used strings that might have created two.
// Actually let's just make sure the block from 805 to end is:
/*
                                </div>
                            </div>
                        </AdminLayout>
                    )}
                </AdminLayout>
            );
        }
*/
// Let's just restore it properly. I will replace "</AdminLayout>\n            )}\n        </AdminLayout>" to "</AdminLayout>\n            )}\n        </AdminLayout>" if necessary. We know the error is "Expected corresponding JSX closing tag for <div>, line 808."
// Wait, looking at reports error:
/*
  808 |                             })}
  809 |                         </div>
  810 |                     </div>
  811 |                 </AdminLayout>
      :                 ^^^^^^^^^^^^^^
*/
// It expects </div>, so we are missing a </div>. So reports/page.js is missing a </div> to close <main> or the wrapper!
// Let's print out the last 40 lines of reports/page.js to debug exactly what's wrong!
