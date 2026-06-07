#!/usr/bin/env node
// npm run pages:generate
// Generates the Web Card from the saved profile, then copies it to docs/.
// Does not require the app to be open; runs entirely in Node.js.

const profileStore   = require('../app/services/profileStore');
const assetService   = require('../app/services/assetService');
const webGenerator   = require('../app/services/webGenerator');
const pagesPublisher = require('../app/services/pagesPublisher');

async function main() {
  const profile = profileStore.load('en');
  const config  = profileStore.loadConfig();

  console.log('Loading assets...');
  const { assets, warnings } = assetService.getAssetInfo();
  if (warnings.length) {
    for (const w of warnings) console.warn('  ⚠', w);
  }

  console.log('Generating Web Card...');
  await webGenerator.generate(profile, config, assets);

  console.log('Publishing to docs/...');
  const result = await pagesPublisher.publish(profile, config);

  console.log('✅ GitHub Pages prepared at:', result.docsDir);
  console.log('   PDFs copied  :', result.copiedPdfs.length);
  console.log('   vCards copied:', result.copiedContacts.length);

  console.log('\nNext steps:');
  console.log('  1. Commit and push the docs/ folder to your repository.');
  console.log('  2. Enable GitHub Pages: Settings → Pages → master /docs');
  console.log('  3. Your site will be live at the configured Public URL.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
