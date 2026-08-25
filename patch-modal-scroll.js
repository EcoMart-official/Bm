const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the modal wrappers to add max-h-[90dvh] overflow-y-auto
code = code.replace(
  /<div className="w-full max-w-lg rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7">/g,
  '<div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7">'
);

code = code.replace(
  /<div className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7">/g,
  '<div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7">'
);

// Delete modal is small, probably doesn't need it but we can add it just in case
code = code.replace(
  /<div className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7 text-center">/g,
  '<div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-card p-5 shadow-float sm:rounded-2xl sm:p-7 text-center">'
);

fs.writeFileSync(path, code);
console.log('Modals patched for scrolling');
