/* ─── LaunchCV Renderer ────────────────────────────────────────────────────
   All DOM interaction, form binding, and IPC calls via window.launchcv
   ──────────────────────────────────────────────────────────────────────── */

const api = window.launchcv;

// ─── State ──────────────────────────────────────────────────────────────────

let currentLang   = 'en';
let profileData   = null;
let configData    = null;

// ─── Startup ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  setupNav();
  setupLangToggle();
  await loadAll();
  setupActionButtons();
  setupGenerateButtons();
  setupBackupButtons();
  loadBackupList();
});

async function loadAll() {
  const [profRes, cfgRes] = await Promise.all([
    api.loadProfile(currentLang),
    api.loadConfig()
  ]);
  if (profRes.ok) {
    profileData = profRes.data;
    fillForms(profileData);
  } else {
    showStatus('Could not load profile data. ' + profRes.error, 'error');
  }
  if (cfgRes.ok) {
    configData = cfgRes.data;
    fillConfig(configData);
  }
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const page = btn.dataset.page;
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(`page-${page}`)?.classList.add('active');
    });
  });
}

// ─── Language toggle ──────────────────────────────────────────────────────────

function setupLangToggle() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.lang === currentLang) return;
      currentLang = btn.dataset.lang;
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await loadAll();
      showStatus(`Switched to ${currentLang === 'en' ? 'English' : 'Spanish'} profile.`, 'success');
    });
  });
}

// ─── Fill forms from profile ──────────────────────────────────────────────────

function fillForms(p) {
  const pers = p.personal || {};
  setVal('firstName', pers.firstName);
  setVal('lastName',  pers.lastName);
  setVal('headline',  pers.headline);
  setVal('location',  pers.location);
  setVal('email',     pers.email);
  setVal('phone',     pers.phone);
  setVal('status',    pers.status);
  setVal('photo',     pers.photo);
  setVal('summary',   p.summary);

  setVal('link-linkedin', p.links?.linkedin || pers.linkedin);
  setVal('link-github',   p.links?.github   || pers.github);
  setVal('link-portfolio',p.links?.portfolio || pers.website);

  renderEducationList(p.education || []);
  renderExperienceList(p.experience || []);
  renderCertificationsList(p.certifications || []);
  renderLanguagesList(p.languages || []);
  setVal('skills-textarea', (p.skills || []).join('\n'));
}

