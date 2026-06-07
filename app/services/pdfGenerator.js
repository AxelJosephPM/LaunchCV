// PDF generation via Electron's webContents.printToPDF().
// A hidden BrowserWindow loads each rendered CV HTML, then exports to PDF.
// No external tools required; works fully offline.

const { BrowserWindow } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const FORMAT_LABELS = {
  harvard:         'CV_Harvard',
  ats:             'CV_ATS',
  modern:          'CV_Modern',
  european:        'CV_European',
  academic:        'CV_Academic',
  'one-page':      'CV_OnePage',
  international:   'Resume_International',
  'photo-sidebar': 'CV_PhotoSidebar'
};

const outputPDF = path.join(__dirname, '..', '..', 'output', 'PDF');

// ─── Core converter ───────────────────────────────────────────────────────────

async function htmlToPdf(html, outPath) {
  if (!fs.existsSync(outputPDF)) fs.mkdirSync(outputPDF, { recursive: true });

  const tmpFile = path.join(os.tmpdir(), `launchcv_${Date.now()}.html`);
  let   win     = null;

  try {
    fs.writeFileSync(tmpFile, html, 'utf8');

    win = new BrowserWindow({
      show: false,
      width:  900,
      height: 1200,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration:  false,
        sandbox:          false   // required for reliable local file loading in PDF windows
      }
    });

    // Load the temp HTML and wait for it to finish rendering.
    await Promise.race([
      new Promise((resolve, reject) => {
        win.webContents.once('did-finish-load', resolve);
        win.webContents.once('did-fail-load', (_e, code, desc) =>
          reject(new Error(`Page load failed (${code}): ${desc}`)));
        win.loadFile(tmpFile);
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('PDF page load timed out after 20s')), 20000))
    ]);

    // Brief pause to let CSS paint fully (fonts, backgrounds, layout).
    await new Promise(r => setTimeout(r, 400));

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize:        'A4',
      printBackground: true,
      margins:         { marginType: 'default' },
      preferCSSPageSize: true
    });

    fs.writeFileSync(outPath, pdfBuffer);
    return outPath;

  } finally {
    if (win && !win.isDestroyed()) win.destroy();
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch (_) { /* best effort */ }
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function generate(format, profile, html) {
  const label = FORMAT_LABELS[format];
  if (!label) throw new Error(`Unknown CV format for PDF: ${format}`);

  const fn   = (profile.personal.firstName || '').replace(/\s+/g, '_');
  const ln   = (profile.personal.lastName  || '').replace(/\s+/g, '_');
  const name = `${fn}_${ln}_${label}.pdf`;

  return htmlToPdf(html, path.join(outputPDF, name));
}

async function generateAll(profile, htmlMap) {
  const results = {};
  for (const [format, html] of Object.entries(htmlMap)) {
    try {
      results[format] = await generate(format, profile, html);
    } catch (e) {
      results[format] = { error: e.message };
    }
  }
  return results;
}

module.exports = { generate, generateAll };
