const QRCode = require('qrcode');

async function generateQR(url) {
  try {
    const dataUrl = await QRCode.toDataURL(url);
    return dataUrl.split(',')[1];
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = { generateQR };
