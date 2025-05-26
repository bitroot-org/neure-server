// install-browser.js
const { execSync } = require('child_process');

console.log('Installing Chromium browser for Puppeteer...');
try {
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
  console.log('Chromium browser installed successfully!');
} catch (error) {
  console.error('Failed to install Chromium browser:', error);
  process.exit(1);
}
