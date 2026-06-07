const path = require('path');
const fs   = require('fs');

const ROOT       = path.join(__dirname, '..', '..'); // repo root
const ASSETS_DIR = path.join(__dirname, '..', 'renderer', 'assets');

// Detect actual MIME type from file magic bytes rather than extension.
function detectMime(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif';
  if (buf[0] === 0x52 && buf[4] === 0x57) return 'image/webp';
  return 'image/jpeg'; // fallback
}

function toDataUrl(filePath) {
  const buf  = fs.readFileSync(filePath);
  const mime = detectMime(buf);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function ensureAssetsDir() {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Returns { assets, warnings } where assets uses explicit names to distinguish
// Pablo's profile photo from the LaunchCV brand logo.
//
// Profile photo fields: profilePhotoExists, profilePhotoDataUrl
// Logo fields:          logoExists, logoDataUrl
function getAssetInfo() {
  ensureAssetsDir();
  const warnings = [];
  const assets   = {};

  // ── Profile photo (pablo-profile.jpg) ─────────────────────────────────────
  const photoSrc = path.join(ROOT, 'pablo-profile.jpg');
  if (fs.existsSync(photoSrc)) {
    const dest = path.join(ASSETS_DIR, 'pablo-profile.jpg');
    fs.copyFileSync(photoSrc, dest);
    assets.profilePhotoDataUrl = toDataUrl(photoSrc);
    assets.profilePhotoExists  = true;
  } else {
    assets.profilePhotoDataUrl = '';
    assets.profilePhotoExists  = false;
    warnings.push('Profile photo (pablo-profile.jpg) not found in the repository root. Visual CVs will show initials instead.');
  }

  // ── LaunchCV brand logo (launchcv-logo.png) ────────────────────────────────
  const logoSrc = path.join(ROOT, 'launchcv-logo.png');
  if (fs.existsSync(logoSrc)) {
    const dest = path.join(ASSETS_DIR, 'launchcv-logo.png');
    fs.copyFileSync(logoSrc, dest);
    assets.logoDataUrl = toDataUrl(logoSrc);
    assets.logoExists  = true;
  } else {
    assets.logoDataUrl = '';
    assets.logoExists  = false;
    warnings.push('LaunchCV logo (launchcv-logo.png) not found in the repository root. Text branding will be used instead.');
  }

  return { assets, warnings };
}

// Copy physical asset files into the web output assets folder (for GitHub Pages).
function copyToWebOutput(webOutputDir) {
  const webAssets = path.join(webOutputDir, 'assets');
  if (!fs.existsSync(webAssets)) fs.mkdirSync(webAssets, { recursive: true });

  const photoSrc = path.join(ROOT, 'pablo-profile.jpg');
  if (fs.existsSync(photoSrc)) fs.copyFileSync(photoSrc, path.join(webAssets, 'pablo-profile.jpg'));

  const logoSrc = path.join(ROOT, 'launchcv-logo.png');
  if (fs.existsSync(logoSrc))  fs.copyFileSync(logoSrc,  path.join(webAssets, 'launchcv-logo.png'));
}

module.exports = { getAssetInfo, copyToWebOutput };
