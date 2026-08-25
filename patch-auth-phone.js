const fs = require('fs');
const path = 'artifacts/commercial-billing/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetCall = `await auth.signUp(email, password, name);`;
const newCall = `await auth.signUp(email, password, name, phone);`;

if (code.includes(targetCall)) {
  code = code.replace(targetCall, newCall);
  fs.writeFileSync(path, code);
  console.log('App.tsx auth.signUp call patched');
} else {
  console.log('Could not find auth.signUp call in App.tsx');
}
