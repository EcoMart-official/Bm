const fs = require('fs');

const catalog = {
  '@replit/vite-plugin-cartographer': '^0.5.21',
  '@replit/vite-plugin-dev-banner': '^0.1.1',
  '@replit/vite-plugin-runtime-error-modal': '^0.0.6',
  '@tailwindcss/vite': '^4.1.14',
  '@tanstack/react-query': '^5.90.21',
  '@types/node': '^25.3.3',
  '@types/react': '^19.2.0',
  '@types/react-dom': '^19.2.0',
  '@vitejs/plugin-react': '^5.0.4',
  'class-variance-authority': '^0.7.1',
  'clsx': '^2.1.1',
  'drizzle-orm': '^0.45.2',
  'framer-motion': '^12.23.24',
  'lucide-react': '^0.545.0',
  'react': '19.1.0',
  'react-dom': '19.1.0',
  'tailwind-merge': '^3.3.1',
  'tailwindcss': '^4.1.14',
  'tsx': '^4.21.0',
  'vite': '^7.3.2',
  'wouter': '^3.3.5',
  'zod': '^3.25.76'
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') {
        processDir(fullPath);
      }
    } else if (file === 'package.json') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let json = JSON.parse(content);
      let changed = false;
      for (const deps of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (json[deps]) {
          for (const key of Object.keys(json[deps])) {
            if (json[deps][key] === 'catalog:') {
              json[deps][key] = catalog[key] || '*';
              changed = true;
            } else if (json[deps][key] === 'workspace:*') {
              json[deps][key] = '*';
              changed = true;
            }
          }
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, JSON.stringify(json, null, 2) + '\n');
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir('.');
