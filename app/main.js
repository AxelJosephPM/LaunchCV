const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');

const profileStore    = require('./services/profileStore');
const cvGenerator     = require('./services/cvGenerator');
const pdfGenerator    = require('./services/pdfGenerator');
const webGenerator    = require('./services/webGenerator');
const qrGenerator     = require('./services/qrGenerator');
const vcardGenerator  = require('./services/vcardGenerator');
const backupService   = require('./services/backupService');
const validationService = require('./services/validationService');
const assetService    = require('./services/assetService');
const pagesPublisher  = require('./services/pagesPublisher');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    backgroundColor: '#0d1b2a',
    show: false,
    title: 'LaunchCV'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();
  // Copy root assets into renderer/assets/ on startup so the UI logo is available.
  try { assetService.getAssetInfo(); } catch (_) { /* non-fatal */ }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadProfileAndAssets(lang) {
  const profile               = profileStore.load(lang);
  const config                = profileStore.loadConfig();
  const { assets, warnings }  = assetService.getAssetInfo();
  const ctx = { ...assets, privacy: config.privacy || {} };
  return { profile, config, assets: ctx, assetWarnings: warnings };
}

// ─── IPC: Profile ────────────────────────────────────────────────────────────

ipcMain.handle('profile:load', async (_e, lang) => {
  try {
    return { ok: true, data: profileStore.load(lang) };
  } catch (err) {
    log('ERROR', 'profile:load', err.message);
    return { ok: false, error: 'Could not load profile data.' };
  }
});

ipcMain.handle('profile:save', async (_e, lang, data) => {
  try {
    const warnings = validationService.validate(data);
    profileStore.save(lang, data);
    log('INFO', 'profile:save', `Saved profile [${lang}]`);
    return { ok: true, warnings };
  } catch (err) {
    log('ERROR', 'profile:save', err.message);
    return { ok: false, error: 'Could not save the profile. Please try again.' };
  }
});

ipcMain.handle('config:load', async () => {
  try {
    return { ok: true, data: profileStore.loadConfig() };
  } catch (err) {
    return { ok: false, error: 'Could not load configuration.' };
  }
});

ipcMain.handle('config:save', async (_e, data) => {
  try {
    profileStore.saveConfig(data);
    return { ok: true };
  } catch (err) {
    log('ERROR', 'config:save', err.message);
    return { ok: false, error: 'Could not save configuration.' };
  }
});

// ─── IPC: HTML CV generation ──────────────────────────────────────────────────

ipcMain.handle('generate:cv', async (_e, format, lang) => {
  try {
    const { profile, assets } = loadProfileAndAssets(lang);
    const outPath = cvGenerator.generate(format, profile, assets);
    log('INFO', 'generate:cv', `Generated ${format} [${lang}] → ${outPath}`);
    return { ok: true, path: outPath };
  } catch (err) {
    log('ERROR', 'generate:cv', err.message);
    return { ok: false, error: `Could not generate the ${format} CV. ${err.message}` };
  }
});

ipcMain.handle('generate:all-cvs', async (_e, lang) => {
  try {
    const { profile, assets } = loadProfileAndAssets(lang);
    const { results } = await cvGenerator.generateAll(profile, assets);
    const failed = Object.values(results).filter(v => v && v.error);
    log('INFO', 'generate:all-cvs', `Generated all CVs [${lang}], ${failed.length} failed`);
    if (failed.length > 0) {
      return { ok: false, error: `${failed.length} format(s) failed: ${failed.map(f => f.error).join('; ')}` };
    }
    return { ok: true, results };
  } catch (err) {
    log('ERROR', 'generate:all-cvs', err.message);
    return { ok: false, error: 'Could not generate all CVs. ' + err.message };
  }
});

// ─── IPC: PDF generation ──────────────────────────────────────────────────────

ipcMain.handle('generate:pdf', async (_e, format, lang) => {
  try {
    const { profile, assets } = loadProfileAndAssets(lang);
    const html    = cvGenerator.renderHtml(format, profile, assets);
    const outPath = await pdfGenerator.generate(format, profile, html);
    log('INFO', 'generate:pdf', `Generated PDF ${format} → ${outPath}`);
    return { ok: true, path: outPath };
  } catch (err) {
    log('ERROR', 'generate:pdf', err.message);
    return { ok: false, error: `Could not generate ${format} PDF. ${err.message}` };
  }
});

