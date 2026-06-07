const path = require('path');
const fs   = require('fs');
const assetService = require('./assetService');

const outputWeb        = path.join(__dirname, '..', '..', 'output', 'Web');
const outputPdfDir     = path.join(__dirname, '..', '..', 'output', 'PDF');
const templatesWeb     = path.join(__dirname, '..', 'templates', 'web');

const DEFAULT_TAGLINE =
  'Student in Aerospace Engineering focused on space systems, avionics, power systems integration and student-led aerospace projects.';

const EXPERIENCE_BULLETS = [
  'Leads avionics and power systems integration work within a student satellite project.',
  'Supports subsystem interface definition, documentation and integration planning.',
  'Works in a multidisciplinary aerospace student team.'
];

const CV_GROUPS = [
  {
    title: 'Recommended / General',
    items: [
      { suffix: '_CV_Harvard.pdf', label: 'Harvard CV', description: 'For scholarships, programs and formal applications.' },
      { suffix: '_CV_OnePage.pdf', label: 'One-page CV', description: 'Compact version for quick sharing.' }
    ]
  },
  {
    title: 'For job portals',
    items: [
      { suffix: '_CV_ATS.pdf', label: 'ATS CV', description: 'For job portals and automatic screening.' }
    ]
  },
  {
    title: 'For visual sharing',
    items: [
      { suffix: '_CV_Modern.pdf', label: 'Modern CV', description: 'Visual professional version.' },
      { suffix: '_CV_PhotoSidebar.pdf', label: 'Photo Sidebar CV', description: 'Visual CV with side photo.' }
    ]
  },
  {
    title: 'Academic / International',
    items: [
      { suffix: '_CV_Academic.pdf', label: 'Academic CV', description: 'For professors, research groups and academic programs.' },
      { suffix: '_CV_European.pdf', label: 'European CV', description: 'For European or institutional applications.' },
      { suffix: '_Resume_International.pdf', label: 'International Resume', description: 'Industry-focused English resume.' }
    ]
  }
];

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitize(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-]/g, '_');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return [];
  ensureDir(dest);
  const copied = [];
  for (const file of fs.readdirSync(src)) {
    const srcFile = path.join(src, file);
    if (!fs.statSync(srcFile).isFile()) continue;
    const safeName = sanitize(file);
    fs.copyFileSync(srcFile, path.join(dest, safeName));
    copied.push({ original: file, sanitized: safeName });
  }
  return copied;
}

