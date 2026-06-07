// Copies output/Web/ to docs/ for GitHub Pages deployment.
// Also copies CV PDFs and vCards with sanitized filenames so the static landing
// page uses GitHub Pages-compatible relative links.

const path = require('path');
const fs   = require('fs');

const outputWebDir     = path.join(__dirname, '..', '..', 'output', 'Web');
const outputPdfDir     = path.join(__dirname, '..', '..', 'output', 'PDF');
const docsDir          = path.join(__dirname, '..', '..', 'docs');

// Files/dirs that this publisher owns (safe to clear before re-publishing).
const MANAGED_ENTRIES = ['index.html', 'card.html', 'assets', 'Contact', '.nojekyll'];

// Strip combining diacritics and replace non-URL-safe characters.
function sanitize(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.\-]/g, '_');
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src,  entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function clearManaged() {
  if (!fs.existsSync(docsDir)) return;
  for (const name of MANAGED_ENTRIES) {
    const p = path.join(docsDir, name);
    if (!fs.existsSync(p)) continue;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) fs.rmSync(p, { recursive: true, force: true });
    else fs.unlinkSync(p);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function publish(profile, config) {
  if (!fs.existsSync(path.join(outputWebDir, 'card.html'))) {
    throw new Error(
      'output/Web/card.html not found. Please generate the Web Card first ' +
      '(Generate → Generate Web Card).'
    );
  }

  const privacy = config?.privacy || {};

  // Prepare docs/
  fs.mkdirSync(docsDir, { recursive: true });
  clearManaged();

  // Copy output/Web/ → docs/ (index.html, card.html, assets/)
  for (const entry of fs.readdirSync(outputWebDir, { withFileTypes: true })) {
    const src  = path.join(outputWebDir, entry.name);
    const dest = path.join(docsDir, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }

  // .nojekyll prevents GitHub Pages from running Jekyll, which breaks
  // paths containing underscores.
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf8');

  // Copy CV PDFs with sanitized filenames → docs/assets/cv/
  const copiedPdfs = [];
  if (privacy.showDownloadButtons !== false && fs.existsSync(outputPdfDir)) {
    const cvDestDir = path.join(docsDir, 'assets', 'cv');
    fs.mkdirSync(cvDestDir, { recursive: true });
    for (const file of fs.readdirSync(outputPdfDir)) {
      if (!file.endsWith('.pdf')) continue;
      const san = sanitize(file);
      fs.copyFileSync(path.join(outputPdfDir, file), path.join(cvDestDir, san));
      copiedPdfs.push({ original: file, sanitized: san });
    }
  }

  const copiedContacts = [];
  const contactDest = path.join(docsDir, 'Contact');
  if (fs.existsSync(contactDest)) {
    for (const file of fs.readdirSync(contactDest)) {
      if (file.toLowerCase().endsWith('.vcf')) copiedContacts.push({ original: file, sanitized: file });
    }
  }

  return { docsDir, copiedPdfs, copiedContacts };
}

module.exports = { publish, docsDir };
