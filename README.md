# LaunchCV

Professional CV generator and digital card builder, designed for aerospace professionals.

## Quick Start (Development — Linux)

```bash
npm install
npm run dev
```

## Features

- Edit profile through visual forms (no JSON editing required)
- Generate CVs in multiple formats: Harvard, ATS, Modern, European, Academic, One-Page, International, Photo Sidebar
- Generate a mobile-friendly Web Card for GitHub Pages
- QR code pointing to the Web Card
- vCard (.vcf) contact file
- Privacy controls for the public web card
- GitHub Pages publishing with one click (`docs/` folder)
- Timestamped backup and restore
- Bilingual profiles (English / Spanish)

## Output

All generated files go to the `output/` folder, organized by type.
The `docs/` folder is the GitHub Pages publishing directory.

## GitHub Pages (Temporary URL)

The Web Card is currently published at:

**https://axeljosephpm.github.io/LaunchCV/**

### How to publish / update

1. In the app, go to **Web & QR**.
2. Confirm the **Public URL** is `https://axeljosephpm.github.io/LaunchCV/`.
3. Click **🌐 Prepare GitHub Pages Website**. This regenerates the Web Card and copies it to `docs/`.
4. Commit and push the `docs/` folder.
5. GitHub Pages will update within a few minutes.

### First-time GitHub Pages setup

In the repository on GitHub:

```
Settings → Pages → Build and deployment
  Source: Deploy from a branch
  Branch: master   (or main if your default branch is main)
  Folder: /docs
→ Save
```

The site typically goes live within 1–5 minutes after the first save.

### Transferring the Web Card to Pablo

**Option A — Pablo forks this repository:**

1. Pablo forks `AxelJosephPM/LaunchCV`.
2. He enables GitHub Pages from `/docs` on his fork.
3. He changes the **Public URL** in the app to `https://pablocodoncastellano.github.io/LaunchCV/`.
4. He clicks **Prepare GitHub Pages Website**, commits, and pushes.
5. From that point the QR points to his own site.

**Option B — Pablo creates a standalone site repo:**

1. Create a new GitHub repository (e.g. `pablocodoncastellano.github.io`).
2. Copy the contents of `docs/` to that repo.
3. Enable GitHub Pages (root or `/docs` depending on repo name).
4. Update **Public URL** in the app and regenerate the QR.

> **Note:** Any QR code already printed will continue pointing to the old URL. Choose the final URL before printing cards.

## npm Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Launch the Electron app |
| `npm run pages:prepare` | Copy `output/Web/` → `docs/` (app must have generated the Web Card first) |
| `npm run pages:generate` | Generate Web Card from saved profile, then copy to `docs/` |
| `npm run dist` | Package for Windows with electron-builder |

## Documentation

- `manual/Guia_rapida.md` — Quick start guide (Spanish, non-technical users)
- `manual/Manual_de_usuario.md` — Full user manual (Spanish, Windows users)
- `manual/Manual_para_desarrollador.md` — Developer guide (English, technical)
- `manual/GitHub_Pages.md` — GitHub Pages publishing guide

## Tech Stack

- Electron
- HTML / CSS / Vanilla JavaScript
- Node.js (main process services only)
- `qrcode` npm package for QR generation

## License

MIT