function vcardEscape(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function writePublicVcard(profile, privacy) {
  const p = profile.personal || {};
  const links = profile.links || {};
  const linkedinUrl = linkAllowed(privacy, 'showLinkedIn') ? links.linkedin || p.linkedin || '' : '';
  const githubUrl = linkAllowed(privacy, 'showGitHub') ? links.github || p.github || '' : '';
  const websiteUrl = links.portfolio || p.website || '';
  const filename = sanitize(`${p.firstName || 'Contact'}_${p.lastName || ''}.vcf`.replace(/\s+/g, '_'));
  const contactDir = path.join(outputWeb, 'Contact');
  ensureDir(contactDir);

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${vcardEscape(`${p.firstName || ''} ${p.lastName || ''}`.trim())}`,
    `N:${vcardEscape(p.lastName)};${vcardEscape(p.firstName)};;;`,
    p.headline ? `TITLE:${vcardEscape(p.headline)}` : '',
    privacy.showEmail && p.email ? `EMAIL;TYPE=INTERNET:${vcardEscape(p.email)}` : '',
    privacy.showPhone && p.phone ? `TEL;TYPE=CELL:${vcardEscape(p.phone)}` : '',
    privacy.showAddress && p.address ? `ADR;TYPE=HOME:;;${vcardEscape(p.address)};;;;` : '',
    linkedinUrl ? `URL;TYPE=LinkedIn:${vcardEscape(linkedinUrl)}` : '',
    githubUrl ? `URL;TYPE=GitHub:${vcardEscape(githubUrl)}` : '',
    websiteUrl ? `URL;TYPE=Website:${vcardEscape(websiteUrl)}` : '',
    profile.summary ? `NOTE:${vcardEscape(profile.summary)}` : '',
    'END:VCARD'
  ].filter(Boolean);

  fs.writeFileSync(path.join(contactDir, filename), lines.join('\r\n'), 'utf8');
  return { original: filename, sanitized: filename };
}

function copyDownloadAssets(profile, privacy) {
  const copiedPdfs = privacy.showDownloadButtons === false
    ? []
    : copyDir(outputPdfDir, path.join(outputWeb, 'assets', 'cv'))
      .filter(({ sanitized }) => sanitized.toLowerCase().endsWith('.pdf'));
  const copiedContacts = [writePublicVcard(profile, privacy)];
  return { copiedPdfs, copiedContacts };
}

async function generate(profile, config, assets = {}) {
  if (fs.existsSync(outputWeb)) fs.rmSync(outputWeb, { recursive: true, force: true });
  ensureDir(outputWeb);

  const privacy = config.privacy || {};
  assetService.copyToWebOutput(outputWeb);
  const downloads = copyDownloadAssets(profile, privacy);

  let indexTmpl = fs.readFileSync(path.join(templatesWeb, 'index.html'), 'utf8');
  indexTmpl = applyLanding(indexTmpl, profile, config, privacy, assets, downloads);
  fs.writeFileSync(path.join(outputWeb, 'index.html'), indexTmpl, 'utf8');

  let cardTmpl = fs.readFileSync(path.join(templatesWeb, 'card.html'), 'utf8');
  cardTmpl = applyCardRedirect(cardTmpl, profile);
  fs.writeFileSync(path.join(outputWeb, 'card.html'), cardTmpl, 'utf8');

  return outputWeb;
}

function getFullName(profile) {
  const p = profile.personal || {};
  return `${p.firstName || ''} ${p.lastName || ''}`.trim();
}

function initials(fullName) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'PC';
}

function linkAllowed(privacy, key) {
  return privacy[key] !== false;
}

function renderPhoto(profile, privacy, assets) {
  const fullName = esc(getFullName(profile));
  const showPhoto = assets.profilePhotoExists && privacy.showPhoto !== false;
  if (showPhoto) {
    return `<img src="assets/pablo-profile.jpg" alt="Profile photo of ${fullName}" class="photo">`;
  }
  return `<div class="photo-placeholder" aria-label="${fullName}">${esc(initials(fullName))}</div>`;
}

function getPrimaryCv(downloads) {
  return downloads.copiedPdfs.find(file => file.sanitized.endsWith('_CV_Harvard.pdf')) ||
    downloads.copiedPdfs.find(file => file.sanitized.endsWith('_CV_OnePage.pdf')) ||
    downloads.copiedPdfs[0];
}

function getVcard(profile, downloads) {
  const p = profile.personal || {};
  const expected = sanitize(`${p.firstName || ''}_${p.lastName || ''}.vcf`);
  return downloads.copiedContacts.find(file => file.sanitized === expected) ||
    downloads.copiedContacts[0] ||
    { sanitized: expected };
}

function renderHeroActions(profile, privacy, downloads) {
  const p = profile.personal || {};
  const links = profile.links || {};
  const items = [];
  const primaryCv = getPrimaryCv(downloads);
  const vcard = getVcard(profile, downloads);
  const linkedin = links.linkedin || p.linkedin || '';
  const github = links.github || p.github || '';

  if (privacy.showDownloadButtons !== false && primaryCv) {
    items.push(`<a class="button primary" href="assets/cv/${esc(primaryCv.sanitized)}" download>Download CV</a>`);
  }
  if (linkAllowed(privacy, 'showLinkedIn') && linkedin) {
    items.push(`<a class="button secondary" href="${esc(linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`);
  }
  if (linkAllowed(privacy, 'showGitHub') && github) {
    items.push(`<a class="button secondary" href="${esc(github)}" target="_blank" rel="noopener noreferrer">GitHub</a>`);
  }
  items.push(`<a class="button secondary" href="Contact/${esc(vcard.sanitized)}" download>Save Contact</a>`);

  return items.join('\n          ');
}

