const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launchcv', {
  // Profile
  loadProfile:    (lang)       => ipcRenderer.invoke('profile:load', lang),
  saveProfile:    (lang, data) => ipcRenderer.invoke('profile:save', lang, data),
  loadConfig:     ()           => ipcRenderer.invoke('config:load'),
  saveConfig:     (data)       => ipcRenderer.invoke('config:save', data),

  // HTML CV generation
  generateCV:         (format, lang) => ipcRenderer.invoke('generate:cv', format, lang),
  generateAllCVs:     (lang)         => ipcRenderer.invoke('generate:all-cvs', lang),

  // PDF generation
  generatePDF:        (format, lang) => ipcRenderer.invoke('generate:pdf', format, lang),
  generateAllPDFs:    (lang)         => ipcRenderer.invoke('generate:all-pdfs', lang),

  // Other outputs
  generateWebCard:    (lang) => ipcRenderer.invoke('generate:webcard', lang),
  generateQR:         ()     => ipcRenderer.invoke('generate:qr'),
  generateVCard:      (lang) => ipcRenderer.invoke('generate:vcard', lang),
  generateEverything: (lang) => ipcRenderer.invoke('generate:everything', lang),

  // Preview
  previewCV: (format, lang) => ipcRenderer.invoke('preview:cv', format, lang),

  // Asset status
  getAssetStatus: () => ipcRenderer.invoke('assets:status'),

  // Backup
  createBackup:  ()         => ipcRenderer.invoke('backup:create'),
  listBackups:   ()         => ipcRenderer.invoke('backup:list'),
  restoreBackup: (filename) => ipcRenderer.invoke('backup:restore', filename),
  pickBackup:    ()         => ipcRenderer.invoke('fs:pick-backup'),

  // Filesystem
  openOutputFolder: ()  => ipcRenderer.invoke('fs:open-output'),
  openPath:         (p) => ipcRenderer.invoke('fs:open-path', p), // restricted to output/ subtree

  // GitHub Pages publishing
  preparePages:   (lang) => ipcRenderer.invoke('pages:prepare', lang),
  openDocsFolder: ()     => ipcRenderer.invoke('pages:open-docs')
});
