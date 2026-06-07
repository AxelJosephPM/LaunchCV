# LaunchCV — Developer Manual

Version 1.1

---

## Requirements

- Node.js 18+ (LTS recommended)
- npm 9+
- Git
- Linux dev machine with a display (`:0` or xvfb) for Electron

---

## Setup

```bash
git clone <repo-url>
cd LaunchCV
npm install
npm run dev
```

`npm run dev` launches the Electron app. On Linux, set `DISPLAY=:0` if needed.

---

## Root Assets

Place these two files in the repository root before running the app:

| File | Purpose |
|---|---|
| `pablo-profile.jpg` | Profile photo — auto-copied to `app/renderer/assets/` and `output/Web/assets/` |
| `launchcv-logo.png` | App logo — replaces the sidebar icon and appears in the Web Card |

Both are optional. If missing, the app runs without them and shows a friendly warning in the Generate section.
The asset service (`app/services/assetService.js`) handles detection, MIME probing, copying, and base64 encoding.

---

## Project Structure

```
LaunchCV/
├── pablo-profile.jpg        ← Profile photo (place here, gitignored)
├── launchcv-logo.png        ← Logo (place here, gitignored)
├── app/
│   ├── main.js              ← Electron main process, all IPC handlers
│   ├── preload.js           ← Secure contextBridge → window.launchcv
│   ├── renderer/
│   │   ├── index.html       ← UI shell (sidebar + all pages)
│   │   ├── styles.css       ← All UI styles
│   │   ├── app.js           ← DOM logic, form collection, IPC calls
│   │   └── assets/          ← Copied logo and photo for the app UI
│   ├── templates/
│   │   ├── cv/              ← HTML CV templates (one per format; 8 formats)
│   │   └── web/             ← Web Card templates (card.html, index.html)
│   ├── services/
│   │   ├── profileStore.js      ← Read/write profile and config JSON
│   │   ├── cvGenerator.js       ← Render HTML CVs, expose FORMAT_MAP
│   │   ├── pdfGenerator.js      ← PDF via Electron printToPDF (hidden window)
│   │   ├── webGenerator.js      ← Render Web Card, copy assets to output/Web/
│   │   ├── qrGenerator.js       ← QR code PNG (qrcode npm package)
│   │   ├── vcardGenerator.js    ← .vcf contact file
│   │   ├── assetService.js      ← Asset detection, copying, base64 encoding
│   │   ├── backupService.js     ← Timestamped backup create/list/restore
│   │   ├── validationService.js ← Profile field validation
│   │   ├── docxGenerator.js     ← Placeholder (not implemented)
│   │   └── zipExportService.js  ← Placeholder (not implemented)
│   └── data/
│       ├── profile.en.json  ← English profile
│       ├── profile.es.json  ← Spanish profile
│       └── config.json      ← App config and privacy settings
├── output/                  ← All generated files
│   ├── HTML/                ← CV HTML files (one subfolder per format)
│   ├── PDF/                 ← CV PDF files (all formats, flat)
│   ├── Web/                 ← Web Card (card.html, index.html, assets/)
│   ├── QR/                  ← QR code PNG
│   ├── Contact/             ← vCard .vcf
│   └── Logs/                ← Internal log (launchcv.log)
├── backups/                 ← Timestamped backup folders
├── manual/                  ← User and developer documentation
└── .gitignore
```

---

## Electron Architecture

### Main Process (`app/main.js`)

- Creates the main BrowserWindow with sandbox and contextIsolation.
- Loads `assetService.getAssetInfo()` on startup to copy root assets to renderer/assets/.
- All IPC handlers live here. Services are called from handlers, never from renderer directly.
- `loadProfileAndAssets(lang)` is a helper used by all generation handlers.
- Logs to `output/Logs/launchcv.log`.

### Preload (`app/preload.js`)

Exposes `window.launchcv` via `contextBridge`. No Node globals leak to renderer.

### Renderer (`app/renderer/app.js`)

Pure DOM + `window.launchcv.*` calls. `autoSaveBeforeGenerate()` saves profile to disk before every generation so the rendered output always matches the screen.

---

## IPC Channel Reference

| Channel | Args | Returns |
|---|---|---|
| `profile:load` | `lang` | `{ ok, data }` |
| `profile:save` | `lang, data` | `{ ok, warnings }` |
| `config:load` | — | `{ ok, data }` |
| `config:save` | `data` | `{ ok }` |
| `generate:cv` | `format, lang` | `{ ok, path }` |
| `generate:all-cvs` | `lang` | `{ ok, results }` |
| `generate:pdf` | `format, lang` | `{ ok, path }` |
| `generate:all-pdfs` | `lang` | `{ ok, results, warnings }` |
| `generate:webcard` | `lang` | `{ ok, path }` |
| `generate:qr` | — | `{ ok, path, url, warning }` |
| `generate:vcard` | `lang` | `{ ok, path }` |
| `generate:everything` | `lang` | `{ ok, results, warnings }` |
| `assets:status` | — | `{ ok, hasPhoto, hasLogo, warnings }` |
| `preview:cv` | `format, lang` | `{ ok, html }` |
| `backup:create` | — | `{ ok, path }` |
| `backup:list` | — | `{ ok, backups }` |
| `backup:restore` | `folderName` | `{ ok }` |
| `fs:open-output` | — | `{ ok }` |
| `fs:open-path` | `path` | `{ ok }` (restricted to output/) |
| `fs:pick-backup` | — | `{ ok, filePath }` |

