// install-browser.js
const { execSync } = require('child_process');

console.log('Installing Chromium browser for Puppeteer...');
try {
  execSync('npx puppeteer browsers install chrome', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PUPPETEER_CACHE_DIR: process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer',
    },
  });
  console.log('Chromium browser installed successfully!');
} catch (error) {
  console.error('Failed to install Chromium browser:', error);
  process.exit(1);
}
