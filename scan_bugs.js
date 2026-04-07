const fs = require('fs');
const path = require('path');
const src = path.join('frontend', 'src', 'pages');

const files = fs.readdirSync(src).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

let allOk = true;
files.forEach(f => {
  const content = fs.readFileSync(path.join(src, f), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    // Detect: style values with "2px solid ," (missing color) 
    if (/border: \d+px solid ,/.test(line)) {
      console.log(`BROKEN BORDER in ${f}:${i+1}: ${line.trim().substring(0, 80)}`);
      allOk = false;
    }
    // Detect: unquoted URLs in JSX props like href= or src= without string
    if (/= https?:\/\/[^'"`{]/.test(line)) {
      console.log(`BROKEN URL in ${f}:${i+1}: ${line.trim().substring(0, 80)}`);
      allOk = false;
    }
    // Detect: broken className like  className={`${  without closing`}
    if (/className=\{\`\$\{[^}]+\}$/.test(line)) {
      console.log(`BROKEN CLASSNAME in ${f}:${i+1}: ${line.trim().substring(0, 80)}`);
      allOk = false;
    }
    // Detect string with backtick removed like: = ORD- or = RC-
    if (/= (ORD|RC)-[^`'";{(]/.test(line)) {
      console.log(`BROKEN ID in ${f}:${i+1}: ${line.trim().substring(0, 80)}`);
      allOk = false;
    }
    // Detect broken template expressions: join(', '); with no backtick
    if (/\.join\(', '\);\s*$/.test(line) && !content.includes('`')) {
      // benign if file has no backticks at all
    }
  });
});

if (allOk) console.log('All files OK - no broken patterns found!');
