const fs = require('fs');
const path = require('path');
const src = path.join('frontend', 'src', 'pages');

const f = 'AddProductFlow.jsx';
const content = fs.readFileSync(path.join(src, f), 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (/border: \d+px solid ,/.test(line)) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});
