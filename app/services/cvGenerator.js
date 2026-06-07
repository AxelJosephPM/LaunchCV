const path = require('path');
const fs = require('fs');

const outputBase  = path.join(__dirname, '..', '..', 'output', 'HTML');
const templatesDir = path.join(__dirname, '..', 'templates', 'cv');

// filenameFn receives (lastNameSafe, firstNameSafe) with spaces → underscores.
// Harvard/ATS/Modern keep their existing naming so web card download links stay valid.
const FORMAT_MAP = {
  harvard:        { dir: 'Harvard',      template: 'harvard.html',       filenameFn: (l, f) => `${l}_${f}_harvard_CV`          },
  ats:            { dir: 'ATS',          template: 'ats.html',           filenameFn: (l, f) => `${l}_${f}_ats_CV`              },
  modern:         { dir: 'Modern',       template: 'modern.html',        filenameFn: (l, f) => `${l}_${f}_modern_CV`           },
  european:       { dir: 'European',     template: 'european.html',      filenameFn: (l, f) => `${f}_${l}_CV_European`         },
  academic:       { dir: 'Academic',     template: 'academic.html',      filenameFn: (l, f) => `${f}_${l}_CV_Academic`         },
  'one-page':     { dir: 'OnePage',      template: 'one-page.html',      filenameFn: (l, f) => `${f}_${l}_CV_OnePage`          },
  international:  { dir: 'International',template: 'international.html', filenameFn: (l, f) => `${f}_${l}_Resume_International` },
  'photo-sidebar':{ dir: 'PhotoSidebar', template: 'photo-sidebar.html', filenameFn: (l, f) => `${f}_${l}_CV_PhotoSidebar`     }
};

// ─── HTML escaping ────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Formats where a profile photo may be displayed (when privacy.showPhoto is true).
const PHOTO_FORMATS = new Set(['modern', 'european', 'photo-sidebar']);

// ─── Public API ───────────────────────────────────────────────────────────────

// assets = { hasPhoto, photoDataUrl, hasLogo, logoDataUrl, privacy: { showPhoto } }
function renderHtml(format, profile, assets = {}) {
  const entry = FORMAT_MAP[format];
  if (!entry) throw new Error(`Unknown CV format: ${format}`);
  const tmplPath = path.join(templatesDir, entry.template);
  if (!fs.existsSync(tmplPath)) throw new Error(`Template not found: ${entry.template}`);
  const html = fs.readFileSync(tmplPath, 'utf8');
  return applyProfile(html, profile, format, assets);
}