function renderContactActions(profile, privacy, downloads) {
  const p = profile.personal || {};
  const links = profile.links || {};
  const items = [];
  const linkedin = links.linkedin || p.linkedin || '';
  const github = links.github || p.github || '';
  const vcard = getVcard(profile, downloads);

  if (linkAllowed(privacy, 'showLinkedIn') && linkedin) {
    items.push(`<a class="button secondary" href="${esc(linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`);
  }
  if (linkAllowed(privacy, 'showGitHub') && github) {
    items.push(`<a class="button secondary" href="${esc(github)}" target="_blank" rel="noopener noreferrer">GitHub</a>`);
  }
  if (privacy.showEmail && p.email) {
    items.push(`<a class="button secondary" href="mailto:${esc(p.email)}">Email</a>`);
  }
  if (privacy.showPhone && p.phone) {
    items.push(`<a class="button secondary" href="tel:${esc(p.phone)}">Phone</a>`);
  }
  items.push(`<a class="button primary" href="Contact/${esc(vcard.sanitized)}" download>Save contact (.vcf)</a>`);

  return items.join('\n          ');
}

function renderExperience(profile, privacy) {
  if (privacy.showExperience === false) return '';
  const exp = (profile.experience || []).find(e => e.current) || profile.experience?.[0];
  if (!exp) return '';

  const bullets = EXPERIENCE_BULLETS.map(text => `<li>${esc(text)}</li>`).join('\n            ');
  const projectLabel = /S-ART/i.test(exp.description || '') ? 'S-ART Student Satellite Project' : 'Current project';

  return `<section id="experience" aria-labelledby="experience-title">
        <p class="section-title">Current Role</p>
        <h2 class="section-heading" id="experience-title">Experience highlight</h2>
        <article class="experience-card">
          <h3 class="role-title">${esc(exp.title)}</h3>
          <p class="role-meta">${esc(exp.organization)} · ${esc(projectLabel)}</p>
          <ul class="bullet-list">
            ${bullets}
          </ul>
        </article>
      </section>`;
}

function normalizeProject(project) {
  const tags = Array.isArray(project.tags) && project.tags.length
    ? project.tags
    : ['CubeSat', 'Student Satellite', 'Avionics', 'Power Systems', 'Systems Engineering', 'Technical Documentation'];
  return { ...project, tags };
}

function renderProjects(profile, privacy) {
  if (privacy.showProjects === false) return '';
  const projects = (profile.projects || []).map(normalizeProject);
  if (!projects.length) return '';

  const cards = projects.map(project => {
    const tags = project.tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('\n              ');
    const role = project.role ? `<p class="role-meta">${esc(project.role)} · ${esc(project.organization || '')}</p>` : '';
    const link = project.url
      ? `<p><a class="project-link" href="${esc(project.url)}" target="_blank" rel="noopener noreferrer">View project</a></p>`
      : '';
    return `<article class="project-card">
            <h3 class="role-title">${esc(project.name)}</h3>
            ${role}
            <p class="project-description">${esc(project.description).replace(/\n+/g, ' ')}</p>
            <div class="tags">
              ${tags}
            </div>
            ${link}
          </article>`;
  }).join('\n');

  return `<section id="projects" aria-labelledby="projects-title">
        <p class="section-title">Projects</p>
        <h2 class="section-heading" id="projects-title">Student aerospace work</h2>
        <div class="project-grid">
          ${cards}
        </div>
      </section>`;
}