ipcMain.handle('generate:all-pdfs', async (_e, lang) => {
  let profile, assets, assetWarnings;
  try {
    ({ profile, assets, assetWarnings } = loadProfileAndAssets(lang));
  } catch (err) {
    log('ERROR', 'generate:all-pdfs', err.message);
    return { ok: false, error: 'Could not load profile data. ' + err.message };
  }

  // Render all HTML once, then convert each to PDF sequentially.
  const { htmlMap } = await cvGenerator.generateAll(profile, assets);
  const results     = await pdfGenerator.generateAll(profile, htmlMap);

  const failed   = Object.entries(results).filter(([, v]) => v && v.error).map(([k]) => k);
  const warnings = [
    ...assetWarnings,
    ...(failed.length ? [`${failed.length} PDF(s) could not be generated: ${failed.join(', ')}`] : [])
  ];

  log('INFO', 'generate:all-pdfs', `Generated all PDFs [${lang}], failed: ${failed.join(', ') || 'none'}`);
  return {
    ok:       failed.length < Object.keys(results).length, // ok if at least one succeeded
    results,
    warnings: warnings.length ? warnings.join(' ') : null
  };
});

// ─── IPC: Web card, QR, vCard ─────────────────────────────────────────────────

ipcMain.handle('generate:webcard', async (_e, lang) => {
  try {
    const { profile, config, assets } = loadProfileAndAssets(lang);
    const outPath = await webGenerator.generate(profile, config, assets);
    log('INFO', 'generate:webcard', `Generated web card → ${outPath}`);
    return { ok: true, path: outPath };
  } catch (err) {
    log('ERROR', 'generate:webcard', err.message);
    return { ok: false, error: 'Could not generate the Web Card. ' + err.message };
  }
});

ipcMain.handle('generate:qr', async () => {
  try {
    const config = profileStore.loadConfig();
    const result = await qrGenerator.generate(config);
    log('INFO', 'generate:qr', `Generated QR → ${result.path}`);
    return { ok: true, ...result };
  } catch (err) {
    log('ERROR', 'generate:qr', err.message);
    return { ok: false, error: 'Could not generate the QR code. ' + err.message };
  }
});

ipcMain.handle('generate:vcard', async (_e, lang) => {
  try {
    const profile = profileStore.load(lang);
    const outPath = await vcardGenerator.generate(profile);
    log('INFO', 'generate:vcard', `Generated vCard → ${outPath}`);
    return { ok: true, path: outPath };
  } catch (err) {
    log('ERROR', 'generate:vcard', err.message);
    return { ok: false, error: 'Could not generate the vCard. ' + err.message };
  }
});

ipcMain.handle('generate:everything', async (_e, lang) => {
  let profile, config, assets, assetWarnings;
  try {
    ({ profile, config, assets, assetWarnings } = loadProfileAndAssets(lang));
  } catch (err) {
    log('ERROR', 'generate:everything', err.message);
    return { ok: false, error: 'Could not load profile data. ' + err.message };
  }

  const results = {};

  try {
    const { results: cvResults, htmlMap } = await cvGenerator.generateAll(profile, assets);
    results.cvs = cvResults;
    // PDFs reuse the already-rendered HTML
    results.pdfs = await pdfGenerator.generateAll(profile, htmlMap);
  } catch (e) { results.cvs = { error: e.message }; }

  try { results.webcard = await webGenerator.generate(profile, config, assets); } catch (e) { results.webcard = { error: e.message }; }
  try { results.qr      = await qrGenerator.generate(config);                  } catch (e) { results.qr      = { error: e.message }; }
  try { results.vcard   = await vcardGenerator.generate(profile);               } catch (e) { results.vcard   = { error: e.message }; }

  const failures = Object.entries(results)
    .filter(([, v]) => v && v.error)
    .map(([k]) => k);

  const allWarnings = [
    ...assetWarnings,
    ...(failures.length ? [`Some steps failed: ${failures.join(', ')}`] : [])
  ];

  log('INFO', 'generate:everything', `Full generation done, failed: ${failures.join(', ') || 'none'}`);
  return {
    ok:       true,
    results,
    warnings: allWarnings.length ? allWarnings.join(' ') : null
  };
});

