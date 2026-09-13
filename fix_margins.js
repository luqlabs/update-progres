const fs = require('fs');
const path = require('path');
const file = 'src/pages/Index.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace hero section (which currently has <div style={{ backgroundColor: 'hsl(var(--hero-band))' }}>)
content = content.replace(
  /<div style={{ backgroundColor: 'hsl\\(var\\(--hero-band\\)\\)' }}>/,
  '<div className="mx-2 md:mx-4 lg:mx-6 mt-2 md:mt-4 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden" style={{ backgroundColor: \\'hsl(var(--hero-band))\\' }}>'
);

// Replace all section wrappers
content = content.replace(
  /rounded-t-\[3rem\] md:rounded-t-\[4rem\]/g,
  'mx-2 md:mx-4 lg:mx-6 rounded-[2.5rem] md:rounded-[3.5rem]'
);

// Add bottom margin to the footer
content = content.replace(
  /<div className="relative z-\[60\] -mt-16 mx-2 md:mx-4 lg:mx-6 rounded-\[2.5rem\] md:rounded-\[3.5rem\]/,
  '<div className="relative z-[60] -mt-16 mb-2 md:mb-4 lg:mb-6 mx-2 md:mx-4 lg:mx-6 rounded-[2.5rem] md:rounded-[3.5rem]'
);

fs.writeFileSync(file, content);
console.log('Done');