function renderCvSection(privacy, downloads) {
  if (privacy.showDownloadButtons === false) return '';
  if (!downloads.copiedPdfs.length) {
    return `<section id="cvs" aria-labelledby="cvs-title">
        <p class="section-title">CV Downloads</p>
        <h2 class="section-heading" id="cvs-title">Choose the right format</h2>
        <p class="empty-note">PDF downloads will appear here after CV PDFs are generated.</p>
      </section>`;
  }

  const bySuffix = new Map();
  for (const pdf of downloads.copiedPdfs) {
    for (const group of CV_GROUPS) {
      for (const item of group.items) {
        if (pdf.sanitized.endsWith(item.suffix)) bySuffix.set(item.suffix, pdf);
      }
    }
  }

  const groupsHtml = CV_GROUPS.map(group => {
    const links = group.items
      .filter(item => bySuffix.has(item.suffix))
      .map(item => {
        const pdf = bySuffix.get(item.suffix);
        return `<a class="cv-link" href="assets/cv/${esc(pdf.sanitized)}" download>
              <strong>${esc(item.label)}</strong>
              <span>${esc(item.description)}</span>
            </a>`;
      })
      .join('\n            ');
    if (!links) return '';
    return `<div class="cv-group">
          <h3>${esc(group.title)}</h3>
          <div class="cv-links">
            ${links}
          </div>
        </div>`;
  }).filter(Boolean).join('\n        ');

  return `<section id="cvs" aria-labelledby="cvs-title">
        <p class="section-title">CV Downloads</p>
        <h2 class="section-heading" id="cvs-title">Choose the right format</h2>
        <div class="cv-groups">
          ${groupsHtml}
        </div>
      </section>`;
}

function applyLanding(html, profile, config, privacy, assets, downloads) {
  const p = profile.personal || {};
  const fullName = getFullName(profile);
  const lang = profile.meta?.language || config.activeLanguage || 'en';
  const tagline = p.tagline || profile.tagline || DEFAULT_TAGLINE;
  const showLocation = privacy.showAddress !== false && p.location;
  const status = p.status || 'Open to work';
  const showPhoto = assets.profilePhotoExists && privacy.showPhoto !== false;

  const replacements = {
    '{{LANG}}': esc(lang),
    '{{FULL_NAME}}': esc(fullName),
    '{{HEADLINE}}': esc(p.headline),
    '{{SUMMARY}}': esc(profile.summary),
    '{{TAGLINE}}': esc(tagline),
    '{{OG_IMAGE}}': showPhoto ? '<meta property="og:image" content="assets/pablo-profile.jpg">' : '',
    '{{PROFILE_PHOTO_BLOCK}}': renderPhoto(profile, privacy, assets),
    '{{LOCATION_PILL}}': showLocation ? `<span class="pill">${esc(p.location)}</span>` : '',
    '{{STATUS_PILL}}': status ? `<span class="pill open">${esc(status)}</span>` : '',
    '{{HERO_ACTIONS}}': renderHeroActions(profile, privacy, downloads),
    '{{CONTACT_ACTIONS}}': renderContactActions(profile, privacy, downloads),
    '{{EXPERIENCE_SECTION}}': renderExperience(profile, privacy),
    '{{PROJECTS_SECTION}}': renderProjects(profile, privacy),
    '{{CV_SECTION}}': renderCvSection(privacy, downloads),
    '{{NAV_EXPERIENCE}}': privacy.showExperience === false ? '' : '<a href="#experience">Experience</a>',
    '{{NAV_PROJECTS}}': privacy.showProjects === false ? '' : '<a href="#projects">Projects</a>',
    '{{NAV_CVS}}': privacy.showDownloadButtons === false ? '' : '<a href="#cvs">CVs</a>'
  };

  let result = html;
  for (const [k, v] of Object.entries(replacements)) {
    result = result.split(k).join(v);
  }
  return result;
}

function applyCardRedirect(html, profile) {
  const lang = profile.meta?.language || 'en';
  return html.split('{{LANG}}').join(esc(lang));
}

module.exports = { generate };
