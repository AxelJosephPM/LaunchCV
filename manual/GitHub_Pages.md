# LaunchCV — GitHub Pages Publishing Guide

This guide explains how to publish Pablo's public landing page / Web Card on GitHub Pages using the `docs/` folder,
how the QR code works, and how Pablo can later take full ownership of the site.

---

## What is GitHub Pages in this project?

GitHub Pages is a free hosting service provided by GitHub that serves static websites directly
from a repository. In LaunchCV, the generated Web Card is published from the `docs/` folder on
the `master` branch.

**Why `docs/`?**
GitHub Pages supports two source options: the repository root or a `/docs` subfolder.
Using `/docs` keeps the website files separate from the app source code, making the repository
cleaner and easier to manage.

---

## Step 1 — Generate the Web Card landing page

Before publishing to GitHub Pages, generate the Web Card from within the app. The Web Card is now a public landing page that works as a digital profile, CV download center, mini portfolio, contact page, and QR target:

1. Open LaunchCV.
2. Fill in your profile data and make sure your photo and links are correct.
3. Go to **Generate** → click **Generate Web Card**.
4. The landing page is created in `output/Web/`.

You can preview it in your browser by opening `output/Web/index.html` directly. `output/Web/card.html` redirects to `index.html` so older QR targets still work.

---

## Step 2 — Set your Public URL

1. In the app, go to **Web & QR**.
2. Set the **Public URL** field to your GitHub Pages URL:
   ```
   https://axeljosephpm.github.io/LaunchCV/
   ```
3. Recommended: leave the **QR Target Path** empty so the QR points to the base landing page.
   You can also keep `card.html`; it redirects to `index.html`.
4. Click **Save Web & QR Settings**.

---

## Step 3 — Prepare the docs/ folder

1. Still in **Web & QR**, click **🌐 Prepare GitHub Pages Website**.
2. The app will:
   - Regenerate a fresh landing page.
   - Copy it to `docs/index.html`.
   - Copy a lightweight redirect to `docs/card.html`.
   - Copy your CV PDFs (with web-safe filenames) to `docs/assets/cv/`.
   - Copy the public vCard to `docs/Contact/`.
   - Keep all links relative for GitHub Pages.
   - Create a `docs/.nojekyll` file so GitHub Pages handles underscored filenames correctly.
3. Open the `docs/` folder to verify the files are there.

Alternatively, from the terminal:
```bash
npm run pages:prepare
# or, to also regenerate the Web Card from scratch:
npm run pages:generate
```

---

## Step 4 — Enable GitHub Pages (first time only)

1. Go to your repository on GitHub: `https://github.com/AxelJosephPM/LaunchCV`
2. Click **Settings** → **Pages** (in the left sidebar under "Code and automation").
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `master` (or `main` if your default branch is `main`)
   - **Folder**: `/docs`
4. Click **Save**.
5. GitHub will show the URL where your site will be published. It may take 1–5 minutes.

---

## Step 5 — Commit and push docs/

After preparing the `docs/` folder, commit it and push to GitHub:

```bash
# The developer/Axel does this from the terminal:
git add docs/
git commit -m "Update GitHub Pages web card"
git push
```

GitHub Pages will detect the change and redeploy automatically.

---

## How the QR code works

The QR code is generated from the URL:
```
{publicUrl} + {qrTarget}
= https://axeljosephpm.github.io/LaunchCV/ + optional target path
```

The recommended QR target is the base URL: `https://axeljosephpm.github.io/LaunchCV/`.
If an older QR points to `card.html`, that page redirects to `index.html`.

**Important:** If you change the Public URL after printing QR codes, the old printed QRs will
still point to the old URL. For permanent QR codes, choose the final URL before printing.

---

## The docs/ folder structure

After publishing, `docs/` looks like this:

```
docs/
├── .nojekyll                    ← prevents Jekyll processing
├── index.html                   ← public landing page / main QR target
├── card.html                    ← redirect to index.html for old QR targets
├── assets/
│   ├── pablo-profile.jpg
│   ├── launchcv-logo.png
│   └── cv/
│       ├── Pablo_Codon_Castellano_CV_Harvard.pdf
│       ├── Pablo_Codon_Castellano_CV_ATS.pdf
│       ├── Pablo_Codon_Castellano_CV_Modern.pdf
│       ├── Pablo_Codon_Castellano_CV_European.pdf
│       ├── Pablo_Codon_Castellano_CV_Academic.pdf
│       ├── Pablo_Codon_Castellano_CV_OnePage.pdf
│       ├── Pablo_Codon_Castellano_CV_PhotoSidebar.pdf
│       └── Pablo_Codon_Castellano_Resume_International.pdf
└── Contact/
    └── Pablo_Codon_Castellano.vcf
```

**Filenames in docs/assets/cv/** use web-safe characters (no accents). The original accented
filenames remain in `output/PDF/` for local use.

---

## Privacy and security

Before copying to `docs/`, the publisher respects your privacy settings:
- Email is only visible if **Show Email** is enabled in Privacy settings.
- Phone is only visible if **Show Phone** is enabled.
- Photo is only shown if **Show Photo** is enabled.
- CV PDFs are only included if **Show CV Download Buttons** is enabled.
- Projects and experience are only shown if their privacy switches are enabled.
- The public vCard follows the same email, phone, address, LinkedIn, and GitHub visibility rules.

The following files are **never** copied to `docs/`:
- `app/data/*.json` (profile data)
- `backups/`
- `output/Logs/`
- `node_modules/`

---

## Transferring the Web Card to Pablo

This section explains how Pablo can make the web card fully his, independent of Axel's GitHub account.

### Current situation

While the project lives under `AxelJosephPM/LaunchCV`:
- The site is at `https://axeljosephpm.github.io/LaunchCV/`
- The QR code points to that URL
- The URL is **temporary**

### Option A — Pablo forks the repository

1. Pablo creates a GitHub account (if he doesn't have one).
2. He clicks **Fork** on `https://github.com/AxelJosephPM/LaunchCV`.
3. In his fork, he enables GitHub Pages: **Settings → Pages → master → /docs**.
4. His site will be at `https://pablocodoncastellano.github.io/LaunchCV/` (or similar).
5. In LaunchCV, he updates the **Public URL** to his new URL.
6. He clicks **Prepare GitHub Pages Website**, then commits and pushes.
7. He regenerates the QR code — it now points to his own site.

From that point, Pablo controls his own Web Card independently.

### Option B — Pablo creates a standalone site repo

1. Pablo creates a new GitHub repository named `pablocodoncastellano.github.io` (for root URL)
   or any name (for `username.github.io/reponame/`).
2. He copies the contents of `docs/` into that repository.
3. He enables GitHub Pages on the new repo.
4. He updates **Public URL** in LaunchCV and regenerates the QR.

### After the transfer

- Update the **Public URL** in LaunchCV to Pablo's new URL.
- Regenerate the QR code.
- The new QR will point to Pablo's permanent URL.
- Any previously printed QR codes will still point to the old URL — those cannot be updated.
- Axel can disable GitHub Pages on his repo once Pablo's site is live.

---

## Troubleshooting

**The site shows a 404 page.**
Make sure GitHub Pages is enabled on the correct branch and folder. Go to Settings → Pages
and confirm the source is `master` (or `main`) and the folder is `/docs`.

**The site doesn't update after pushing.**
GitHub Pages can take 1–5 minutes. Check the Actions tab in GitHub for deployment status.

**CV download links don't work.**
Make sure you ran "Prepare GitHub Pages Website" after generating the PDFs. The docs/assets/cv/
folder must contain the PDF files. Check that the filenames in the links match the files.

**The photo doesn't appear on the web card.**
Ensure `pablo-profile.jpg` is in the repository root and **Show Photo** is enabled in Privacy settings.
Then regenerate the Web Card and prepare the Pages folder again.

**The QR points to the wrong URL.**
Check the **Public URL** and **QR Target Path** fields in Web & QR settings. Regenerate the QR
after saving the settings.

---

*LaunchCV — built with care for Pablo's career launch.*
