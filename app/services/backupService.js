const path = require('path');
const fs = require('fs');

const dataDir   = path.join(__dirname, '..', 'data');
const backupDir = path.join(__dirname, '..', '..', 'backups');

function create() {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const folder = path.join(backupDir, `backup_${ts}`);
  fs.mkdirSync(folder);

  for (const file of ['profile.en.json', 'profile.es.json', 'config.json']) {
    const src = path.join(dataDir, file);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(folder, file));
  }

  return folder;
}

function list() {
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir)
    .filter(n => n.startsWith('backup_'))
    .sort()
    .reverse()
    .map(name => ({
      name,
      path: path.join(backupDir, name),
      date: name.replace('backup_', '').replace(/-/g, ':').replace('T', ' ').substring(0, 19)
    }));
}

function restore(folderName) {
  const folder = path.resolve(backupDir, folderName);
  if (!folder.startsWith(path.resolve(backupDir) + path.sep)) {
    throw new Error('Invalid backup name.');
  }
  if (!fs.existsSync(folder)) throw new Error(`Backup not found: ${folderName}`);

  for (const file of ['profile.en.json', 'profile.es.json', 'config.json']) {
    const src = path.join(folder, file);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dataDir, file));
  }
}

module.exports = { create, list, restore };