function fillConfig(cfg) {
  const wc = cfg.webCard || {};
  setVal('webcard-url', wc.publicUrl);
  setVal('qr-target',   wc.qrTarget || 'card.html');
  setVal('github-user', wc.githubUser);
  setVal('repo-name',   wc.repoName);
  setVal('qr-size',     cfg.qr?.size || 300);

  const priv = cfg.privacy || {};
  setCheck('priv-email',      priv.showEmail);
  setCheck('priv-phone',      priv.showPhone);
  setCheck('priv-address',    priv.showAddress);
  setCheck('priv-photo',      priv.showPhoto);
  setCheck('priv-download',   priv.showDownloadButtons !== false);
  setCheck('priv-projects',   priv.showProjects !== false);
  setCheck('priv-experience', priv.showExperience !== false);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
function setCheck(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}

// ─── Collect forms into profile object ───────────────────────────────────────

function collectProfile() {
  const p = profileData ? JSON.parse(JSON.stringify(profileData)) : {};
  p.personal = p.personal || {};

  p.personal.firstName = getVal('firstName');
  p.personal.lastName  = getVal('lastName');
  p.personal.headline  = getVal('headline');
  p.personal.location  = getVal('location');
  p.personal.email     = getVal('email');
  p.personal.phone     = getVal('phone');
  p.personal.status    = getVal('status');
  p.personal.photo     = getVal('photo');
  p.summary            = getVal('summary');

  p.education     = collectEducation();
  p.experience    = collectExperience();
  p.certifications = collectCertifications();
  p.languages     = collectLanguages();
  p.skills        = collectSkills();

  p.personal.linkedin = getVal('link-linkedin');
  p.personal.github   = getVal('link-github');
  p.personal.website  = getVal('link-portfolio');
  p.links = {
    linkedin:  getVal('link-linkedin'),
    github:    getVal('link-github'),
    portfolio: getVal('link-portfolio'),
    other: p.links?.other || []
  };

  return p;
}

function collectConfig() {
  const cfg = configData ? JSON.parse(JSON.stringify(configData)) : {};
  cfg.webCard = cfg.webCard || {};
  cfg.webCard.publicUrl  = getVal('webcard-url');
  cfg.webCard.qrTarget   = getVal('qr-target');
  cfg.webCard.githubUser = getVal('github-user');
  cfg.webCard.repoName   = getVal('repo-name');
  cfg.qr = cfg.qr || {};
  cfg.qr.size = parseInt(getVal('qr-size')) || 300;
  cfg.privacy = {
    showEmail:           getCheck('priv-email'),
    showPhone:           getCheck('priv-phone'),
    showAddress:         getCheck('priv-address'),
    showPhoto:           getCheck('priv-photo'),
    showDownloadButtons: getCheck('priv-download'),
    showProjects:        getCheck('priv-projects'),
    showExperience:      getCheck('priv-experience')
  };
  return cfg;
}

function getVal(id)   { return document.getElementById(id)?.value?.trim() || ''; }
function getCheck(id) { return document.getElementById(id)?.checked || false; }

// ─── Dynamic list renderers ───────────────────────────────────────────────────

function renderEducationList(items) {
  const list = document.getElementById('education-list');
  list.innerHTML = '';
  items.forEach((item, i) => {
    list.appendChild(makeEntryCard(
      `Education ${i + 1}`,
      `<div class="form-grid two-col">
        <div class="form-group full-span"><label>Institution</label><input type="text" data-field="institution" value="${esc(item.institution)}"></div>
        <div class="form-group full-span"><label>Degree</label><input type="text" data-field="degree" value="${esc(item.degree)}"></div>
        <div class="form-group full-span"><label>Field of Study</label><input type="text" data-field="field" value="${esc(item.field)}"></div>
        <div class="form-group"><label>Start Date</label><input type="text" data-field="startDate" value="${esc(item.startDate)}"></div>
        <div class="form-group"><label>End Date</label><input type="text" data-field="endDate" value="${esc(item.endDate)}"></div>
        <div class="form-group"><label>Location</label><input type="text" data-field="location" value="${esc(item.location)}"></div>
        <div class="form-group"><label>Grade / GPA (optional)</label><input type="text" data-field="grade" value="${esc(item.grade)}"></div>
      </div>`,
      i, 'education'
    ));
  });
}

function renderExperienceList(items) {
  const list = document.getElementById('experience-list');
  list.innerHTML = '';
  items.forEach((item, i) => {
    list.appendChild(makeEntryCard(
      `Experience ${i + 1}`,
      `<div class="form-grid two-col">
        <div class="form-group full-span"><label>Job Title / Role</label><input type="text" data-field="title" value="${esc(item.title)}"></div>
        <div class="form-group full-span"><label>Organization</label><input type="text" data-field="organization" value="${esc(item.organization)}"></div>
        <div class="form-group"><label>Type</label><input type="text" data-field="type" value="${esc(item.type)}" placeholder="Full-time, Part-time..."></div>
        <div class="form-group"><label>Location</label><input type="text" data-field="location" value="${esc(item.location)}"></div>
        <div class="form-group"><label>Start Date</label><input type="text" data-field="startDate" value="${esc(item.startDate)}"></div>
        <div class="form-group"><label>End Date</label><input type="text" data-field="endDate" value="${esc(item.endDate)}"></div>
        <div class="form-group full-span"><label>Description</label><textarea data-field="description" rows="3">${esc(item.description)}</textarea></div>
      </div>`,
      i, 'experience'
    ));
  });
}

function renderCertificationsList(items) {
  const list = document.getElementById('certifications-list');
  list.innerHTML = '';
  items.forEach((item, i) => {
    list.appendChild(makeEntryCard(
      `Certification ${i + 1}`,
      `<div class="form-grid two-col">
        <div class="form-group full-span"><label>Certification Name</label><input type="text" data-field="name" value="${esc(item.name)}"></div>
        <div class="form-group"><label>Issuing Organization</label><input type="text" data-field="issuer" value="${esc(item.issuer)}"></div>
        <div class="form-group"><label>Date</label><input type="text" data-field="date" value="${esc(item.date)}"></div>
        <div class="form-group"><label>Credential ID (optional)</label><input type="text" data-field="credentialId" value="${esc(item.credentialId)}"></div>
        <div class="form-group"><label>URL (optional)</label><input type="url" data-field="url" value="${esc(item.url)}"></div>
      </div>`,
      i, 'certifications'
    ));
  });
}

function renderLanguagesList(items) {
  const list = document.getElementById('languages-list');
  list.innerHTML = '';
  items.forEach((item, i) => {
    list.appendChild(makeEntryCard(
      `Language ${i + 1}`,
      `<div class="form-grid two-col">
        <div class="form-group"><label>Language</label><input type="text" data-field="language" value="${esc(item.language)}"></div>
        <div class="form-group"><label>Level</label>
          <select data-field="level">
            ${['Native','C2','C1 (Advanced)','B2 (Upper Intermediate)','B1 (Intermediate)','A2 (Elementary)','A1 (Beginner)']
              .map(l => `<option value="${l}"${l === item.level ? ' selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>`,
      i, 'languages'
    ));
  });
}

function makeEntryCard(title, bodyHtml, index, type) {
  const div = document.createElement('div');
  div.className = 'entry-card';
  div.dataset.index = index;
  div.dataset.type  = type;
  div.innerHTML = `
    <div class="entry-card-header">
      <span class="entry-card-title">${title}</span>
      <button class="btn-remove-entry" data-index="${index}" data-type="${type}" title="Remove">✕</button>
    </div>
    ${bodyHtml}`;
  div.querySelector('.btn-remove-entry').addEventListener('click', (e) => {
    removeEntry(e.target.dataset.type, parseInt(e.target.dataset.index));
  });
  return div;
}

function removeEntry(type, index) {
  if (!profileData) return;
  // Flush current DOM state first so edits in sibling cards are not discarded.
  profileData.education      = collectEducation();
  profileData.experience     = collectExperience();
  profileData.certifications = collectCertifications();
  profileData.languages      = collectLanguages();
  const key = type === 'certifications' ? 'certifications' : type;
  if (!profileData[key]) return;
  profileData[key].splice(index, 1);
  if (type === 'education')      renderEducationList(profileData.education);
  if (type === 'experience')     renderExperienceList(profileData.experience);
  if (type === 'certifications') renderCertificationsList(profileData.certifications);
  if (type === 'languages')      renderLanguagesList(profileData.languages);
}

// ─── Collect array fields from DOM ───────────────────────────────────────────

function collectFromCards(listId, fields) {
  const cards = document.querySelectorAll(`#${listId} .entry-card`);
  return Array.from(cards).map((card, i) => {
    const obj = { id: `${listId.replace('-list', '')}_${i+1}` };
    fields.forEach(f => {
      const el = card.querySelector(`[data-field="${f}"]`);
      if (el) obj[f] = el.value.trim();
    });
    return obj;
  });
}

function collectEducation() {
  return collectFromCards('education-list', ['institution','degree','field','startDate','endDate','location','grade']);
}
const PRESENT_TOKENS = new Set(['Present', 'Presente', 'Actualidad', 'Current', 'Now', 'Hoy']);
function collectExperience() {
  const items = collectFromCards('experience-list', ['title','organization','type','location','startDate','endDate','description']);
  return items.map(e => ({ ...e, current: PRESENT_TOKENS.has(e.endDate) }));
}
function collectCertifications() {
  return collectFromCards('certifications-list', ['name','issuer','date','credentialId','url']);
}
function collectLanguages() {
  return collectFromCards('languages-list', ['language','level']);
}
function collectSkills() {
  const raw = getVal('skills-textarea');
  return raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
}

// ─── Add entry buttons ────────────────────────────────────────────────────────

function setupActionButtons() {
  document.getElementById('btn-add-education')?.addEventListener('click', () => {
    profileData.education = collectEducation();
    profileData.education.push({ institution:'', degree:'', field:'', startDate:'', endDate:'', location:'', grade:'' });
    renderEducationList(profileData.education);
  });
  document.getElementById('btn-add-experience')?.addEventListener('click', () => {
    profileData.experience = collectExperience();
    profileData.experience.push({ title:'', organization:'', type:'', location:'', startDate:'', endDate:'Present', description:'', current:true });
    renderExperienceList(profileData.experience);
  });
  document.getElementById('btn-add-certification')?.addEventListener('click', () => {
    profileData.certifications = collectCertifications();
    profileData.certifications.push({ name:'', issuer:'', date:'', credentialId:'', url:'' });
    renderCertificationsList(profileData.certifications);
  });
  document.getElementById('btn-add-language')?.addEventListener('click', () => {
    profileData.languages = collectLanguages();
    profileData.languages.push({ language:'', level:'B1 (Intermediate)' });
    renderLanguagesList(profileData.languages);
  });

  // Per-section save buttons
  document.getElementById('btn-save-personal')?.addEventListener('click', saveAll);
  document.getElementById('btn-save-education')?.addEventListener('click', saveAll);
  document.getElementById('btn-save-experience')?.addEventListener('click', saveAll);
  document.getElementById('btn-save-certifications')?.addEventListener('click', saveAll);
  document.getElementById('btn-save-languages')?.addEventListener('click', saveAll);
  document.getElementById('btn-save-skills')?.addEventListener('click', saveAll);
  document.getElementById('btn-save-links')?.addEventListener('click', saveAll);
  document.getElementById('btn-save-global')?.addEventListener('click', saveAll);
  document.getElementById('btn-save-privacy')?.addEventListener('click', saveConfigNow);
  document.getElementById('btn-save-webqr')?.addEventListener('click', saveConfigNow);
}

async function saveAll() {
  const profile = collectProfile();
  const res = await api.saveProfile(currentLang, profile);
  if (res.ok) {
    profileData = profile;
    if (res.warnings && res.warnings.length > 0) {
      showStatus('Profile saved. Note: ' + res.warnings[0], 'warning');
    } else {
      showStatus('Profile saved successfully.', 'success');
    }
  } else {
    showStatus('Could not save the profile. ' + res.error, 'error');
  }
}

async function saveConfigNow() {
  const cfg = collectConfig();
  const res = await api.saveConfig(cfg);
  if (res.ok) {
    configData = cfg;
    showStatus('Settings saved successfully.', 'success');
  } else {
    showStatus('Could not save settings. ' + res.error, 'error');
  }
}

// ─── Generate buttons ─────────────────────────────────────────────────────────

// Auto-saves profile before any generation so the output always matches what
// is currently visible on screen, not what was last manually saved.
async function autoSaveBeforeGenerate() {
  const profile = collectProfile();
  const res = await api.saveProfile(currentLang, profile);
  if (res.ok) profileData = profile;
  return res.ok;
}

async function checkAndShowAssetStatus() {
  const bar = document.getElementById('asset-status-bar');
  if (!bar) return;
  const res = await api.getAssetStatus();
  if (res.ok && res.warnings && res.warnings.length) {
    bar.textContent = res.warnings.join(' ');
    bar.classList.remove('hidden');
  } else {
    bar.classList.add('hidden');
  }
}

function setupGenerateButtons() {
  // Show asset warnings whenever the Generate page becomes active.
  document.querySelector('.nav-btn[data-page="generate"]')?.addEventListener('click', checkAndShowAssetStatus);

  document.getElementById('btn-gen-selected')?.addEventListener('click', async () => {
    const selected = Array.from(document.querySelectorAll('.cv-check:checked')).map(c => c.value);
    if (!selected.length) { showStatus('No CV formats selected.', 'warning'); return; }
    showStatus('Saving and generating selected CVs (HTML)...', 'warning');
    await autoSaveBeforeGenerate();
    let ok = 0, fail = 0;
    for (const fmt of selected) {
      const res = await api.generateCV(fmt, currentLang);
      res.ok ? ok++ : fail++;
    }
    showStatus(
      fail === 0
        ? `${ok} HTML CV file(s) generated successfully.`
        : `${ok} generated, ${fail} failed. Check output folder.`,
      fail === 0 ? 'success' : 'warning'
    );
  });

  document.getElementById('btn-gen-all-cvs')?.addEventListener('click', async () => {
    showStatus('Saving and generating all CV formats (HTML)...', 'warning');
    await autoSaveBeforeGenerate();
    const res = await api.generateAllCVs(currentLang);
    showStatus(res.ok ? 'All CV HTML files have been generated.' : 'Error: ' + res.error, res.ok ? 'success' : 'error');
  });

  // ── PDF generation buttons ────────────────────────────────────────────────

  document.getElementById('btn-gen-selected-pdf')?.addEventListener('click', async () => {
    const selected = Array.from(document.querySelectorAll('.cv-check:checked')).map(c => c.value);
    if (!selected.length) { showStatus('No CV formats selected.', 'warning'); return; }
    showStatus(`Generating ${selected.length} PDF(s)... this may take a moment.`, 'warning');
    await autoSaveBeforeGenerate();
    let ok = 0, fail = 0;
    for (const fmt of selected) {
      const res = await api.generatePDF(fmt, currentLang);
      res.ok ? ok++ : fail++;
    }
    showStatus(
      fail === 0
        ? `${ok} PDF file(s) generated successfully. Check output/PDF/`
        : `${ok} PDFs saved, ${fail} could not be generated. Check the output folder.`,
      fail === 0 ? 'success' : 'warning'
    );
  });

  document.getElementById('btn-gen-all-pdfs')?.addEventListener('click', async () => {
    showStatus('Generating all PDF files... this may take a moment.', 'warning');
    await autoSaveBeforeGenerate();
    const res = await api.generateAllPDFs(currentLang);
    if (!res.ok && !res.results) {
      showStatus('Could not generate PDFs. ' + res.error, 'error');
    } else if (res.warnings) {
      showStatus('PDF files generated. ' + res.warnings, 'warning');
    } else {
      showStatus('All PDF files generated successfully. Check output/PDF/', 'success');
    }
  });

  // ── Other outputs ─────────────────────────────────────────────────────────

  document.getElementById('btn-gen-webcard')?.addEventListener('click', async () => {
    showStatus('Saving and generating Web Card...', 'warning');
    await autoSaveBeforeGenerate();
    const res = await api.generateWebCard(currentLang);
    showStatus(res.ok ? 'Your Web Card has been generated successfully.' : 'Error: ' + res.error, res.ok ? 'success' : 'error');
  });

  document.getElementById('btn-gen-qr')?.addEventListener('click', async () => {
    showStatus('Generating QR code...', 'warning');
    const res = await api.generateQR();
    if (res.ok) {
      showStatus(res.warning ? 'QR generated. Warning: ' + res.warning : 'QR code generated successfully.', res.warning ? 'warning' : 'success');
    } else {
      showStatus('Error: ' + res.error, 'error');
    }
  });

  document.getElementById('btn-gen-vcard')?.addEventListener('click', async () => {
    showStatus('Saving and generating vCard...', 'warning');
    await autoSaveBeforeGenerate();
    const res = await api.generateVCard(currentLang);
    showStatus(res.ok ? 'Contact file (vCard) generated successfully.' : 'Error: ' + res.error, res.ok ? 'success' : 'error');
  });

  document.getElementById('btn-gen-everything')?.addEventListener('click', async () => {
    showStatus('Saving and generating all files (HTML + PDF + Web + QR + vCard)...', 'warning');
    await autoSaveBeforeGenerate();
    const res = await api.generateEverything(currentLang);
    if (!res.ok) {
      showStatus('Error: ' + res.error, 'error');
    } else if (res.warnings) {
      showStatus('Files generated. ' + res.warnings, 'warning');
    } else {
      showStatus('All files generated successfully. Open the output folder to review them.', 'success');
    }
  });

  document.getElementById('btn-open-output')?.addEventListener('click', async () => {
    await api.openOutputFolder();
  });

  // GitHub Pages publishing
  document.getElementById('btn-prepare-pages')?.addEventListener('click', async () => {
    showStatus('Saving profile and preparing GitHub Pages website…', 'warning');
    await autoSaveBeforeGenerate();
    const cfg = collectConfig();
    const cfgRes = await api.saveConfig(cfg);
    if (cfgRes.ok) configData = cfg;
    const res = await api.preparePages(currentLang);
    if (res.ok) {
      showStatus(
        `GitHub Pages website prepared in docs/ (${res.pdfCount} PDF(s) included). ` +
        'Enable GitHub Pages in your repo settings: Settings → Pages → master → /docs',
        'success'
      );
    } else {
      showStatus('Could not prepare GitHub Pages: ' + res.error, 'error');
    }
  });

  document.getElementById('btn-open-docs')?.addEventListener('click', async () => {
    const res = await api.openDocsFolder();
    if (!res.ok) showStatus(res.error, 'warning');
  });

  // Preview
  document.getElementById('btn-refresh-preview')?.addEventListener('click', refreshPreview);
  document.getElementById('page-preview')?.addEventListener('click', (e) => {
    if (e.target.closest('.nav-btn[data-page="preview"]')) refreshPreview();
  });
}

async function refreshPreview() {
  const format = document.getElementById('preview-format-select')?.value || 'harvard';
  const res = await api.previewCV(format, currentLang);
  const frame = document.getElementById('preview-frame');
  if (res.ok && frame) {
    frame.srcdoc = res.html;
  } else {
    showStatus('Preview unavailable: ' + res.error, 'warning');
  }
}

// ─── Backup ───────────────────────────────────────────────────────────────────

function setupBackupButtons() {
  document.getElementById('btn-create-backup')?.addEventListener('click', async () => {
    const res = await api.createBackup();
    if (res.ok) {
      showStatus('Backup created successfully.', 'success');
      loadBackupList();
    } else {
      showStatus('Could not create backup. ' + res.error, 'error');
    }
  });

  document.getElementById('btn-refresh-backups')?.addEventListener('click', loadBackupList);

  document.getElementById('btn-restore-selected')?.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="backup-select"]:checked');
    if (!selected) { showStatus('Please select a backup to restore.', 'warning'); return; }
    const res = await api.restoreBackup(selected.value);
    if (res.ok) {
      showStatus('Backup restored successfully. Reloading profile...', 'success');
      await loadAll();
    } else {
      showStatus('Could not restore: ' + res.error, 'error');
    }
  });
}

async function loadBackupList() {
  const container = document.getElementById('backup-list');
  if (!container) return;
  const res = await api.listBackups();
  if (!res.ok || res.backups.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">No backups found yet.</p>';
    return;
  }
  container.innerHTML = res.backups.map((b, i) => `
    <div class="backup-item">
      <input type="radio" name="backup-select" id="bk${i}" value="${esc(b.name)}" ${i === 0 ? 'checked' : ''}>
      <label for="bk${i}">${esc(b.date)} — ${esc(b.name)}</label>
    </div>`).join('');
}

// ─── Status bar ───────────────────────────────────────────────────────────────

let _statusTimer = null;

function showStatus(msg, type = 'success') {
  const bar = document.getElementById('status-bar');
  if (!bar) return;
  bar.textContent = msg;
  bar.className   = `status-bar ${type}`;
  if (_statusTimer) clearTimeout(_statusTimer);
  _statusTimer = setTimeout(() => bar.classList.add('hidden'), 4500);
}

// ─── HTML escape ──────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
