const NITAG = require('../models/NITAG');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { escapeHtml } = require('../utils/htmlEscape');
const { replyTempFullTree, wantsJson } = require('../utils/tempFullTreeReply');
const { parsePaginationQuery, paginateQuery } = require('../utils/pagination');

// @desc    Get all NITAGs
// @route   GET /api/nitags
// @access  Private/Admin
exports.getNITAGs = async (req, res) => {
  try {
    const pagination = parsePaginationQuery(req.query);
    const { docs: nitags, total, pagination: paginationMeta } = await paginateQuery(
      NITAG,
      {},
      { country: 1 },
      pagination
    );

    const formatted = nitags.map((n) => ({
      id: n._id.toString(),
      country: n.country,
      availableNitag: n.availableNitag,
      availableWebsite: n.availableWebsite,
      websiteUrl: n.websiteUrl,
      nationalNitagName: n.nationalNitagName,
      yearEstablished: n.yearEstablished,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    const payload = {
      success: true,
      count: pagination.enabled ? total : formatted.length,
      nitags: formatted,
    };
    if (paginationMeta) payload.pagination = paginationMeta;

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single NITAG
// @route   GET /api/nitags/:id
// @access  Private/Admin
exports.getNITAG = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid NITAG ID format',
      });
    }

    const nitag = await NITAG.findById(req.params.id);

    if (!nitag) {
      return res.status(404).json({
        success: false,
        message: 'NITAG not found',
      });
    }

    res.status(200).json({
      success: true,
      nitag: {
        id: nitag._id.toString(),
        country: nitag.country,
        availableNitag: nitag.availableNitag,
        availableWebsite: nitag.availableWebsite,
        websiteUrl: nitag.websiteUrl,
        nationalNitagName: nitag.nationalNitagName,
        yearEstablished: nitag.yearEstablished,
        createdAt: nitag.createdAt,
        updatedAt: nitag.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create NITAG
// @route   POST /api/nitags
// @access  Private/Admin
exports.createNITAG = async (req, res) => {
  try {
    const {
      country,
      availableNitag,
      availableWebsite,
      websiteUrl,
      nationalNitagName,
      yearEstablished,
    } = req.body;

    // Check if NITAG already exists
    const nitagExists = await NITAG.findOne({ country: country.trim() });

    if (nitagExists) {
      return res.status(400).json({
        success: false,
        message: 'NITAG for this country already exists',
      });
    }

    const nitag = await NITAG.create({
      country: country.trim(),
      availableNitag: availableNitag ? availableNitag.trim() : '',
      availableWebsite: availableWebsite ? availableWebsite.trim() : '',
      websiteUrl: websiteUrl ? websiteUrl.trim() : '',
      nationalNitagName: nationalNitagName ? nationalNitagName.trim() : '',
      yearEstablished: yearEstablished ? String(yearEstablished).trim() : '',
    });

    await updateLastUpdate('NITAG');

    res.status(201).json({
      success: true,
      message: 'NITAG created successfully',
      nitag: {
        id: nitag._id.toString(),
        country: nitag.country,
        availableNitag: nitag.availableNitag,
        availableWebsite: nitag.availableWebsite,
        websiteUrl: nitag.websiteUrl,
        nationalNitagName: nitag.nationalNitagName,
        yearEstablished: nitag.yearEstablished,
        createdAt: nitag.createdAt,
        updatedAt: nitag.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update NITAG
// @route   PUT /api/nitags/:id
// @access  Private/Admin
exports.updateNITAG = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid NITAG ID format',
      });
    }

    let nitag = await NITAG.findById(req.params.id);

    if (!nitag) {
      return res.status(404).json({
        success: false,
        message: 'NITAG not found',
      });
    }

    // Check if country is being changed and if it's already taken
    if (req.body.country && req.body.country.trim() !== nitag.country) {
      const countryExists = await NITAG.findOne({
        country: req.body.country.trim(),
        _id: { $ne: req.params.id },
      });
      if (countryExists) {
        return res.status(400).json({
          success: false,
          message: 'NITAG for this country already exists',
        });
      }
    }

    // Prepare update object - only include fields that are provided
    const updateData = {};
    const fields = [
      'country', 'availableNitag', 'availableWebsite', 'websiteUrl',
      'nationalNitagName', 'yearEstablished'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = typeof req.body[field] === 'string' 
          ? req.body[field].trim() 
          : String(req.body[field]).trim();
      }
    });

    nitag = await NITAG.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('NITAG');

    res.status(200).json({
      success: true,
      message: 'NITAG updated successfully',
      nitag: {
        id: nitag._id.toString(),
        country: nitag.country,
        availableNitag: nitag.availableNitag,
        availableWebsite: nitag.availableWebsite,
        websiteUrl: nitag.websiteUrl,
        nationalNitagName: nitag.nationalNitagName,
        yearEstablished: nitag.yearEstablished,
        createdAt: nitag.createdAt,
        updatedAt: nitag.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete NITAG
// @route   DELETE /api/nitags/:id
// @access  Private/Admin
exports.deleteNITAG = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid NITAG ID format',
      });
    }

    const nitag = await NITAG.findById(req.params.id);

    if (!nitag) {
      return res.status(404).json({
        success: false,
        message: 'NITAG not found',
      });
    }

    await NITAG.findByIdAndDelete(req.params.id);

    await updateLastUpdate('NITAG');

    res.status(200).json({
      success: true,
      message: 'NITAG deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

function linkOrText(url) {
  const u = (url || '').trim();
  if (/^https?:\/\//i.test(u)) {
    return `<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u)}</a>`;
  }
  if (!u) return '<span class="muted">—</span>';
  return escapeHtml(u);
}

function renderNitagsTempFullTreeHtml(nitags) {
  const cards = nitags
    .map(
      (n) => `<article class="nitag-card" id="n-${escapeHtml(n.id)}">
  <header class="nitag-head">
    <h2>${escapeHtml(n.country)}</h2>
    <p class="muted small">ID: ${escapeHtml(n.id)}</p>
  </header>
  <dl class="field-list">
    <div class="dl-row"><dt>National NITAG name</dt><dd class="multiline">${escapeHtml(
      n.nationalNitagName || '—'
    )}</dd></div>
    <div class="dl-row"><dt>Available NITAG</dt><dd class="multiline">${escapeHtml(
      n.availableNitag || '—'
    )}</dd></div>
    <div class="dl-row"><dt>Available website</dt><dd>${linkOrText(n.availableWebsite)}</dd></div>
    <div class="dl-row"><dt>Website URL</dt><dd>${linkOrText(n.websiteUrl)}</dd></div>
    <div class="dl-row"><dt>Year established</dt><dd>${escapeHtml(n.yearEstablished || '—')}</dd></div>
    <div class="dl-row"><dt>Created / updated</dt><dd class="small muted">${escapeHtml(
      n.createdAt ? new Date(n.createdAt).toISOString() : '—'
    )} · ${escapeHtml(n.updatedAt ? new Date(n.updatedAt).toISOString() : '—')}</dd></div>
  </dl>
</article>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NITAGs — full list (temporary)</title>
  <style>
    :root {
      --bg: #f4f6f9;
      --card: #fff;
      --text: #1a2332;
      --muted: #5c6b7f;
      --border: #d8dee9;
      --accent: #0d6efd;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 15px; line-height: 1.55; color: var(--text); background: var(--bg); }
    .page-header {
      background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
      color: #fff;
      padding: 1.75rem 1.25rem 2rem;
      margin-bottom: 1.5rem;
    }
    .page-header h1 { margin: 0 0 0.5rem; font-size: 1.65rem; font-weight: 700; }
    .page-header p { margin: 0; opacity: 0.92; max-width: 52rem; }
    .page-header .hint { margin-top: 1rem; font-size: 0.85rem; opacity: 0.88; }
    .page-header code { background: rgba(255,255,255,0.15); padding: 0.15rem 0.4rem; border-radius: 4px; }
    main { max-width: 960px; margin: 0 auto 3rem; padding: 0 1rem; }
    .nitag-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem 1.4rem 1.5rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border-left: 4px solid #7c3aed;
    }
    .nitag-head h2 { margin: 0 0 0.25rem; font-size: 1.25rem; }
    .muted { color: var(--muted); }
    .small { font-size: 0.85rem; }
    .field-list { margin: 0.5rem 0 0; }
    .dl-row { margin-bottom: 0.65rem; }
    .field-list dt { font-weight: 600; font-size: 0.82rem; color: var(--muted); margin-bottom: 0.15rem; }
    .field-list dd { margin: 0; }
    .multiline { white-space: pre-wrap; word-break: break-word; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <header class="page-header">
    <h1>NITAGs — all fields</h1>
    <p style="margin:0.75rem 0 0;">National Immunization Technical Advisory Groups, one card per country.</p>
    <p class="hint">Raw JSON: <code>?format=json</code> · PDF download: <code>?format=pdf</code></p>
  </header>
  <main>
    <p class="muted" style="margin:0 0 1.25rem;"><strong>${nitags.length}</strong> NITAG record(s).</p>
    ${cards}
  </main>
</body>
</html>`;
}

// TEMPORARY: all NITAGs as readable HTML or JSON.
// @route   GET /api/nitags/temp-full-tree
// @access  Public
exports.getNITAGsTempFullTree = async (req, res) => {
  try {
    const nitags = await NITAG.find().sort({ country: 1 });

    const formatted = nitags.map((n) => ({
      id: n._id.toString(),
      country: n.country,
      availableNitag: n.availableNitag,
      availableWebsite: n.availableWebsite,
      websiteUrl: n.websiteUrl,
      nationalNitagName: n.nationalNitagName,
      yearEstablished: n.yearEstablished,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    const html = renderNitagsTempFullTreeHtml(formatted);
    return await replyTempFullTree(req, res, {
      jsonPayload: {
        success: true,
        count: formatted.length,
        nitags: formatted,
      },
      html,
      pdfFilename: 'nitags-temp-full-tree.pdf',
    });
  } catch (error) {
    if (wantsJson(req)) {
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
    res
      .status(500)
      .type('html')
      .send(
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Error</title></head><body style="font-family:system-ui;padding:2rem;"><h1>Error</h1><p>${escapeHtml(
          error.message
        )}</p><p><a href="?">Retry</a> · <a href="?format=json">JSON</a> · <a href="?format=pdf">PDF</a></p></body></html>`
      );
  }
};
