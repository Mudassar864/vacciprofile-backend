const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const Pathogen = require('../models/Pathogen');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { pathogenNameToCandidateQuery } = require('../utils/pathogenNameQueries');
const { resolveManufacturerDetailsByCommaNames } = require('../utils/enrichManufacturers');
const { escapeHtml } = require('../utils/htmlEscape');
const {
  renderManufacturerSectionHtml,
  manufacturerTempTreeStyles,
} = require('../utils/tempTreeManufacturerHtml');
const { replyTempFullTree, wantsJson } = require('../utils/tempFullTreeReply');
const { parsePaginationQuery, paginateQuery } = require('../utils/pagination');

// @desc    Get all manufacturer candidates
// @route   GET /api/manufacturer-candidates
// @access  Private/Admin
exports.getManufacturerCandidates = async (req, res) => {
  try {
    const { pathogenName, manufacturer } = req.query;
    const query = {};
    if (pathogenName) query.pathogenName = pathogenName;
    if (manufacturer) query.manufacturer = manufacturer;

    const pagination = parsePaginationQuery(req.query);
    const { docs: candidates, total, pagination: paginationMeta } = await paginateQuery(
      ManufacturerCandidate,
      query,
      { pathogenName: 1, name: 1 },
      pagination
    );

    const formatted = candidates.map((c) => ({
      id: c._id.toString(),
      pathogenName: c.pathogenName,
      name: c.name,
      manufacturer: c.manufacturer,
      platform: c.platform,
      clinicalPhase: c.clinicalPhase,
      companyUrl: c.companyUrl,
      other: c.other,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    const payload = {
      success: true,
      count: pagination.enabled ? total : formatted.length,
      candidates: formatted,
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

// @desc    Get single manufacturer candidate
// @route   GET /api/manufacturer-candidates/:id
// @access  Private/Admin
exports.getManufacturerCandidate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const candidate = await ManufacturerCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    res.status(200).json({
      success: true,
      candidate: {
        id: candidate._id.toString(),
        pathogenName: candidate.pathogenName,
        name: candidate.name,
        manufacturer: candidate.manufacturer,
        platform: candidate.platform,
        clinicalPhase: candidate.clinicalPhase,
        companyUrl: candidate.companyUrl,
        other: candidate.other,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
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

// @desc    Create manufacturer candidate
// @route   POST /api/manufacturer-candidates
// @access  Private/Admin
exports.createManufacturerCandidate = async (req, res) => {
  try {
    const {
      pathogenName,
      name,
      manufacturer,
      platform,
      clinicalPhase,
      companyUrl,
      other,
    } = req.body;

    const candidate = await ManufacturerCandidate.create({
      pathogenName: pathogenName.trim(),
      name: name.trim(),
      manufacturer: manufacturer ? manufacturer.trim() : '',
      platform: platform ? platform.trim() : '',
      clinicalPhase: clinicalPhase ? clinicalPhase.trim() : '',
      companyUrl: companyUrl ? companyUrl.trim() : '',
      other: other ? other.trim() : '',
    });

    await updateLastUpdate('ManufacturerCandidate');

    res.status(201).json({
      success: true,
      message: 'Manufacturer candidate created successfully',
      candidate: {
        id: candidate._id.toString(),
        pathogenName: candidate.pathogenName,
        name: candidate.name,
        manufacturer: candidate.manufacturer,
        platform: candidate.platform,
        clinicalPhase: candidate.clinicalPhase,
        companyUrl: candidate.companyUrl,
        other: candidate.other,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
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

// @desc    Update manufacturer candidate
// @route   PUT /api/manufacturer-candidates/:id
// @access  Private/Admin
exports.updateManufacturerCandidate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const {
      pathogenName,
      name,
      manufacturer,
      platform,
      clinicalPhase,
      companyUrl,
      other,
    } = req.body;

    let candidate = await ManufacturerCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    const updateData = {};
    if (pathogenName !== undefined) updateData.pathogenName = pathogenName.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer.trim();
    if (platform !== undefined) updateData.platform = platform.trim();
    if (clinicalPhase !== undefined) updateData.clinicalPhase = clinicalPhase.trim();
    if (companyUrl !== undefined) updateData.companyUrl = companyUrl.trim();
    if (other !== undefined) updateData.other = other.trim();

    candidate = await ManufacturerCandidate.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('ManufacturerCandidate');

    res.status(200).json({
      success: true,
      message: 'Manufacturer candidate updated successfully',
      candidate: {
        id: candidate._id.toString(),
        pathogenName: candidate.pathogenName,
        name: candidate.name,
        manufacturer: candidate.manufacturer,
        platform: candidate.platform,
        clinicalPhase: candidate.clinicalPhase,
        companyUrl: candidate.companyUrl,
        other: candidate.other,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
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

// @desc    Delete manufacturer candidate
// @route   DELETE /api/manufacturer-candidates/:id
// @access  Private/Admin
exports.deleteManufacturerCandidate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const candidate = await ManufacturerCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    await ManufacturerCandidate.findByIdAndDelete(req.params.id);

    await updateLastUpdate('ManufacturerCandidate');

    res.status(200).json({
      success: true,
      message: 'Manufacturer candidate deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

function renderCandidatesTempFullTreeHtml(pathogens) {
  const pathogenBlocks = pathogens
    .map((p) => {
      const linkHref = (p.link || '').trim();
      const linkAttr =
        /^https?:\/\//i.test(linkHref) ? ` href="${escapeHtml(linkHref)}"` : '';
      const candidatesHtml =
        p.candidates.length === 0
          ? '<p class="muted">No candidate vaccines matched this pathogen.</p>'
          : p.candidates
              .map(
                (c) => `<section class="candidate">
  <header class="candidate-head">
    <h4>${escapeHtml(c.name)}</h4>
    <span class="pill">${escapeHtml(c.clinicalPhase || '—')}</span>
  </header>
  <p class="muted small">Candidate ID: ${escapeHtml(c.id)} · Pathogen on record: ${escapeHtml(
                  c.pathogenNameOnRecord
                )}</p>
  <dl class="field-list">
    <div class="dl-row"><dt>Manufacturer (raw)</dt><dd class="multiline">${escapeHtml(
      c.manufacturer || '—'
    )}</dd></div>
    <div class="dl-row"><dt>Platform</dt><dd class="multiline">${escapeHtml(
      c.platform || '—'
    )}</dd></div>
    <div class="dl-row"><dt>Clinical phase</dt><dd>${escapeHtml(c.clinicalPhase || '—')}</dd></div>
    <div class="dl-row"><dt>Company URL</dt><dd>${
      c.companyUrl && /^https?:\/\//i.test(c.companyUrl.trim())
        ? `<a href="${escapeHtml(c.companyUrl.trim())}" target="_blank" rel="noopener">${escapeHtml(
            c.companyUrl.trim()
          )}</a>`
        : escapeHtml(c.companyUrl || '—')
    }</dd></div>
    <div class="dl-row"><dt>Other</dt><dd class="multiline">${escapeHtml(c.other || '—')}</dd></div>
    <div class="dl-row"><dt>Created / updated</dt><dd class="small muted">${escapeHtml(
      c.createdAt ? new Date(c.createdAt).toISOString() : '—'
    )} · ${escapeHtml(c.updatedAt ? new Date(c.updatedAt).toISOString() : '—')}</dd></div>
  </dl>
  <h5 class="subsection-title">Manufacturer (full records)</h5>
  ${renderManufacturerSectionHtml(c.manufacturerDetails || [], {
    emptyMessage: 'No manufacturer name on this candidate record.',
    listingLabel: 'Listed on candidate',
  })}
</section>`
              )
              .join('');

      return `<article class="pathogen-card" id="p-${escapeHtml(p.id)}">
  <header class="pathogen-head">
    <h2>${escapeHtml(p.name)}</h2>
    <p class="id-line muted">Pathogen ID: ${escapeHtml(p.id)}</p>
  </header>
  ${
    p.description
      ? `<section class="block"><h3>Description</h3><div class="multiline body-text">${escapeHtml(
          p.description
        )}</div></section>`
      : ''
  }
  ${
    linkAttr
      ? `<p class="block"><a class="ext-link"${linkAttr} target="_blank" rel="noopener">${escapeHtml(
          linkHref
        )}</a></p>`
      : ''
  }
  <section class="block">
    <h3>Candidate vaccines <span class="count-badge">${p.candidates.length}</span></h3>
    ${candidatesHtml}
  </section>
</article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Candidate vaccines by pathogen (temporary)</title>
  <style>
    :root {
      --bg: #f4f6f9;
      --card: #fff;
      --text: #1a2332;
      --muted: #5c6b7f;
      --border: #d8dee9;
      --accent: #0d6efd;
      --accent-soft: #e7f1ff;
      --nest-bg: #fafbfc;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 15px; line-height: 1.55; color: var(--text); background: var(--bg); }
    .page-header {
      background: linear-gradient(135deg, #14532d 0%, #16a34a 100%);
      color: #fff;
      padding: 1.75rem 1.25rem 2rem;
      margin-bottom: 1.5rem;
    }
    .page-header h1 { margin: 0 0 0.5rem; font-size: 1.65rem; font-weight: 700; }
    .page-header p { margin: 0; opacity: 0.92; max-width: 52rem; }
    .page-header .hint { margin-top: 1rem; font-size: 0.85rem; opacity: 0.88; }
    .page-header code { background: rgba(255,255,255,0.15); padding: 0.15rem 0.4rem; border-radius: 4px; }
    main { max-width: 960px; margin: 0 auto 3rem; padding: 0 1rem; }
    .pathogen-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.35rem 1.5rem 1.75rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border-left: 4px solid #16a34a;
    }
    .pathogen-head h2 { margin: 0 0 0.25rem; font-size: 1.35rem; }
    .id-line { margin: 0; font-size: 0.8rem; }
    .muted { color: var(--muted); }
    .small { font-size: 0.85rem; }
    .block { margin-top: 1.25rem; }
    .block h3 { margin: 0 0 0.75rem; font-size: 1rem; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .body-text { color: #334155; }
    .multiline { white-space: pre-wrap; word-break: break-word; }
    .ext-link { color: var(--accent); }
    .field-list { margin: 0; }
    .dl-row { margin-bottom: 0.65rem; }
    .field-list dt { font-weight: 600; font-size: 0.82rem; color: var(--muted); margin-bottom: 0.15rem; }
    .field-list dd { margin: 0; }
    .count-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--accent-soft);
      color: var(--accent);
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
    }
    .candidate {
      background: var(--nest-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem 1.1rem 1.25rem;
      margin-top: 1rem;
    }
    .candidate-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.65rem;
      margin-bottom: 0.75rem;
    }
    .candidate-head h4 { margin: 0; font-size: 1.05rem; flex: 1 1 auto; }
    .subsection-title {
      margin: 1.1rem 0 0.5rem;
      font-size: 0.95rem;
      color: #2c3e50;
    }
    .pill {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      background: #e8ecf1;
      color: #475569;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
    }
    ${manufacturerTempTreeStyles}
  </style>
</head>
<body>
  <header class="page-header">
    <h1>Candidate vaccines by pathogen</h1>
    <p style="margin:0.75rem 0 0;">Manufacturer rows on each candidate are matched to full manufacturer profiles. Pathogen matching uses the same rules as licensed vaccines.</p>
    <p class="hint">Raw JSON: <code>?format=json</code> · PDF download: <code>?format=pdf</code></p>
  </header>
  <main>
    <p class="muted" style="margin:0 0 1.25rem;"><strong>${pathogens.length}</strong> pathogen(s).</p>
    ${pathogenBlocks}
  </main>
</body>
</html>`;
}

// TEMPORARY: pathogens with nested manufacturer candidates + manufacturer profiles.
// @route   GET /api/manufacturer-candidates/temp-full-tree
// @access  Public
exports.getManufacturerCandidatesTempFullTree = async (req, res) => {
  try {
    const pathogens = await Pathogen.find().sort({ name: 1 });

    const formatted = await Promise.all(
      pathogens.map(async (p) => {
        const candidateQuery = pathogenNameToCandidateQuery(p.name);
        const candidates = await ManufacturerCandidate.find(candidateQuery).sort({
          pathogenName: 1,
          name: 1,
        });

        const candidatesFormatted = await Promise.all(
          candidates.map(async (c) => ({
            id: c._id.toString(),
            pathogenNameOnRecord: c.pathogenName,
            name: c.name,
            manufacturer: c.manufacturer,
            platform: c.platform,
            clinicalPhase: c.clinicalPhase,
            companyUrl: c.companyUrl,
            other: c.other,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            manufacturerDetails: await resolveManufacturerDetailsByCommaNames(c.manufacturer),
          }))
        );

        return {
          id: p._id.toString(),
          name: p.name,
          description: p.description,
          image: p.image,
          bulletpoints: p.bulletpoints,
          link: p.link,
          vaccineNames: p.vaccineNames,
          candidateVaccineNames: p.candidateVaccineNames,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          candidates: candidatesFormatted,
        };
      })
    );

    const html = renderCandidatesTempFullTreeHtml(formatted);
    return await replyTempFullTree(req, res, {
      jsonPayload: {
        success: true,
        count: formatted.length,
        pathogens: formatted,
      },
      html,
      pdfFilename: 'manufacturer-candidates-temp-full-tree.pdf',
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
