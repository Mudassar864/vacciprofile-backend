const { htmlToPdfBuffer } = require('./htmlToPdf');

function wantsFormat(req, type) {
  return String(req.query.format || '').toLowerCase() === String(type).toLowerCase();
}

/**
 * Shared response for temp-full-tree style routes: JSON, PDF download, or HTML.
 */
async function replyTempFullTree(req, res, { jsonPayload, html, pdfFilename }) {
  if (wantsFormat(req, 'json')) {
    return res.status(200).json(jsonPayload);
  }

  if (wantsFormat(req, 'pdf')) {
    try {
      const buf = await htmlToPdfBuffer(html);
      const safeName = (pdfFilename || 'export.pdf').replace(/[^\w.\-]+/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      return res.status(200).send(buf);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'PDF generation failed',
        error: err.message,
      });
    }
  }

  return res.status(200).type('html').send(html);
}

function wantsJson(req) {
  return wantsFormat(req, 'json');
}

module.exports = { replyTempFullTree, wantsFormat, wantsJson };
