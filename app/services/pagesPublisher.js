// Copies output/Web/ to docs/ for GitHub Pages deployment.
// Also copies CV PDFs (sanitized filenames) to docs/assets/cv/
// and patches docs/card.html download links to use those PDFs.

const path = require('path');
const fs   = require('fs');

const outputWebDir     = path.join(__dirname, '..', '..', 'output', 'Web');
const outputPdfDir     = path.join(__dirname, '..', '..', 'output', 'PDF');
const outputContactDir = path.join(__dirname, '..', '..', 'output', 'Contact');
const docsDir          = path.join(__dirname, '..', '..', 'docs');

// Files/dirs that this publisher owns (safe to clear before re-publishing).
const MANAGED_ENTRIES = ['index.html', 'card.html', 'assets', 'Contact', '.nojekyll'];

// Map from PDF filename suffix to human-readable download label.
const PDF_LABELS = {
  '_CV_Harvard.pdf':           'Harvard CV',
  '_CV_ATS.pdf':               'ATS CV',
  '_CV_Modern.pdf':            'Modern CV',
  '_CV_European.pdf':          'European CV',
  '_CV_Academic.pdf':          'Academic CV',
  '_CV_OnePage.pdf':           'One-Page CV',
  '_CV_PhotoSidebar.pdf':      'Photo Sidebar CV',
  '_Resume_International.pdf': 'International Resume',
};

// Strip combining diacritics and replace non-URL-safe characters.
function sanitize(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.\-]/g, '_');
}

function getPdfLabel(filename) {
  for (const [suffix, label] of Object.entries(PDF_LABELS)) {
    if (filename.endsWith(suffix)) return label;
  }
  return filename.replace(/\.pdf$/i, '').replace(/_/g, ' ');
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
      copiedPdfs.push({ original: file, sanitized: san, label: getPdfLabel(san) });
    }
  }

  // Copy Contact directory (vCard .vcf) with sanitized filenames
  const copiedContacts = [];
  if (fs.existsSync(outputContactDir)) {
    const contactDest = path.join(docsDir, 'Contact');
    fs.mkdirSync(contactDest, { recursive: true });
    for (const file of fs.readdirSync(outputContactDir)) {
      const san = sanitize(file);
      fs.copyFileSync(path.join(outputContactDir, file), path.join(contactDest, san));
      copiedContacts.push({ original: file, sanitized: san });
    }
  }

  // Patch docs/card.html
  const cardPath = path.join(docsDir, 'card.html');
  if (fs.existsSync(cardPath)) {
    let html = fs.readFileSync(cardPath, 'utf8');

    // Replace the Download CV btn-group with links to the sanitized PDF copies.
    if (copiedPdfs.length) {
      const linksHtml = copiedPdfs
        .map(({ sanitized, label }) =>
          `<a href="assets/cv/${sanitized}" class="card-btn" download>&#11015; ${label}</a>`)
        .join('\n    ');

      html = html.replace(
        /(<div class="section-label">Download CV<\/div>\s*<div class="btn-group">)([\s\S]*?)(<\/div>\s*<p class="placeholder-note">)More formats coming soon\.(<\/p>)/,
        `$1\n    ${linksHtml}\n  $3PDF downloads available.$4`
      );
    }

    // Fix vCard href to use the sanitized filename.
    for (const { original, sanitized } of copiedContacts) {
      html = html.split(`href="Contact/${original}"`).join(`href="Contact/${sanitized}"`);
    }

    fs.writeFileSync(cardPath, html, 'utf8');
  }

  return { docsDir, copiedPdfs, copiedContacts };
}

module.exports = { publish, docsDir };
