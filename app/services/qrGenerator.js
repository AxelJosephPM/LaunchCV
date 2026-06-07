const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const outputQR = path.join(__dirname, '..', '..', 'output', 'QR');

async function generate(config) {
  const webCard = config.webCard || {};
  let url     = webCard.publicUrl;
  let warning = null;

  if (url) {
    // Safely append qrTarget (e.g. "card.html") without double slashes.
    const target = (webCard.qrTarget || '').trim().replace(/^\/+/, '');
    if (target) {
      url = url.replace(/\/+$/, '') + '/' + target;
    }
  } else if (webCard.githubUser && webCard.repoName) {
    url = `https://${webCard.githubUser}.github.io/${webCard.repoName}/${webCard.cardPath || 'card.html'}`;
  } else {
    url = 'https://example.com/your-card-url-here';
    warning = 'No public URL configured. The QR points to a placeholder. Set your GitHub Pages URL in the Web & QR settings.';
  }

  if (!fs.existsSync(outputQR)) fs.mkdirSync(outputQR, { recursive: true });

  const outPath = path.join(outputQR, 'qr_card.png');
  await QRCode.toFile(outPath, url, {
    width: config.qr?.size || 300,
    errorCorrectionLevel: config.qr?.errorCorrectionLevel || 'M',
    color: { dark: '#0d1b2a', light: '#ffffff' }
  });

  return { path: outPath, url, warning };
}

module.exports = { generate };
