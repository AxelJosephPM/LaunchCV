const path = require('path');
const fs = require('fs');

const outputContact = path.join(__dirname, '..', '..', 'output', 'Contact');

function generate(profile) {
  const p     = profile.personal || {};
  const links = profile.links    || {};
  // Prefer profile.links (canonical source); fall back to personal fields.
  const linkedinUrl = links.linkedin || p.linkedin || '';
  const githubUrl   = links.github   || p.github   || '';
  const websiteUrl  = links.portfolio || p.website  || '';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${p.firstName || ''} ${p.lastName || ''}`.trim(),
    `N:${p.lastName || ''};${p.firstName || ''};;;`,
    p.headline   ? `TITLE:${p.headline}`                        : '',
    p.email      ? `EMAIL;TYPE=INTERNET:${p.email}`             : '',
    p.phone      ? `TEL;TYPE=CELL:${p.phone}`                   : '',
    linkedinUrl  ? `URL;TYPE=LinkedIn:${linkedinUrl}`           : '',
    githubUrl    ? `URL;TYPE=GitHub:${githubUrl}`               : '',
    websiteUrl   ? `URL;TYPE=Website:${websiteUrl}`             : '',
    `NOTE:${(profile.summary || '').replace(/\r\n|\n/g, '\\n')}`,
    'END:VCARD'
  ].filter(Boolean);

  if (!fs.existsSync(outputContact)) fs.mkdirSync(outputContact, { recursive: true });

  const filename = `${p.firstName || 'Contact'}_${p.lastName || ''}.vcf`.replace(/\s+/g, '_');
  const outPath = path.join(outputContact, filename);
  fs.writeFileSync(outPath, lines.join('\r\n'), 'utf8');
  return outPath;
}

module.exports = { generate };
