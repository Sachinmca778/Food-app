// routes/qr.js – Generate a simple QR code PNG (data URL) for a restaurant slug
// Uses the `qrcode` npm package (already a dependency).

const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

/**
 * GET /api/qr/:slug
 * Returns a data URL containing a QR code that points to the public storefront URL.
 * Example response: { success: true, dataUrl: 'data:image/png;base64,...' }
 */
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.status(400).json({ success: false, error: 'Slug required' });
  }
  try {
    const storeUrl = `${process.env.FRONTEND_URL || 'https://directdine.com'}/r/${slug}`;
    const dataUrl = await QRCode.toDataURL(storeUrl, { width: 300, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
    res.json({ success: true, dataUrl });
  } catch (err) {
    console.error('QR generation error', err);
    res.status(500).json({ success: false, error: 'Failed to generate QR code' });
  }
});

module.exports = router;