---

## PDF Generation

PDF is implemented in `app/services/pdfGenerator.js` using Electron's `webContents.printToPDF()`.

**Flow per format:**
1. `cvGenerator.renderHtml(format, profile, assets)` produces self-contained HTML with base64-embedded images.
2. HTML is written to a temp file in `os.tmpdir()`.
3. A hidden `BrowserWindow` (sandbox: false, show: false) loads the temp file.
4. After `did-finish-load` + 400ms paint delay, `printToPDF({ pageSize: 'A4', printBackground: true })` is called.
5. Buffer is written to `output/PDF/{FirstName}_{LastName}_{Label}.pdf`.
6. Temp file and hidden window are destroyed in a `finally` block.

**PDF file naming:**

| Format | PDF filename label |
|---|---|
| harvard | `CV_Harvard` |
| ats | `CV_ATS` |
| modern | `CV_Modern` |
| european | `CV_European` |
| academic | `CV_Academic` |
| one-page | `CV_OnePage` |
| international | `Resume_International` |
| photo-sidebar | `CV_PhotoSidebar` |

**Generating all PDFs efficiently:**
`generate:all-pdfs` calls `cvGenerator.generateAll()` which returns both HTML paths and the rendered `htmlMap`. The `htmlMap` is passed directly to `pdfGenerator.generateAll()`, avoiding double-rendering.

**Why `sandbox: false` on the PDF window:**
The PDF window is not user-facing and handles no user input. It exists only to render known-safe HTML from our own templates. `sandbox: false` is needed for reliable `loadFile()` + `printToPDF` on Linux. The security tradeoff is acceptable for this use case.

---

## Asset Service (`app/services/assetService.js`)

`getAssetInfo()`:
- Looks for `pablo-profile.jpg` and `launchcv-logo.png` in the repo root.
- Detects MIME type from file magic bytes (not extension — the logo is a JPEG with a .png extension).
- Copies files to `app/renderer/assets/` for the live UI.
- Returns base64 data URLs for embedding in self-contained HTML/PDF output.
- Returns `{ assets, warnings }`.

`copyToWebOutput(webDir)`:
- Copies both asset files to `webDir/assets/`.
- Used by `webGenerator.js` so the Web Card can reference images via relative paths.

---

## CV Templates

Templates live in `app/templates/cv/`. Each is a self-contained HTML file with `{{PLACEHOLDER}}` substitution. No build step.

### Identity Placeholders

| Placeholder | Content |
|---|---|
| `{{FULL_NAME}}` | Escaped first + last name |
| `{{HEADLINE}}` | Professional headline |
| `{{LOCATION}}`, `{{EMAIL}}`, `{{PHONE}}` | Contact fields |
| `{{LINKEDIN}}`, `{{GITHUB}}`, `{{WEBSITE}}` | Link fields |
| `{{SUMMARY}}` | Professional summary |
| `{{STATUS}}` | e.g. "Open to work" |
| `{{YEAR}}` | Current year |

### Standard Section Blocks

| Placeholder | Rendered by |
|---|---|
| `{{EDUCATION}}` | `renderEducation()` |
| `{{EXPERIENCE}}` | `renderExperience()` |
| `{{CERTIFICATIONS}}` | `renderCertifications()` |
| `{{LANGUAGES}}` | `renderLanguages()` |
| `{{SKILLS}}` | `renderSkills()` |

### Asset Blocks

| Placeholder | Content | Which formats use it |
|---|---|---|
| `{{PHOTO_BLOCK}}` | `<img>` with base64 data URL, or empty | modern, european (if showPhoto) |
| `{{LOGO_IMG}}` | `<img>` with base64 logo, or text fallback | modern, european |

### Format-Specific Blocks

| Placeholder | Used in |
|---|---|
| `{{EU_CONTACT}}`, `{{LANGUAGES_SIDEBAR}}`, `{{SKILLS_SIDEBAR}}`, `{{CERTIFICATIONS_SIDEBAR}}` | european |
| `{{RESEARCH_INTERESTS}}`, `{{EDUCATION_ACADEMIC}}`, `{{EXPERIENCE_ACADEMIC}}` | academic |
| `{{EDUCATION_COMPACT}}`, `{{EXPERIENCE_LIMITED}}`, `{{SKILLS_LIMITED}}` | one-page |
| `{{EXPERIENCE_BULLETS}}`, `{{SKILLS_GROUPED}}`, `{{CERTS_AND_LANGS}}` | international |
| `{{PS_PHOTO_BLOCK}}`, `{{PS_CONTACT}}`, `{{PS_LANGUAGES}}`, `{{PS_SKILLS}}`, `{{PS_PROJECTS_BLOCK}}` | photo-sidebar |

