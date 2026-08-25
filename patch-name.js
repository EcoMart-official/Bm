const fs = require('fs');

const appTsxPath = 'artifacts/commercial-billing/src/App.tsx';
let appCode = fs.readFileSync(appTsxPath, 'utf8');

appCode = appCode.replace(
  />counterpart<span/g,
  '>BillingMaster<span'
);

appCode = appCode.replace(
  /COUNTERPART \/ OPERATOR WORKSPACE/g,
  'BILLINGMASTER / OPERATOR WORKSPACE'
);

appCode = appCode.replace(
  /'Sign in to Counterpart'/g,
  "'Sign in to BillingMaster'"
);

appCode = appCode.replace(
  /'New to Counterpart\? '/g,
  "'New to BillingMaster? '"
);

fs.writeFileSync(appTsxPath, appCode);

const indexHtmlPath = 'artifacts/commercial-billing/index.html';
if (fs.existsSync(indexHtmlPath)) {
  let htmlCode = fs.readFileSync(indexHtmlPath, 'utf8');
  htmlCode = htmlCode.replace(/Counterpart/g, 'BillingMaster');
  fs.writeFileSync(indexHtmlPath, htmlCode);
} else {
    console.log('index.html not found at root, checking public...');
}

console.log('Name changed to BillingMaster');
