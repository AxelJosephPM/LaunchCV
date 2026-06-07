#!/usr/bin/env node
// npm run pages:prepare
// Copies the already-generated output/Web/ to docs/ for GitHub Pages.
// Run "Generate Web Card" in the app first, then run this script.

const profileStore   = require('../app/services/profileStore');
const pagesPublisher = require('../app/services/pagesPublisher');

async function main() {
  const profile = profileStore.load('en');
  const config  = profileStore.loadConfig();

  console.log('Publishing to docs/...');
  const result = await pagesPublisher.publish(profile, config);

  console.log('✅ GitHub Pages prepared at:', result.docsDir);
  console.log('   PDFs copied  :', result.copiedPdfs.length);
  console.log('   vCards copied:', result.copiedContacts.length);

  if (result.copiedPdfs.length) {
    for (const { original, sanitized } of result.copiedPdfs) {
      if (original !== sanitized) console.log(`   ${original} → ${sanitized}`);
    }
  }

  console.log('\nNext steps:');
  console.log('  1. Commit and push the docs/ folder to your repository.');
  console.log('  2. Enable GitHub Pages: Settings → Pages → master /docs');
  console.log('  3. Your site will be live at the configured Public URL.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  console.error('   Make sure you have generated the Web Card first.');
  process.exit(1);
});
