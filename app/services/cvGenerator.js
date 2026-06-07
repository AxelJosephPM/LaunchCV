const path = require('path');
const fs = require('fs');

const outputBase   = path.join(__dirname, '..', '..', 'output', 'HTML');
const templatesDir = path.join(__dirname, '..', 'templates', 'cv');

const FORMAT_MAP = {
  harvard:         { dir: 'Harvard',       template: 'harvard.html',       filenameFn: (l, f) => `${l}_${f}_harvard_CV`           },
  ats:             { dir: 'ATS',           template: 'ats.html',           filenameFn: (l, f) => `${l}_${f}_ats_CV`               },
  modern:          { dir: 'Modern',        template: 'modern.html',        filenameFn: (l, f) => `${l}_${f}_modern_CV`            },
  european:        { dir: 'European',      template: 'european.html',      filenameFn: (l, f) => `${f}_${l}_CV_European`          },
  academic:        { dir: 'Academic',      template: 'academic.html',      filenameFn: (l, f) => `${f}_${l}_CV_Academic`          },
  'one-page':      { dir: 'OnePage',       template: 'one-page.html',      filenameFn: (l, f) => `${f}_${l}_CV_OnePage`           },
  international:   { dir: 'International', template: 'international.html', filenameFn: (l, f) => `${f}_${l}_Resume_International`  },
  'photo-sidebar': { dir: 'PhotoSidebar',  template: 'photo-sidebar.html', filenameFn: (l, f) => `${f}_${l}_CV_PhotoSidebar`      }
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

// Skills that should not appear in academic "Research Interests" lists.
const NON_ACADEMIC_SKILLS = new Set([
  'English', 'Team Coordination', 'Student Representation',
  'Representación Estudiantil', 'Coordinación de Equipos',
  'Team Leadership', 'Liderazgo de Equipos',
  'Project Coordination', 'Coordinación de Proyectos'
]);

// ─── Public API ───────────────────────────────────────────────────────────────

// assets = { profilePhotoExists, profilePhotoDataUrl, logoExists, logoDataUrl, privacy: { showPhoto } }
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

async function generateAll(profile, assets = {}) {
  const results = {};
  const htmlMap = {};
  for (const format of Object.keys(FORMAT_MAP)) {
    try {
      const html = renderHtml(format, profile, assets);
      htmlMap[format] = html;
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

function getFormats() { return Object.keys(FORMAT_MAP); }

// ─── Template variable substitution ──────────────────────────────────────────

function applyProfile(html, profile, format, assets = {}) {
  const p  = profile.personal       || {};
  const ed = profile.education      || [];
  const ex = profile.experience     || [];
  const ce = profile.certifications || [];
  const la = profile.languages      || [];
  const sk = profile.skills         || [];
  const pr = profile.projects       || [];
  const sg = profile.skillGroups    || [];

  const fullName  = esc(`${p.firstName || ''} ${p.lastName || ''}`.trim());
  const showPhoto = assets.profilePhotoExists &&
                    PHOTO_FORMATS.has(format) &&
                    (assets.privacy ? assets.privacy.showPhoto !== false : true);

  const photoBlock = showPhoto
    ? `<div class="cv-photo-wrap"><img src="${assets.profilePhotoDataUrl}" alt="${fullName}" class="cv-photo"></div>`
    : '';

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

    // ── Contact lines (no empty separators)
    '{{CONTACT_PIPE}}':        renderContactLine(p, ' | '),
    '{{CONTACT_DOT}}':         renderContactLine(p, ' · '),
    '{{CONTACT_CLEAN_PIPE}}':  renderContactLineClean(p, ' | '),
    '{{CONTACT_CLEAN_DOT}}':   renderContactLineClean(p, ' · '),
    '{{CONTACT_ATS_PIPE}}':    renderContactLineAts(p, ' | '),
    '{{CONTACT_FIELDS_PIPE}}': renderContactFields(p, ' | '),
    '{{CONTACT_FIELDS_CLEAN_PIPE}}': renderContactFieldsClean(p, ' | '),

    // ── Asset blocks — {{LOGO_IMG}} intentionally blank; logo removed from CV output
    '{{PHOTO_BLOCK}}': photoBlock,
    '{{LOGO_IMG}}':    '',

    // ── Social links (clickable anchors for sidebar CVs)
    '{{CONTACT_LINKS}}': renderContactLinks(p),

    // ── Standard rendered blocks
    '{{EDUCATION}}':      renderEducation(ed),
    '{{EXPERIENCE}}':     renderExperience(ex),
    '{{EXPERIENCE_FILTERED}}': renderExperience(filterExperience(ex)),
    '{{CERTIFICATIONS}}': renderCertifications(ce),
    '{{LANGUAGES}}':      renderLanguages(la),
    '{{LANGUAGES_LINES}}': renderLanguagesLines(la),
    '{{SKILLS}}':         renderSkills(sk),

    // ── European CV sidebar blocks
    '{{EU_CONTACT}}':              renderEuContact(p),
    '{{LANGUAGES_SIDEBAR}}':       renderLanguagesSidebar(la),
    '{{SKILLS_SIDEBAR}}':          renderSkillsSidebar(sk),
    '{{CERTIFICATIONS_SIDEBAR}}':  renderCertificationsSidebar(ce),

    // ── Academic CV blocks
    '{{RESEARCH_INTERESTS}}':  renderResearchInterests(sk),
    '{{EDUCATION_ACADEMIC}}':  renderEducationAcademic(ed),
    '{{EXPERIENCE_ACADEMIC}}': renderExperienceAcademic(filterExperience(ex)),
    '{{PROJECTS_ACADEMIC}}':   renderProjectsFull(pr, 'academic'),

    // ── Harvard extras
    '{{PROJECTS_FULL}}': renderProjectsFull(pr, 'harvard'),

    // ── One-page CV limited blocks
    '{{EDUCATION_COMPACT}}':  renderEducationCompact(ed),
    '{{EXPERIENCE_LIMITED}}': renderExperienceLimited(filterExperience(ex), 2),
    '{{SKILLS_LIMITED}}':     renderSkillsLimited(sk, 6),
    '{{PROJECTS_COMPACT}}':   renderProjectsCompact(pr),

    // ── International Resume blocks
    '{{EXPERIENCE_BULLETS}}': renderExperienceBullets(filterExperience(ex)),
    '{{SKILLS_GROUPED}}':     renderSkillsGrouped(sk, sg),
    '{{CERTS_AND_LANGS}}':    renderCertsAndLangs(ce, la),
    '{{PROJECTS_IR}}':        renderProjectsIR(pr),

    // ── Photo Sidebar CV blocks
    '{{PS_PHOTO_BLOCK}}':    renderPsPhotoBlock(p, assets, format),
    '{{PS_CONTACT}}':        renderPsContact(p),
    '{{PS_LANGUAGES}}':      renderPsLanguagesSidebar(la),
    '{{PS_SKILLS}}':         renderPsSkillsSidebar(sk),
    '{{PS_PROJECTS_BLOCK}}': renderPsProjectsBlock(pr),
  };

  let result = html;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }
  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Split a description on newlines to get individual bullet strings.
function descBullets(description) {
  return (description || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
}

// Returns true for a "Student" entry with no useful content (redundant with Education).
function isRedundantStudent(e) {
  return (e.title || '').toLowerCase() === 'student' && !(e.description || '').trim();
}

function filterExperience(items) {
  return items.filter(e => !isRedundantStudent(e));
}

// Strip https:// from a URL and decode percent-encoding for readable display.
function urlDisplay(url) {
  if (!url) return '';
  try { return decodeURIComponent(url).replace(/^https?:\/\//, ''); }
  catch { return url.replace(/^https?:\/\//, ''); }
}

function urlDisplayAts(url, type) {
  if (!url) return '';
  if (type === 'linkedin') return 'linkedin.com/in/pablo-codon-castellano';
  return urlDisplay(url).replace(/\/$/, '');
}

function socialAnchor(url, label, extraStyle = '') {
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;${extraStyle}">${esc(label)}</a>`;
}

// ─── Contact line helpers ─────────────────────────────────────────────────────

function renderContactLine(p, sep) {
  const parts = [];
  if (p.location) parts.push(esc(p.location));
  if (p.email)    parts.push(esc(p.email));
  if (p.phone)    parts.push(esc(p.phone));
  if (p.linkedin) parts.push(esc(urlDisplay(p.linkedin)));
  if (p.github)   parts.push(esc(urlDisplay(p.github)));
  return parts.join(sep);
}

function renderContactLineClean(p, sep) {
  const parts = [];
  if (p.location) parts.push(esc(p.location));
  if (p.email)    parts.push(`<a href="mailto:${esc(p.email)}" style="color:inherit;text-decoration:none;">${esc(p.email)}</a>`);
  if (p.phone)    parts.push(esc(p.phone));
  if (p.linkedin) parts.push(socialAnchor(p.linkedin, 'LinkedIn'));
  if (p.github)   parts.push(socialAnchor(p.github, 'GitHub'));
  return parts.join(sep);
}

function renderContactLineAts(p, sep) {
  const parts = [];
  if (p.location) parts.push(esc(p.location));
  if (p.email)    parts.push(`<a href="mailto:${esc(p.email)}" style="color:inherit;text-decoration:none;">${esc(p.email)}</a>`);
  if (p.phone)    parts.push(esc(p.phone));
  if (p.linkedin) parts.push(socialAnchor(p.linkedin, urlDisplayAts(p.linkedin, 'linkedin')));
  if (p.github)   parts.push(socialAnchor(p.github, urlDisplayAts(p.github, 'github')));
  return parts.join(sep);
}

function renderContactFields(p, sep) {
  const parts = [];
  if (p.email)    parts.push(esc(p.email));
  if (p.phone)    parts.push(esc(p.phone));
  if (p.linkedin) parts.push(esc(urlDisplay(p.linkedin)));
  if (p.github)   parts.push(esc(urlDisplay(p.github)));
  return parts.join(sep);
}

function renderContactFieldsClean(p, sep) {
  const parts = [];
  if (p.email)    parts.push(`<a href="mailto:${esc(p.email)}" style="color:inherit;text-decoration:none;">${esc(p.email)}</a>`);
  if (p.phone)    parts.push(esc(p.phone));
  if (p.linkedin) parts.push(socialAnchor(p.linkedin, 'LinkedIn'));
  if (p.github)   parts.push(socialAnchor(p.github, 'GitHub'));
  return parts.join(sep);
}

// Clickable LinkedIn/GitHub anchors for dark sidebar CVs (Modern, etc.).
function renderContactLinks(p) {
  const parts = [];
  if (p.linkedin) parts.push(`<a href="${esc(p.linkedin)}" style="color:#c8d6e5;font-size:8.5pt;word-break:break-word;text-decoration:none;" target="_blank" rel="noopener noreferrer">LinkedIn</a>`);
  if (p.github)   parts.push(`<a href="${esc(p.github)}"   style="color:#c8d6e5;font-size:8.5pt;word-break:break-word;text-decoration:none;" target="_blank" rel="noopener noreferrer">GitHub</a>`);
  return parts.join('<br>');
}

// ─── Standard renderers (Harvard / ATS / Modern / European) ──────────────────

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

// Multi-line description → bullet list if more than one line; single line → paragraph.
function renderExperience(items) {
  if (!items.length) return '<p class="cv-empty">No experience entries yet.</p>';
  return items.map(e => {
    const bullets = descBullets(e.description);
    const descHtml = bullets.length > 1
      ? `<ul class="cv-desc-list">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
      : bullets.length === 1
      ? `<p class="cv-desc">${esc(bullets[0])}</p>`
      : '';
    return `
    <div class="cv-entry">
      <div class="cv-entry-header">
        <span class="cv-role">${esc(e.title)}</span>
        <span class="cv-dates">${esc(e.startDate)} – ${esc(e.endDate)}</span>
      </div>
      <div class="cv-org">${esc(e.organization)}${e.location ? ' · ' + esc(e.location) : ''}</div>
      ${e.type ? `<div class="cv-type">${esc(e.type)}</div>` : ''}
      ${descHtml}
    </div>`;
  }).join('\n');
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

function renderLanguagesLines(items) {
  return items.map(l => `<span class="cv-lang-item">${esc(l.language)} <em>(${esc(l.level)})</em></span>`).join('');
}

function renderSkills(items) {
  return items.map(s => `<span class="cv-skill-tag">${esc(s)}</span>`).join(' ');
}

// ─── European CV sidebar renderers ────────────────────────────────────────────

function renderEuContact(p) {
  const lines = [];
  if (p.email)    lines.push(`<div class="eu-contact-line"><a href="mailto:${esc(p.email)}" style="color:inherit">${esc(p.email)}</a></div>`);
  if (p.phone)    lines.push(`<div class="eu-contact-line">${esc(p.phone)}</div>`);
  if (p.linkedin) lines.push(`<div class="eu-contact-line"><a href="${esc(p.linkedin)}" style="color:inherit" target="_blank" rel="noopener noreferrer">LinkedIn</a></div>`);
  if (p.github)   lines.push(`<div class="eu-contact-line"><a href="${esc(p.github)}" style="color:inherit" target="_blank" rel="noopener noreferrer">GitHub</a></div>`);
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
  const filtered = skills.filter(s => !NON_ACADEMIC_SKILLS.has(s));
  if (!filtered.length) return '<p class="cv-empty">No technical interests defined yet.</p>';
  return `<ul class="ac-interests">${filtered.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
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
  return items.map(e => {
    const bullets = descBullets(e.description);
    const descHtml = bullets.length > 1
      ? `<ul class="ac-desc-list">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
      : bullets.length === 1
      ? `<p class="ac-desc">${esc(bullets[0])}</p>`
      : '';
    return `
    <div class="ac-entry">
      <div class="ac-entry-header">
        <div>
          <div class="ac-role">${esc(e.title)}</div>
          <div class="ac-org">${esc(e.organization)}${e.location ? ', ' + esc(e.location) : ''}</div>
          ${e.type ? `<div class="ac-type">${esc(e.type)}</div>` : ''}
          ${descHtml}
        </div>
        <div class="ac-dates">${esc(e.startDate)} – ${esc(e.endDate)}</div>
      </div>
    </div>`;
  }).join('\n');
}

// ─── Projects renderers ───────────────────────────────────────────────────────

// Full academic/harvard style: title, role, description bullets.
function renderProjectsFull(items, style) {
  if (!items || !items.length) return '';
  return items.map(proj => {
    const bullets = descBullets(proj.description);
    const descHtml = bullets.length > 1
      ? `<ul class="cv-desc-list">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
      : bullets.length === 1
      ? `<p class="cv-desc">${esc(bullets[0])}</p>`
      : '';
    const dateSpan = proj.date ? `<span class="cv-dates">${esc(proj.date)}</span>` : '';
    if (style === 'academic') {
      return `
    <div class="ac-entry">
      <div class="ac-entry-header">
        <div>
          <div class="ac-role">${esc(proj.name || proj.title || '')}</div>
          ${proj.role ? `<div class="ac-org">${esc(proj.role)}${proj.organization ? ' · ' + esc(proj.organization) : ''}</div>` : ''}
          ${descHtml}
        </div>
        <div class="ac-dates">${esc(proj.date || '')}</div>
      </div>
    </div>`;
    }
    return `
    <div class="cv-entry">
      <div class="cv-entry-header">
        <span class="cv-role">${esc(proj.name || proj.title || '')}</span>
        ${dateSpan}
      </div>
      ${proj.role ? `<div class="cv-org">${esc(proj.role)}${proj.organization ? ' · ' + esc(proj.organization) : ''}</div>` : ''}
      ${descHtml}
    </div>`;
  }).join('\n');
}

// Compact one-liner for one-page / ATS.
function renderProjectsCompact(items) {
  if (!items || !items.length) return '';
  return items.map(proj => {
    const firstLine = descBullets(proj.description)[0] || '';
    return `
    <div class="cv-entry" style="margin-bottom:6px">
      <div class="cv-entry-header">
        <span class="cv-role">${esc(proj.name || proj.title || '')}</span>
        <span class="cv-dates">${esc(proj.date || '')}</span>
      </div>
      ${proj.role ? `<div class="cv-org">${esc(proj.role)}</div>` : ''}
      ${firstLine ? `<p class="cv-desc">${esc(firstLine)}</p>` : ''}
    </div>`;
  }).join('\n');
}

// International Resume style: bullet list under a project heading.
function renderProjectsIR(items) {
  if (!items || !items.length) return '';
  return items.map(proj => {
    const bullets = descBullets(proj.description);
    const bulletsHtml = bullets.length
      ? `<ul class="ir-bullets">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
      : '';
    return `
    <div class="ir-entry">
      <div class="ir-entry-header">
        <div>
          <span class="ir-role">${esc(proj.name || proj.title || '')}</span>
          ${proj.role ? `<span class="ir-sep"> · </span><span class="ir-org">${esc(proj.role)}</span>` : ''}
        </div>
        <span class="ir-dates">${esc(proj.date || '')}</span>
      </div>
      ${bulletsHtml}
    </div>`;
  }).join('\n');
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
  return items.slice(0, max).map(e => {
    const bullets = descBullets(e.description);
    const firstBullet = bullets[0] || '';
    const trimmed = firstBullet.length > 110 ? firstBullet.substring(0, 107) + '…' : firstBullet;
    return `
    <div class="op-entry">
      <div class="op-entry-header">
        <span class="op-role">${esc(e.title)}</span>
        <span class="op-dates">${esc(e.startDate)} – ${esc(e.endDate)}</span>
      </div>
      <div class="op-org">${esc(e.organization)}${e.location ? ' · ' + esc(e.location) : ''}</div>
      ${trimmed ? `<p class="op-desc">${esc(trimmed)}</p>` : ''}
    </div>`;
  }).join('');
}

function renderSkillsLimited(items, max) {
  return items.slice(0, max).map(s => `<span class="op-skill">${esc(s)}</span>`).join('');
}

// ─── International Resume renderers ──────────────────────────────────────────

function renderExperienceBullets(items) {
  if (!items.length) return '<p class="cv-empty">No experience entries yet.</p>';
  return items.map(e => {
    const bullets = descBullets(e.description);
    const bulletsHtml = bullets.length
      ? `<ul class="ir-bullets">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
      : '';
    return `
    <div class="ir-entry">
      <div class="ir-entry-header">
        <div>
          <span class="ir-role">${esc(e.title)}</span>
          <span class="ir-sep"> · </span>
          <span class="ir-org">${esc(e.organization)}${e.location ? ', ' + esc(e.location) : ''}</span>
        </div>
        <span class="ir-dates">${esc(e.startDate)} – ${esc(e.endDate)}</span>
      </div>
      ${bulletsHtml}
    </div>`;
  }).join('\n');
}

// Uses profile.skillGroups if present, otherwise falls back to two-row split.
function renderSkillsGrouped(items, skillGroups) {
  if (skillGroups && skillGroups.length) {
    return skillGroups.map(group => {
      const pills = group.skills.map(s => `<span class="ir-skill-tag">${esc(s)}</span>`).join('');
      return `<div class="ir-skills-group"><span class="ir-skills-label">${esc(group.label)}:</span> ${pills}</div>`;
    }).join('');
  }
  if (!items.length) return '<p class="cv-empty">No skills yet.</p>';
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

function renderPsPhotoBlock(p, assets, format) {
  const showPhoto = assets.profilePhotoExists &&
                    PHOTO_FORMATS.has(format) &&
                    (assets.privacy ? assets.privacy.showPhoto !== false : true);
  const displayName = `${p.firstName || ''} ${p.lastName || ''}`.trim();

  if (showPhoto) {
    return `<div class="ps-photo-wrap"><img src="${assets.profilePhotoDataUrl}" alt="${esc(displayName)}" class="ps-photo"></div>`;
  }

  const initials = displayName.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  if (!initials) return '';
  return `<div class="ps-photo-wrap"><div class="ps-initials">${initials}</div></div>`;
}

// Shows clean labels (LinkedIn / GitHub) rather than raw URLs to avoid line-wrapping issues.
function renderPsContact(p) {
  const lines = [];
  if (p.email)    lines.push(`<div class="ps-contact-line"><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>`);
  if (p.phone)    lines.push(`<div class="ps-contact-line">${esc(p.phone)}</div>`);
  if (p.linkedin) lines.push(`<div class="ps-contact-line"><a href="${esc(p.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a></div>`);
  if (p.github)   lines.push(`<div class="ps-contact-line"><a href="${esc(p.github)}" target="_blank" rel="noopener noreferrer">GitHub</a></div>`);
  if (!lines.length) lines.push(`<div class="ps-contact-line" style="color:#304c68">Add contact details in the app.</div>`);
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

function renderPsProjectsBlock(items) {
  if (!items || !items.length) return '';
  const entries = items.map(proj => {
    const bullets = descBullets(proj.description);
    const firstLine = bullets[0] || '';
    return `
    <div class="cv-entry">
      <div class="cv-entry-header">
        <span class="cv-role">${esc(proj.name || proj.title || '')}</span>
        ${proj.date ? `<span class="cv-dates">${esc(proj.date)}</span>` : ''}
      </div>
      ${proj.role ? `<div class="cv-org">${esc(proj.role)}</div>` : ''}
      ${firstLine ? `<p class="cv-desc">${esc(firstLine)}</p>` : ''}
    </div>`;
  }).join('\n');
  return `\n  <div class="main-sec">\n    <h2>Projects</h2>\n    ${entries}\n  </div>`;
}

module.exports = { generate, generateAll, renderHtml };