function generate(format, profile, assets = {}) {
  const entry = FORMAT_MAP[format];
  if (!entry) throw new Error(`Unknown CV format: ${format}`);
  const html   = renderHtml(format, profile, assets);
  const outDir = path.join(outputBase, entry.dir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const ln   = (profile.personal.lastName  || '').replace(/\s+/g, '_');
  const fn   = (profile.personal.firstName || '').replace(/\s+/g, '_');
  const name = entry.filenameFn(ln, fn) + '.html';
  const outPath = path.join(outDir, name);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

// Returns { format → path } for HTML files and also exposes the rendered HTML map
// for PDF generation without re-rendering.
async function generateAll(profile, assets = {}) {
  const results  = {};
  const htmlMap  = {};
  for (const format of Object.keys(FORMAT_MAP)) {
    try {
      const html = renderHtml(format, profile, assets);
      htmlMap[format]  = html;
      const outDir = path.join(outputBase, FORMAT_MAP[format].dir);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const ln   = (profile.personal.lastName  || '').replace(/\s+/g, '_');
      const fn   = (profile.personal.firstName || '').replace(/\s+/g, '_');
      const name = FORMAT_MAP[format].filenameFn(ln, fn) + '.html';
      const outPath = path.join(outDir, name);
      fs.writeFileSync(outPath, html, 'utf8');
      results[format] = outPath;
    } catch (e) {
      results[format] = { error: e.message };
    }
  }
  return { results, htmlMap };
}

// Expose FORMAT_MAP keys for use by pdfGenerator naming.
function getFormats() { return Object.keys(FORMAT_MAP); }

// ─── Template variable substitution ──────────────────────────────────────────
// Unknown placeholders left in a template are simply left unreplaced (safe).

function applyProfile(html, profile, format, assets = {}) {
  const p  = profile.personal || {};
  const ed = profile.education     || [];
  const ex = profile.experience    || [];
  const ce = profile.certifications || [];
  const la = profile.languages     || [];
  const sk = profile.skills        || [];
  const pr = profile.projects      || [];

  const fullName   = esc(`${p.firstName || ''} ${p.lastName || ''}`.trim());
  const showPhoto  = assets.hasPhoto &&
                     PHOTO_FORMATS.has(format) &&
                     (assets.privacy ? assets.privacy.showPhoto !== false : true);

  const photoBlock = showPhoto
    ? `<div class="cv-photo-wrap"><img src="${assets.photoDataUrl}" alt="${fullName}" class="cv-photo"></div>`
    : '';
  const logoImg = assets.hasLogo
    ? `<img src="${assets.logoDataUrl}" alt="LaunchCV" class="logo-img">`
    : '<span class="logo-text-fallback">LaunchCV</span>';

  const replacements = {
    // ── Identity
    '{{FULL_NAME}}':   fullName,
    '{{FIRST_NAME}}':  esc(p.firstName),
    '{{LAST_NAME}}':   esc(p.lastName),
    '{{HEADLINE}}':    esc(p.headline),
    '{{LOCATION}}':    esc(p.location),
    '{{EMAIL}}':       esc(p.email),
    '{{PHONE}}':       esc(p.phone),
    '{{LINKEDIN}}':    esc(p.linkedin),
    '{{GITHUB}}':      esc(p.github),
    '{{WEBSITE}}':     esc(p.website),
    '{{SUMMARY}}':     esc(profile.summary),
    '{{STATUS}}':      esc(p.status),
    '{{YEAR}}':        String(new Date().getFullYear()),
    // ── Contact lines — only non-empty fields, no stray separators
    '{{CONTACT_PIPE}}':        renderContactLine(p, ' | '),
    '{{CONTACT_DOT}}':         renderContactLine(p, ' · '),
    '{{CONTACT_FIELDS_PIPE}}': renderContactFields(p, ' | '), // no location (for formats that show it separately)
    // ── Asset blocks
    '{{PHOTO_BLOCK}}': photoBlock,
    '{{LOGO_IMG}}':    logoImg,

    // ── Standard rendered blocks (Harvard / ATS / Modern)
    '{{EDUCATION}}':       renderEducation(ed),
    '{{EXPERIENCE}}':      renderExperience(ex),
    '{{CERTIFICATIONS}}':  renderCertifications(ce),
    '{{LANGUAGES}}':       renderLanguages(la),
    '{{SKILLS}}':          renderSkills(sk),

    // ── European CV sidebar blocks
    '{{EU_CONTACT}}':           renderEuContact(p),
    '{{LANGUAGES_SIDEBAR}}':    renderLanguagesSidebar(la),
    '{{SKILLS_SIDEBAR}}':       renderSkillsSidebar(sk),
    '{{CERTIFICATIONS_SIDEBAR}}': renderCertificationsSidebar(ce),

    // ── Academic CV extras
    '{{RESEARCH_INTERESTS}}':   renderResearchInterests(sk),
    '{{EDUCATION_ACADEMIC}}':   renderEducationAcademic(ed),
    '{{EXPERIENCE_ACADEMIC}}':  renderExperienceAcademic(ex),

    // ── One-page CV limited blocks
    '{{EDUCATION_COMPACT}}':    renderEducationCompact(ed),
    '{{EXPERIENCE_LIMITED}}':   renderExperienceLimited(ex, 2),
    '{{SKILLS_LIMITED}}':       renderSkillsLimited(sk, 6),

    // ── International Resume blocks
    '{{EXPERIENCE_BULLETS}}':   renderExperienceBullets(ex),
    '{{SKILLS_GROUPED}}':       renderSkillsGrouped(sk),
    '{{CERTS_AND_LANGS}}':      renderCertsAndLangs(ce, la),

    // ── Photo Sidebar CV blocks
    '{{PS_PHOTO_BLOCK}}':       renderPsPhotoBlock(p, assets, format),
    '{{PS_CONTACT}}':           renderPsContact(p),
    '{{PS_LANGUAGES}}':         renderPsLanguagesSidebar(la),
    '{{PS_SKILLS}}':            renderPsSkillsSidebar(sk),
    '{{PS_PROJECTS_BLOCK}}':    renderPsProjectsBlock(pr),
  };

  let result = html;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }
  return result;
}

// ─── Contact line helper ──────────────────────────────────────────────────────
// Joins only non-empty fields so no stray separators appear when fields are blank.

// renderContactLine — location + optional fields, no empty separators.
function renderContactLine(p, sep) {
  const parts = [p.location, p.email, p.phone, p.linkedin]
    .filter(v => v && String(v).trim())
    .map(esc);
  return parts.join(sep);
}

// renderContactFields — optional fields only (no location); for formats where
// location is already shown in a separate element.
function renderContactFields(p, sep) {
  const parts = [p.email, p.phone, p.linkedin]
    .filter(v => v && String(v).trim())
    .map(esc);
  return parts.join(sep);
}

// ─── Standard renderers (used by Harvard / ATS / Modern) ─────────────────────

function renderEducation(items) {
  if (!items.length) return '<p class="cv-empty">No education entries yet.</p>';
  return items.map(e => `
    <div class="cv-entry">
      <div class="cv-entry-header">
        <span class="cv-institution">${esc(e.institution)}</span>
        <span class="cv-dates">${esc(e.startDate)} – ${esc(e.endDate)}</span>
      </div>
      <div class="cv-degree">${esc(e.degree)}${e.field && e.field !== e.degree ? ', ' + esc(e.field) : ''}</div>
      ${e.location ? `<div class="cv-location">${esc(e.location)}</div>` : ''}
      ${e.grade    ? `<div class="cv-grade">Grade: ${esc(e.grade)}</div>` : ''}
    </div>`).join('\n');
}

function renderExperience(items) {
  if (!items.length) return '<p class="cv-empty">No experience entries yet.</p>';
  return items.map(e => `
    <div class="cv-entry">
      <div class="cv-entry-header">
        <span class="cv-role">${esc(e.title)}</span>
        <span class="cv-dates">${esc(e.startDate)} – ${esc(e.endDate)}</span>
      </div>
      <div class="cv-org">${esc(e.organization)}${e.location ? ' · ' + esc(e.location) : ''}</div>
      ${e.type        ? `<div class="cv-type">${esc(e.type)}</div>`        : ''}
      ${e.description ? `<p class="cv-desc">${esc(e.description)}</p>`    : ''}
    </div>`).join('\n');
}

function renderCertifications(items) {
  if (!items.length) return '<p class="cv-empty">No certifications yet.</p>';
  return items.map(c => `
    <div class="cv-entry">
      <div class="cv-entry-header">
        <span class="cv-cert-name">${esc(c.name)}</span>
        <span class="cv-dates">${esc(c.date)}</span>
      </div>
      <div class="cv-issuer">${esc(c.issuer)}</div>
    </div>`).join('\n');
}

function renderLanguages(items) {
  return items.map(l => `<span class="cv-lang-item">${esc(l.language)} <em>(${esc(l.level)})</em></span>`).join(' · ');
}

function renderSkills(items) {
  return items.map(s => `<span class="cv-skill-tag">${esc(s)}</span>`).join(' ');
}

// ─── European CV sidebar renderers ────────────────────────────────────────────

function renderEuContact(p) {
  const lines = [];
  if (p.email)    lines.push(`<div class="eu-contact-line">&#9993; ${esc(p.email)}</div>`);
  if (p.phone)    lines.push(`<div class="eu-contact-line">&#9742; ${esc(p.phone)}</div>`);
  if (p.linkedin) lines.push(`<div class="eu-contact-line">&#128279; LinkedIn profile</div>`);
  if (p.github)   lines.push(`<div class="eu-contact-line">&#9096; GitHub profile</div>`);
  if (!lines.length) lines.push(`<div class="eu-contact-line eu-placeholder">Add contact details in the app.</div>`);
  return lines.join('');
}

function renderLanguagesSidebar(items) {
  if (!items.length) return '<p class="eu-placeholder">No languages yet.</p>';
  return items.map(l => `
    <div class="eu-lang-row">
      <span class="eu-lang-name">${esc(l.language)}</span>
      <span class="eu-lang-level">${esc(l.level)}</span>
    </div>`).join('');
}

function renderSkillsSidebar(items) {
  if (!items.length) return '<p class="eu-placeholder">No skills yet.</p>';
  return items.map(s => `<span class="eu-skill-pill">${esc(s)}</span>`).join('');
}

function renderCertificationsSidebar(items) {
  if (!items.length) return '<p class="eu-placeholder">No certifications yet.</p>';
  return items.map(c => `
    <div class="eu-cert">
      <div class="eu-cert-name">${esc(c.name)}</div>
      <div class="eu-cert-meta">${esc(c.issuer)}${c.date ? ' · ' + esc(c.date) : ''}</div>
    </div>`).join('');
}

// ─── Academic CV renderers ────────────────────────────────────────────────────

function renderResearchInterests(skills) {
  if (!skills.length) return '<p class="cv-empty">No skills/interests defined yet.</p>';
  return `<ul class="ac-interests">${skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
}

function renderEducationAcademic(items) {
  if (!items.length) return '<p class="cv-empty">No education entries yet.</p>';
  return items.map(e => `
    <div class="ac-entry">
      <div class="ac-entry-header">
        <div>
          <div class="ac-institution">${esc(e.institution)}</div>
          <div class="ac-degree">${esc(e.degree)}${e.field && e.field !== e.degree ? ' — ' + esc(e.field) : ''}</div>
          ${e.location ? `<div class="ac-location">${esc(e.location)}</div>` : ''}
          ${e.grade    ? `<div class="ac-grade">Final grade: ${esc(e.grade)}</div>` : ''}
        </div>
        <div class="ac-dates">${esc(e.startDate)} – ${esc(e.endDate)}</div>
      </div>
    </div>`).join('\n');
}

function renderExperienceAcademic(items) {
  if (!items.length) return '<p class="cv-empty">No experience entries yet.</p>';
  return items.map(e => `
    <div class="ac-entry">
      <div class="ac-entry-header">
        <div>
          <div class="ac-role">${esc(e.title)}</div>
          <div class="ac-org">${esc(e.organization)}${e.location ? ', ' + esc(e.location) : ''}</div>
          ${e.type        ? `<div class="ac-type">${esc(e.type)}</div>`         : ''}
          ${e.description ? `<p class="ac-desc">${esc(e.description)}</p>`     : ''}
        </div>
        <div class="ac-dates">${esc(e.startDate)} – ${esc(e.endDate)}</div>
      </div>
    </div>`).join('\n');
}

// ─── One-page CV renderers ────────────────────────────────────────────────────

function renderEducationCompact(items) {
  return items.map(e => `
    <div class="op-edu-row">
      <span class="op-institution">${esc(e.institution)}</span>
      <span class="op-degree">${esc(e.degree)}</span>
      <span class="op-dates">${esc(e.startDate)} – ${esc(e.endDate)}</span>
    </div>`).join('');
}

function renderExperienceLimited(items, max) {
  const limited = items.slice(0, max);
  return limited.map(e => {
    const desc = e.description
      ? (e.description.length > 110 ? e.description.substring(0, 107) + '…' : e.description)
      : '';
    return `
    <div class="op-entry">
      <div class="op-entry-header">
        <span class="op-role">${esc(e.title)}</span>
        <span class="op-dates">${esc(e.startDate)} – ${esc(e.endDate)}</span>
      </div>
      <div class="op-org">${esc(e.organization)}${e.location ? ' · ' + esc(e.location) : ''}</div>
      ${desc ? `<p class="op-desc">${esc(desc)}</p>` : ''}
    </div>`;
  }).join('');
}

function renderSkillsLimited(items, max) {
  return items.slice(0, max).map(s => `<span class="op-skill">${esc(s)}</span>`).join('');
}

// ─── International Resume renderers ──────────────────────────────────────────

function renderExperienceBullets(items) {
  if (!items.length) return '<p class="cv-empty">No experience entries yet.</p>';
  return items.map(e => `
    <div class="ir-entry">
      <div class="ir-entry-header">
        <div>
          <span class="ir-role">${esc(e.title)}</span>
          <span class="ir-sep"> · </span>
          <span class="ir-org">${esc(e.organization)}${e.location ? ', ' + esc(e.location) : ''}</span>
        </div>
        <span class="ir-dates">${esc(e.startDate)} – ${esc(e.endDate)}</span>
      </div>
      ${e.description ? `<ul class="ir-bullets"><li>${esc(e.description)}</li></ul>` : ''}
    </div>`).join('\n');
}

function renderSkillsGrouped(items) {
  if (!items.length) return '<p class="cv-empty">No skills yet.</p>';
  // Split into two visual rows to give a structured look
  const mid  = Math.ceil(items.length / 2);
  const row1 = items.slice(0, mid);
  const row2 = items.slice(mid);
  const tag  = s => `<span class="ir-skill-tag">${esc(s)}</span>`;
  return `<div class="ir-skills-row">${row1.map(tag).join('')}</div>
          <div class="ir-skills-row">${row2.map(tag).join('')}</div>`;
}

function renderCertsAndLangs(certs, langs) {
  const certHtml = certs.map(c =>
    `<div class="ir-cert-row"><strong>${esc(c.name)}</strong> — ${esc(c.issuer)}${c.date ? ', ' + esc(c.date) : ''}</div>`
  ).join('');
  const langHtml = langs.map(l =>
    `<span class="ir-lang-item">${esc(l.language)} (${esc(l.level)})</span>`
  ).join(' &nbsp;|&nbsp; ');
  return (certHtml || '<p class="cv-empty">No certifications yet.</p>') +
         (langHtml ? `<div class="ir-langs-row">${langHtml}</div>` : '');
}

// ─── Photo Sidebar CV renderers ───────────────────────────────────────────────

// Shows circular photo when privacy allows; falls back to initials badge so the
// sidebar always has a clean visual element even without a photo asset.
function renderPsPhotoBlock(p, assets, format) {
  const showPhoto = assets.hasPhoto &&
                    PHOTO_FORMATS.has(format) &&
                    (assets.privacy ? assets.privacy.showPhoto !== false : true);
  const displayName = `${p.firstName || ''} ${p.lastName || ''}`.trim();

  if (showPhoto) {
    return `<div class="ps-photo-wrap"><img src="${assets.photoDataUrl}" alt="${esc(displayName)}" class="ps-photo"></div>`;
  }

  const initials = displayName
    .split(/\s+/).slice(0, 2)
    .map(w => w[0] || '').join('').toUpperCase();

  if (!initials) return '';
  return `<div class="ps-photo-wrap"><div class="ps-initials">${initials}</div></div>`;
}

// Renders each non-empty contact field on its own line; no empty separators.
function renderPsContact(p) {
  const lines = [];
  if (p.email)    lines.push(`<div class="ps-contact-line">&#9993; <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>`);
  if (p.phone)    lines.push(`<div class="ps-contact-line">&#9742; ${esc(p.phone)}</div>`);
  if (p.linkedin) lines.push(`<div class="ps-contact-line">&#128279; <a href="${esc(p.linkedin)}">${esc(p.linkedin)}</a></div>`);
  if (p.github)   lines.push(`<div class="ps-contact-line">&#9096; <a href="${esc(p.github)}">${esc(p.github)}</a></div>`);
  if (!lines.length) {
    lines.push(`<div class="ps-contact-line" style="color:#304c68">Add contact details in the app.</div>`);
  }
  return lines.join('');
}

function renderPsLanguagesSidebar(items) {
  if (!items.length) return '<div class="ps-lang-row" style="color:#304c68">No languages listed.</div>';
  return items.map(l => `
    <div class="ps-lang-row">
      <span>${esc(l.language)}</span>
      <span class="ps-lang-level">${esc(l.level)}</span>
    </div>`).join('');
}

function renderPsSkillsSidebar(items) {
  if (!items.length) return '<span style="color:#304c68; font-size:8pt">No skills listed.</span>';
  return items.map(s => `<span class="ps-skill-pill">${esc(s)}</span>`).join('');
}

// Returns the full projects section block, or empty string if no projects exist.
function renderPsProjectsBlock(items) {
  if (!items || !items.length) return '';
  const entries = items.map(proj => `
    <div class="cv-entry">
      <div class="cv-entry-header">
        <span class="cv-role">${esc(proj.name || proj.title || '')}</span>
        ${proj.date || proj.endDate ? `<span class="cv-dates">${esc(proj.date || proj.endDate)}</span>` : ''}
      </div>
      ${proj.role ? `<div class="cv-org">${esc(proj.role)}</div>` : ''}
      ${proj.description ? `<p class="cv-desc">${esc(proj.description)}</p>` : ''}
      ${proj.url ? `<a href="${esc(proj.url)}" class="cv-location" style="color:#3d7ec8">${esc(proj.url)}</a>` : ''}
    </div>`).join('\n');
  return `\n  <div class="main-sec">\n    <h2>Projects</h2>\n    ${entries}\n  </div>`;
}

module.exports = { generate, generateAll, renderHtml };
