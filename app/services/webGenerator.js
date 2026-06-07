const path = require('path');
const fs   = require('fs');
const assetService = require('./assetService');

const outputWeb    = path.join(__dirname, '..', '..', 'output', 'Web');
const templatesWeb = path.join(__dirname, '..', 'templates', 'web');

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// assets = { profilePhotoExists, profilePhotoDataUrl, logoExists, logoDataUrl,
//            privacy: { showPhoto, ... } }
async function generate(profile, config, assets = {}) {
  if (!fs.existsSync(outputWeb)) fs.mkdirSync(outputWeb, { recursive: true });

  const privacy = config.privacy || {};

  // Copy physical asset files so the web card can reference them as relative paths.
  assetService.copyToWebOutput(outputWeb);

  // card.html
  let cardTmpl = fs.readFileSync(path.join(templatesWeb, 'card.html'), 'utf8');
  cardTmpl = applyCard(cardTmpl, profile, config, privacy, assets);
  fs.writeFileSync(path.join(outputWeb, 'card.html'), cardTmpl, 'utf8');

  // index.html (redirect/landing)
  let indexTmpl = fs.readFileSync(path.join(templatesWeb, 'index.html'), 'utf8');
  indexTmpl = applyIndex(indexTmpl, profile, assets);
  fs.writeFileSync(path.join(outputWeb, 'index.html'), indexTmpl, 'utf8');

  return outputWeb;
}

function applyCard(html, profile, config, privacy, assets = {}) {
  const p        = profile.personal || {};
  const links    = profile.links    || {};
  const fullName = esc(`${p.firstName || ''} ${p.lastName || ''}`.trim());
  const topExp   = (profile.experience || []).find(e => e.current) || profile.experience?.[0];

  const emailLine = privacy.showEmail && p.email
    ? `<a href="mailto:${esc(p.email)}" class="card-contact-link">&#9993; ${esc(p.email)}</a>`
    : '';
  const phoneLine = privacy.showPhone && p.phone
    ? `<a href="tel:${esc(p.phone)}" class="card-contact-link">&#9742; ${esc(p.phone)}</a>`
    : '';
  const expHtml = privacy.showExperience && topExp
    ? `<div class="card-exp"><strong>${esc(topExp.title)}</strong> · ${esc(topExp.organization)}</div>`
    : '';

  // Resolve LinkedIn and GitHub from profile.links (preferred) with fallback to personal.
  const linkedinUrl = links.linkedin || p.linkedin || '';
  const githubUrl   = links.github   || p.github   || '';

  // LinkedIn button: only rendered when a valid URL is present.
  const linkedinLine = linkedinUrl
    ? `<a href="${esc(linkedinUrl)}" class="card-contact-link" target="_blank" rel="noopener noreferrer">&#128279; LinkedIn</a>`
    : '';
  // GitHub button: only rendered when a valid URL is present.
  const githubLine = githubUrl
    ? `<a href="${esc(githubUrl)}" class="card-contact-link" target="_blank" rel="noopener noreferrer">&#9096; GitHub</a>`
    : '';

  // Filenames match cvGenerator naming (spaces → underscores).
  const ln = (p.lastName  || '').replace(/\s+/g, '_');
  const fn = (p.firstName || '').replace(/\s+/g, '_');
  const dlButtons = privacy.showDownloadButtons
    ? `<a href="HTML/Harvard/${ln}_${fn}_harvard_CV.html" class="card-btn" download>&#11015; Harvard CV</a>
       <a href="HTML/ATS/${ln}_${fn}_ats_CV.html" class="card-btn" download>&#11015; ATS CV</a>
       <a href="HTML/PhotoSidebar/${fn}_${ln}_CV_PhotoSidebar.html" class="card-btn" download>&#11015; Photo CV</a>`
    : '';

  const vcard = `${fn}_${ln}.vcf`;

  // Profile photo: use copied asset file with relative path; respect privacy.showPhoto.
  // Falls back to nothing (no broken image) when the file is absent or photo is hidden.
  const showPhoto  = assets.profilePhotoExists && privacy.showPhoto !== false;
  const photoBlock = showPhoto
    ? `<div class="card-photo-wrap"><img src="assets/pablo-profile.jpg" alt="${fullName}" class="card-photo"></div>`
    : '';

  // LaunchCV brand logo: rendered only as small footer branding, never in the photo area.
  const logoImg = assets.logoExists
    ? `<img src="assets/launchcv-logo.png" alt="LaunchCV" class="card-logo-img" onerror="this.style.display='none'">`
    : 'LaunchCV';

  const replacements = {
    '{{FULL_NAME}}':     fullName,
    '{{HEADLINE}}':      esc(p.headline),
    '{{LOCATION}}':      esc(p.location),
    '{{STATUS}}':        esc(p.status),
    '{{SUMMARY}}':       esc(profile.summary),
    '{{EMAIL_LINE}}':    emailLine,
    '{{PHONE_LINE}}':    phoneLine,
    '{{LINKEDIN_LINE}}': linkedinLine,
    '{{GITHUB_LINE}}':   githubLine,
    '{{TOP_EXP}}':       expHtml,
    '{{DL_BUTTONS}}':    dlButtons,
    '{{VCARD_FILE}}':    vcard,
    '{{PROFILE_PHOTO_BLOCK}}': photoBlock,
    '{{BRAND_LOGO_BLOCK}}':    logoImg,
    '{{YEAR}}':          String(new Date().getFullYear())
  };

  let result = html;
  for (const [k, v] of Object.entries(replacements)) {
    result = result.split(k).join(v);
  }
  return result;
}

function applyIndex(html, profile, assets = {}) {
  const p        = profile.personal || {};
  const fullName = esc(`${p.firstName || ''} ${p.lastName || ''}`.trim());
  const logoImg  = assets.logoExists
    ? `<img src="assets/launchcv-logo.png" alt="LaunchCV" style="height:40px" onerror="this.style.display='none'">`
    : 'LaunchCV';

  return html
    .split('{{FULL_NAME}}').join(fullName)
    .split('{{HEADLINE}}').join(esc(p.headline))
    .split('{{LOGO_IMG}}').join(logoImg);
}

module.exports = { generate };