**Photo Sidebar CV notes:**
- `{{PS_PHOTO_BLOCK}}` renders a circular photo if `showPhoto` is true and the asset exists; otherwise renders an initials badge derived from the candidate's name. It never renders a broken `<img>` tag.
- `{{PS_PROJECTS_BLOCK}}` renders the full projects section block, or empty string if `profile.projects` is empty — so the section is suppressed automatically.
- `{{PS_CONTACT}}` renders only non-empty contact fields; no stray separators appear.

### Adding a New CV Format

1. Create `app/templates/cv/newformat.html` with desired HTML/CSS and `{{PLACEHOLDER}}` variables.
2. Add an entry to `FORMAT_MAP` in `app/services/cvGenerator.js`:
   ```js
   'newformat': {
     dir:        'NewFormat',
     template:   'newformat.html',
     filenameFn: (l, f) => `${f}_${l}_CV_NewFormat`
   }
   ```
3. Add a `pdfLabel` equivalent in `app/services/pdfGenerator.js → FORMAT_LABELS`.
4. Add a checkbox in `app/renderer/index.html` (Generate page).

---

## Where Data is Stored

During development (Linux):
- Profile: `app/data/profile.en.json`, `profile.es.json`
- Config: `app/data/config.json`
- Output: `output/`
- Backups: `backups/`
- App UI assets: `app/renderer/assets/`

On Windows (future): migrate data to `%USERPROFILE%\Documents\LaunchCV\data\` using `app.getPath('documents')` in `profileStore.js`.

---

## Implementing DOCX Generation

1. Install: `npm install docx`
2. Implement in `app/services/docxGenerator.js` using the `docx` package's `Document`, `Paragraph`, `TextRun` classes.
3. Add `generate:docx` and `generate:all-docx` IPC handlers in `main.js`.
4. Add buttons in the renderer Generate page.

---

## Packaging for Windows

1. On a Windows machine (or CI): `npm install && npm run dist`
2. Uses `electron-builder` with config in `package.json`. Output goes to `dist/`.

Before packaging:
- Set `appId` in `package.json` build config.
- Add `icon.ico` to `app/assets/`.
- Migrate data paths to `Documents/LaunchCV/` in `profileStore.js`.
- Place `pablo-profile.jpg` and `launchcv-logo.png` in the app root before building.
- Test the full generation flow (HTML + PDF + Web Card) on Windows.

---

## GitHub Pages Deployment for the Web Card

LaunchCV uses the `docs/` folder as the GitHub Pages publishing source on the `master` branch.

### Automated flow (recommended)

1. In the app, go to **Web & QR** and confirm the **Public URL** is correct.
2. Click **🌐 Prepare GitHub Pages Website**. This:
   - Regenerates `output/Web/` from the current profile.
   - Copies it to `docs/` (index.html, card.html, assets/).
   - Copies CV PDFs to `docs/assets/cv/` with sanitized (accent-free) filenames.
   - Patches `docs/card.html` so download links point to those PDFs.
   - Writes `docs/.nojekyll` to prevent Jekyll from breaking underscore paths.
3. Commit and push `docs/` to the repository.
4. First time only: enable GitHub Pages in GitHub:
   `Settings → Pages → master → /docs → Save`

**Temporary URL:** `https://axeljosephpm.github.io/LaunchCV/`

### CLI flow (developer)

```bash
# Just copy output/Web/ to docs/ (Web Card must be generated first):
npm run pages:prepare

# Generate Web Card from saved profile AND copy to docs/:
npm run pages:generate
```

### Implemented in

- `app/services/pagesPublisher.js` — core copy/patch logic
- `scripts/publish-web-to-docs.js` — backing script for `npm run pages:prepare`
- `scripts/generate-and-publish.js` — backing script for `npm run pages:generate`
- `app/main.js` — IPC: `pages:prepare`, `pages:open-docs`
- `app/preload.js` — exposed as `api.preparePages()`, `api.openDocsFolder()`

### docs/ structure

```
docs/
├── .nojekyll
├── index.html          ← redirects to card.html
├── card.html           ← the Web Card
├── assets/
│   ├── pablo-profile.jpg
│   ├── launchcv-logo.png
│   └── cv/             ← sanitized-name PDF copies
└── Contact/            ← sanitized-name vCard copy
```

### QR URL construction

The QR URL is built in `qrGenerator.js` as:
```
url = publicUrl.trimRight('/') + '/' + qrTarget
    = "https://axeljosephpm.github.io/LaunchCV/" + "card.html"
    = "https://axeljosephpm.github.io/LaunchCV/card.html"
```

`qrTarget` is stored in `config.json → webCard.qrTarget`.

For the full GitHub Pages user guide, see `manual/GitHub_Pages.md`.

---

## npm Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Launch Electron app (Linux development) |
| `npm run start` | Same as dev |
| `npm run build` | Placeholder for transpile/bundle step |
| `npm run dist` | Package for Windows with electron-builder |

---

## DevTools

```bash
NODE_ENV=development npm run dev
```

Opens DevTools automatically in the main window.
