const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');

function profilePath(lang) {
  return path.join(dataDir, `profile.${lang}.json`);
}

function configPath() {
  return path.join(dataDir, 'config.json');
}

function load(lang) {
  const p = profilePath(lang || 'en');
  if (!fs.existsSync(p)) throw new Error(`Profile file not found: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function save(lang, data) {
  data.meta = data.meta || {};
  data.meta.lastUpdated = new Date().toISOString().split('T')[0];
  data.meta.language = lang;
  fs.writeFileSync(profilePath(lang), JSON.stringify(data, null, 2), 'utf8');
}

function loadConfig() {
  const p = configPath();
  if (!fs.existsSync(p)) throw new Error('config.json not found');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveConfig(data) {
  fs.writeFileSync(configPath(), JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { load, save, loadConfig, saveConfig };