// ─── IPC: Backup ─────────────────────────────────────────────────────────────

ipcMain.handle('backup:create', async () => {
  try {
    const backupPath = backupService.create();
    log('INFO', 'backup:create', `Backup created → ${backupPath}`);
    return { ok: true, path: backupPath };
  } catch (err) {
    log('ERROR', 'backup:create', err.message);
    return { ok: false, error: 'Could not create backup. ' + err.message };
  }
});

ipcMain.handle('backup:list', async () => {
  try {
    return { ok: true, backups: backupService.list() };
  } catch (err) {
    return { ok: false, error: 'Could not list backups.' };
  }
});

ipcMain.handle('backup:restore', async (_e, filename) => {
  try {
    backupService.restore(filename);
    log('INFO', 'backup:restore', `Restored from ${filename}`);
    return { ok: true };
  } catch (err) {
    log('ERROR', 'backup:restore', err.message);
    return { ok: false, error: 'Could not restore backup. ' + err.message };
  }
});

// ─── IPC: GitHub Pages publishing ────────────────────────────────────────────

ipcMain.handle('pages:prepare', async (_e, lang) => {
  try {
    const { profile, config, assets } = loadProfileAndAssets(lang);
    // Regenerate a fresh Web Card so docs/ always matches the current profile.
    await webGenerator.generate(profile, config, assets);
    const result = await pagesPublisher.publish(profile, config);
    log('INFO', 'pages:prepare',
      `Pages prepared → ${result.docsDir} | PDFs: ${result.copiedPdfs.length}`);
    return { ok: true, docsDir: result.docsDir, pdfCount: result.copiedPdfs.length };
  } catch (err) {
    log('ERROR', 'pages:prepare', err.message);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('pages:open-docs', async () => {
  const docsPath = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(docsPath)) {
    return { ok: false, error: 'docs/ folder does not exist. Prepare GitHub Pages first.' };
  }
  shell.openPath(docsPath);
  return { ok: true };
});

// ─── IPC: Filesystem helpers ─────────────────────────────────────────────────

ipcMain.handle('fs:open-output', async () => {
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  shell.openPath(outputDir);
  return { ok: true };
});

ipcMain.handle('fs:open-path', async (_e, p) => {
  const outputDir = path.resolve(path.join(__dirname, '..', 'output'));
  const resolved  = path.resolve(p);
  if (!resolved.startsWith(outputDir + path.sep) && resolved !== outputDir) {
    log('WARN', 'fs:open-path', `Rejected path outside output/: ${p}`);
    return { ok: false, error: 'Path is not inside the output folder.' };
  }
  shell.openPath(resolved);
  return { ok: true };
});

ipcMain.handle('fs:pick-backup', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select a backup to restore',
    defaultPath: path.join(__dirname, '..', 'backups'),
    filters: [{ name: 'LaunchCV Backups', extensions: ['zip', 'json'] }],
    properties: ['openFile']
  });
  if (result.canceled) return { ok: false };
  return { ok: true, filePath: result.filePaths[0] };
});

// ─── IPC: Asset status ────────────────────────────────────────────────────────

ipcMain.handle('assets:status', async () => {
  try {
    const { assets, warnings } = assetService.getAssetInfo();
    return { ok: true, hasPhoto: assets.hasPhoto, hasLogo: assets.hasLogo, warnings };
  } catch (err) {
    return { ok: false, hasPhoto: false, hasLogo: false, warnings: [err.message] };
  }
});

// ─── IPC: Preview ────────────────────────────────────────────────────────────

ipcMain.handle('preview:cv', async (_e, format, lang) => {
  try {
    const { profile, assets } = loadProfileAndAssets(lang);
    const html = cvGenerator.renderHtml(format, profile, assets);
    return { ok: true, html };
  } catch (err) {
    return { ok: false, error: 'Preview unavailable: ' + err.message };
  }
});

// ─── Logging ─────────────────────────────────────────────────────────────────

function log(level, ctx, msg) {
  const ts   = new Date().toISOString();
  const line = `[${ts}] [${level}] [${ctx}] ${msg}\n`;
  const logDir = path.join(__dirname, '..', 'output', 'Logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(path.join(logDir, 'launchcv.log'), line);
}
