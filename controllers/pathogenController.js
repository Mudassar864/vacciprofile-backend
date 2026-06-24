const Pathogen = require('../models/Pathogen');
const Vaccine = require('../models/Vaccine');
const LicensingAuthority = require('../models/LicensingAuthority');
const ProductProfile = require('../models/ProductProfile');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { pathogenNameToVaccineQuery } = require('../utils/pathogenNameQueries');
const { resolveManufacturerDetailsByCommaNames } = require('../utils/enrichManufacturers');
const { escapeHtml } = require('../utils/htmlEscape');
const {
  renderManufacturerSectionHtml,
  manufacturerTempTreeStyles,
} = require('../utils/tempTreeManufacturerHtml');
const { replyTempFullTree, wantsJson } = require('../utils/tempFullTreeReply');
const { parsePaginationQuery, paginateQuery } = require('../utils/pagination');
const { formatLicensingAuthorityDoc } = require('../utils/formatLicensingAuthorityResponse');

function formatAuthorityRow(ld) {
  return formatLicensingAuthorityDoc(ld);
}

function formatProductProfileLabel(pp) {
  return {
    id: pp._id.toString(),
    vaccineName: pp.vaccineName,
    type: pp.type,
    name: pp.name,
    composition: pp.composition,
    strainCoverage: pp.strainCoverage,
    indication: pp.indication,
    contraindication: pp.contraindication,
    dosing: pp.dosing,
    immunogenicity: pp.immunogenicity,
    Efficacy: pp.Efficacy,
    durationOfProtection: pp.durationOfProtection,
    coAdministration: pp.coAdministration,
    reactogenicity: pp.reactogenicity,
    safety: pp.safety,
    vaccinationGoal: pp.vaccinationGoal,
    others: pp.others,
    createdAt: pp.createdAt,
    updatedAt: pp.updatedAt,
  };
}

function renderTempFullTreeHtml(pathogens) {
  const labelFieldRows = (label) => {
    const pairs = [
      ['Composition', label.composition],
      ['Strain coverage', label.strainCoverage],
      ['Indication', label.indication],
      ['Contraindication', label.contraindication],
      ['Dosing', label.dosing],
      ['Immunogenicity', label.immunogenicity],
      ['Efficacy', label.Efficacy],
      ['Duration of protection', label.durationOfProtection],
      ['Co-administration', label.coAdministration],
      ['Reactogenicity', label.reactogenicity],
      ['Safety', label.safety],
      ['Vaccination goal', label.vaccinationGoal],
      ['Other', label.others],
    ];
    return pairs
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(
        ([k, v]) =>
          `<div class="dl-row"><dt>${escapeHtml(k)}</dt><dd class="multiline">${escapeHtml(
            String(v)
          )}</dd></div>`
      )
      .join('');
  };

  const pathogenBlocks = pathogens
    .map((p) => {
      const linkHref = (p.link || '').trim();
      const linkAttr =
        /^https?:\/\//i.test(linkHref) ? ` href="${escapeHtml(linkHref)}"` : '';
      const vaccinesHtml =
        p.vaccines.length === 0
          ? '<p class="muted">No matching vaccines in the database for this pathogen.</p>'
          : p.vaccines
              .map((v) => {
                const authorityRows =
                  v.authority.length === 0
                    ? '<tr><td colspan="5" class="muted">No licensing rows.</td></tr>'
                    : v.authority
                        .map(
                          (a) => `<tr>
  <td>${escapeHtml(a.regulatory_authority_or_country || '—')}</td>
  <td>${escapeHtml(a.approvalDate)}</td>
  <td>${a.source && /^https?:\/\//i.test(a.source.trim()) ? `<a href="${escapeHtml(a.source.trim())}" target="_blank" rel="noopener">Source</a>` : escapeHtml(a.source || '—')}</td>
  <td class="muted small">${escapeHtml(a.approval_route || '—')}</td>
  <td class="muted small">${escapeHtml(a.market_status || '—')}</td>
</tr>`
                        )
                        .join('');

                const labelsHtml =
                  v.labels.length === 0
                    ? '<p class="muted">No product profile labels.</p>'
                    : v.labels
                        .map(
                          (lab) => `<article class="label-card">
  <h5 class="label-title"><span class="pill">${escapeHtml(lab.type)}</span> ${escapeHtml(
                            lab.name
                          )}</h5>
  <dl class="field-list">${labelFieldRows(lab)}</dl>
</article>`
                        )
                        .join('');

                return `<section class="vaccine">
  <header class="vaccine-head">
    <h4>${escapeHtml(v.name)}</h4>
    <span class="meta-inline"><strong>Type</strong> ${escapeHtml(
      v.vaccineType
    )}</span>
  </header>
  <dl class="inline-dl">
    <div><dt>Pathogens (vaccine record)</dt><dd class="multiline">${escapeHtml(
      v.pathogenNames
    )}</dd></div>
    <div><dt>Manufacturers (raw on vaccine)</dt><dd class="multiline">${escapeHtml(
      v.manufacturerNames
    )}</dd></div>
  </dl>
  <h5 class="subsection-title">Manufacturers (full records)</h5>
  ${renderManufacturerSectionHtml(v.manufacturerDetails || [], {
    emptyMessage: 'No manufacturer names on this vaccine record.',
    listingLabel: 'Listed on vaccine',
  })}
  <h5 class="subsection-title">Licensing authority</h5>
  <div class="table-wrap">
    <table class="data-table">
      <thead><tr><th>Authority / country</th><th>Approval date</th><th>Source</th><th>Approval route</th><th>Market status</th></tr></thead>
      <tbody>${authorityRows}</tbody>
    </table>
  </div>
  <h5 class="subsection-title">Labels (product profiles)</h5>
  <div class="labels-grid">${labelsHtml}</div>
</section>`;
              })
              .join('');

      return `<article class="pathogen-card" id="p-${escapeHtml(p.id)}">
  <header class="pathogen-head">
    <h2>${escapeHtml(p.name)}</h2>
    <p class="id-line muted">ID: ${escapeHtml(p.id)}</p>
  </header>
  ${
    p.description
      ? `<section class="block"><h3>Description</h3><div class="multiline body-text">${escapeHtml(
          p.description
        )}</div></section>`
      : ''
  }
  ${
    p.bulletpoints
      ? `<section class="block"><h3>Bullet points</h3><div class="multiline body-text">${escapeHtml(
          p.bulletpoints
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
    <h3>Reference lists on pathogen</h3>
    <dl class="field-list">
      <div class="dl-row"><dt>Vaccine names</dt><dd class="multiline">${escapeHtml(
        p.vaccineNames || '—'
      )}</dd></div>
      <div class="dl-row"><dt>Candidate vaccine names</dt><dd class="multiline">${escapeHtml(
        p.candidateVaccineNames || '—'
      )}</dd></div>
    </dl>
  </section>
  <section class="block vaccines-block">
    <h3>Vaccines linked to this pathogen <span class="count-badge">${p.vaccines.length}</span></h3>
    ${vaccinesHtml}
  </section>
</article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pathogens — full tree (temporary)</title>
  <style>
    :root {
      --bg: #f4f6f9;
      --card: #fff;
      --text: #1a2332;
      --muted: #5c6b7f;
      --border: #d8dee9;
      --accent: #0d6efd;
      --accent-soft: #e7f1ff;
      --vaccine-bg: #fafbfc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif;
      font-size: 15px;
      line-height: 1.55;
      color: var(--text);
      background: var(--bg);
    }
    .page-header {
      background: linear-gradient(135deg, #0d3a66 0%, #0d6efd 100%);
      color: #fff;
      padding: 1.75rem 1.25rem 2rem;
      margin-bottom: 1.5rem;
    }
    .page-header h1 { margin: 0 0 0.5rem; font-size: 1.65rem; font-weight: 700; }
    .page-header p { margin: 0; opacity: 0.92; max-width: 52rem; }
    .page-header .hint {
      margin-top: 1rem;
      font-size: 0.85rem;
      opacity: 0.88;
    }
    .page-header code { background: rgba(255,255,255,0.15); padding: 0.15rem 0.4rem; border-radius: 4px; }
    main { max-width: 960px; margin: 0 auto 3rem; padding: 0 1rem; }
    .pathogen-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.35rem 1.5rem 1.75rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border-left: 4px solid var(--accent);
    }
    .pathogen-head h2 { margin: 0 0 0.25rem; font-size: 1.35rem; }
    .id-line { margin: 0; font-size: 0.8rem; }
    .muted { color: var(--muted); }
    .small { font-size: 0.85rem; }
    .block { margin-top: 1.25rem; }
    .block h3 { margin: 0 0 0.5rem; font-size: 1rem; color: #2c3e50; }
    .body-text { color: #334155; }
    .multiline { white-space: pre-wrap; word-break: break-word; }
    .ext-link { color: var(--accent); }
    .field-list { margin: 0; }
    .dl-row { margin-bottom: 0.65rem; }
    .field-list dt { font-weight: 600; font-size: 0.82rem; color: var(--muted); margin-bottom: 0.15rem; }
    .field-list dd { margin: 0; }
    .inline-dl { margin: 0.75rem 0 0; display: grid; gap: 0.5rem; }
    .inline-dl dt { font-weight: 600; font-size: 0.8rem; color: var(--muted); }
    .inline-dl dd { margin: 0.15rem 0 0; }
    .vaccines-block h3 { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .count-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--accent-soft);
      color: var(--accent);
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
    }
    .vaccine {
      background: var(--vaccine-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem 1.1rem 1.25rem;
      margin-top: 1rem;
    }
    .vaccine-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.65rem;
      margin-bottom: 0.75rem;
    }
    .vaccine-head h4 { margin: 0; font-size: 1.1rem; }
    .meta-inline { font-size: 0.88rem; color: var(--muted); }
    .subsection-title {
      margin: 1.1rem 0 0.5rem;
      font-size: 0.95rem;
      color: #2c3e50;
    }
    .table-wrap { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .data-table th, .data-table td {
      padding: 0.5rem 0.65rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .data-table th { background: #eef2f7; font-weight: 600; color: #374151; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table a { color: var(--accent); }
    .labels-grid { display: flex; flex-direction: column; gap: 1rem; }
    .label-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
    }
    .label-title { margin: 0 0 0.75rem; font-size: 0.95rem; font-weight: 600; }
    .pill {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: #e8ecf1;
      color: #475569;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      margin-right: 0.35rem;
    }
    ${manufacturerTempTreeStyles}
  </style>
</head>
<body>
  <header class="page-header">
    <h1>Pathogens — vaccines, manufacturers, licensing, and labels</h1>
    <p style="margin:0.75rem 0 0;max-width:52rem;">Each vaccine lists full manufacturer records from the database (matched by name on the vaccine). Licensing rows and product profile labels follow.</p>
    <p class="hint">Raw JSON: <code>?format=json</code> · PDF download: <code>?format=pdf</code></p>
  </header>
  <main>
    <p class="muted" style="margin:0 0 1.25rem;"><strong>${pathogens.length}</strong> pathogen(s) total.</p>
    ${pathogenBlocks}
  </main>
</body>
</html>`;
}

// @desc    Get all pathogens
// @route   GET /api/pathogens
// @access  Private/Admin
exports.getPathogens = async (req, res) => {
  try {
    const pagination = parsePaginationQuery(req.query);
    const { docs: pathogens, total, pagination: paginationMeta } = await paginateQuery(
      Pathogen,
      {},
      { name: 1 },
      pagination
    );

    const formatted = pathogens.map((p) => ({
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
    }));

    const payload = {
      success: true,
      count: pagination.enabled ? total : formatted.length,
      pathogens: formatted,
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

// @desc    Get single pathogen
// @route   GET /api/pathogens/:id
// @access  Private/Admin
exports.getPathogen = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pathogen ID format',
      });
    }

    const pathogen = await Pathogen.findById(req.params.id);

    if (!pathogen) {
      return res.status(404).json({
        success: false,
        message: 'Pathogen not found',
      });
    }

    res.status(200).json({
      success: true,
      pathogen: {
        id: pathogen._id.toString(),
        name: pathogen.name,
        description: pathogen.description,
        image: pathogen.image,
        bulletpoints: pathogen.bulletpoints,
        link: pathogen.link,
        vaccineNames: pathogen.vaccineNames,
        candidateVaccineNames: pathogen.candidateVaccineNames,
        createdAt: pathogen.createdAt,
        updatedAt: pathogen.updatedAt,
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

// @desc    Create pathogen
// @route   POST /api/pathogens
// @access  Private/Admin
exports.createPathogen = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      bulletpoints,
      link,
      vaccineNames,
      candidateVaccineNames,
    } = req.body;

    // Check if pathogen already exists
    const pathogenExists = await Pathogen.findOne({ name: name.trim() });

    if (pathogenExists) {
      return res.status(400).json({
        success: false,
        message: 'Pathogen with this name already exists',
      });
    }

    const pathogen = await Pathogen.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      image: image ? image.trim() : '',
      bulletpoints: bulletpoints ? bulletpoints.trim() : '',
      link: link ? link.trim() : '',
      vaccineNames: vaccineNames ? vaccineNames.trim() : '',
      candidateVaccineNames: candidateVaccineNames ? candidateVaccineNames.trim() : '',
    });

    await updateLastUpdate('Pathogen');

    res.status(201).json({
      success: true,
      message: 'Pathogen created successfully',
      pathogen: {
        id: pathogen._id.toString(),
        name: pathogen.name,
        description: pathogen.description,
        image: pathogen.image,
        bulletpoints: pathogen.bulletpoints,
        link: pathogen.link,
        vaccineNames: pathogen.vaccineNames,
        candidateVaccineNames: pathogen.candidateVaccineNames,
        createdAt: pathogen.createdAt,
        updatedAt: pathogen.updatedAt,
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

// @desc    Update pathogen
// @route   PUT /api/pathogens/:id
// @access  Private/Admin
exports.updatePathogen = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pathogen ID format',
      });
    }

    let pathogen = await Pathogen.findById(req.params.id);

    if (!pathogen) {
      return res.status(404).json({
        success: false,
        message: 'Pathogen not found',
      });
    }

    // Check if name is being changed and if it's already taken
    if (req.body.name && req.body.name.trim() !== pathogen.name) {
      const nameExists = await Pathogen.findOne({
        name: req.body.name.trim(),
        _id: { $ne: req.params.id },
      });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Pathogen name already in use',
        });
      }
    }

    // Prepare update object - only include fields that are provided
    const updateData = {};
    const fields = [
      'name', 'description', 'image', 'bulletpoints', 'link',
      'vaccineNames', 'candidateVaccineNames'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = typeof req.body[field] === 'string' 
          ? req.body[field].trim() 
          : String(req.body[field]).trim();
      }
    });

    pathogen = await Pathogen.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('Pathogen');

    res.status(200).json({
      success: true,
      message: 'Pathogen updated successfully',
      pathogen: {
        id: pathogen._id.toString(),
        name: pathogen.name,
        description: pathogen.description,
        image: pathogen.image,
        bulletpoints: pathogen.bulletpoints,
        link: pathogen.link,
        vaccineNames: pathogen.vaccineNames,
        candidateVaccineNames: pathogen.candidateVaccineNames,
        createdAt: pathogen.createdAt,
        updatedAt: pathogen.updatedAt,
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

// @desc    Delete pathogen
// @route   DELETE /api/pathogens/:id
// @access  Private/Admin
exports.deletePathogen = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pathogen ID format',
      });
    }

    const pathogen = await Pathogen.findById(req.params.id);

    if (!pathogen) {
      return res.status(404).json({
        success: false,
        message: 'Pathogen not found',
      });
    }

    await Pathogen.findByIdAndDelete(req.params.id);

    await updateLastUpdate('Pathogen');

    res.status(200).json({
      success: true,
      message: 'Pathogen deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all pathogens with populated vaccines (including licensing dates, product profiles fetched on demand)
// @route   GET /api/pathogens/populated
// @access  Public
exports.getPathogensPopulated = async (req, res) => {
  try {
    const pathogens = await Pathogen.find().sort({ name: 1 });

    const formatted = await Promise.all(
      pathogens.map(async (p) => {
        const vaccineQuery = pathogenNameToVaccineQuery(p.name);

        // Find vaccines where any of the pathogen name patterns appear in pathogenNames
        const vaccines = await Vaccine.find(vaccineQuery).sort({ name: 1 });

        // For each vaccine, get licensing dates (product profiles fetched on demand)
        const vaccinesFormatted = await Promise.all(
          vaccines.map(async (v) => {
            // Find licensing dates for this vaccine
            const licensingAuthorities = await LicensingAuthority.find({
              vaccineName: v.name,
            }).sort({ approvalDate: 1 });

            // Product profiles are not included - they should be fetched on demand via /api/product-profiles?vaccineName=...

            const licensingAuthoritiesFormatted = licensingAuthorities.map((ld) =>
              formatLicensingAuthorityDoc(ld)
            );

            return {
              id: v._id.toString(),
              name: v.name,
              vaccineType: v.vaccineType,
              pathogenNames: v.pathogenNames,
              manufacturerNames: v.manufacturerNames,
              licensingAuthorities: licensingAuthoritiesFormatted,
              // productProfiles removed - fetch on demand via /api/product-profiles?vaccineName=...
              createdAt: v.createdAt,
              updatedAt: v.updatedAt,
            };
          })
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
          vaccines: vaccinesFormatted,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formatted.length,
      pathogens: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single pathogen with populated vaccines (including licensing dates, product profiles fetched on demand)
// @route   GET /api/pathogens/:id/populated
// @access  Public
exports.getPathogenPopulated = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pathogen ID format',
      });
    }

    const pathogen = await Pathogen.findById(req.params.id);

    if (!pathogen) {
      return res.status(404).json({
        success: false,
        message: 'Pathogen not found',
      });
    }

    const vaccineQuery = pathogenNameToVaccineQuery(pathogen.name);

    // Find vaccines where any of the pathogen name patterns appear in pathogenNames
    const vaccines = await Vaccine.find(vaccineQuery).sort({ name: 1 });

    // For each vaccine, get licensing dates (product profiles fetched on demand)
    const vaccinesFormatted = await Promise.all(
      vaccines.map(async (v) => {
        // Find licensing dates for this vaccine
        const licensingAuthorities = await LicensingAuthority.find({
          vaccineName: v.name,
        }).sort({ approvalDate: 1 });

        // Product profiles are not included - they should be fetched on demand via /api/product-profiles?vaccineName=...

        const licensingAuthoritiesFormatted = licensingAuthorities.map((ld) =>
          formatLicensingAuthorityDoc(ld)
        );

        return {
          id: v._id.toString(),
          name: v.name,
          vaccineType: v.vaccineType,
          pathogenNames: v.pathogenNames,
          manufacturerNames: v.manufacturerNames,
          licensingAuthorities: licensingAuthoritiesFormatted,
          // productProfiles removed - fetch on demand via /api/product-profiles?vaccineName=...
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      pathogen: {
        id: pathogen._id.toString(),
        name: pathogen.name,
        description: pathogen.description,
        image: pathogen.image,
        bulletpoints: pathogen.bulletpoints,
        link: pathogen.link,
        vaccineNames: pathogen.vaccineNames,
        candidateVaccineNames: pathogen.candidateVaccineNames,
        vaccines: vaccinesFormatted,
        createdAt: pathogen.createdAt,
        updatedAt: pathogen.updatedAt,
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

// TEMPORARY: full pathogen tree with vaccines including product profiles (labels) and licensing (authority).
// Remove when no longer needed for export/debugging.
// @route   GET /api/pathogens/temp-full-tree
// @access  Public
exports.getPathogensTempFullTree = async (req, res) => {
  try {
    const pathogens = await Pathogen.find().sort({ name: 1 });

    const formatted = await Promise.all(
      pathogens.map(async (p) => {
        const vaccineQuery = pathogenNameToVaccineQuery(p.name);
        const vaccines = await Vaccine.find(vaccineQuery).sort({ name: 1 });

        const vaccinesFormatted = await Promise.all(
          vaccines.map(async (v) => {
            const [licensingAuthorities, productProfiles, manufacturerDetails] = await Promise.all([
              LicensingAuthority.find({ vaccineName: v.name }).sort({ approvalDate: 1 }),
              ProductProfile.find({ vaccineName: v.name }).sort({ type: 1, name: 1 }),
              resolveManufacturerDetailsByCommaNames(v.manufacturerNames),
            ]);

            return {
              id: v._id.toString(),
              name: v.name,
              vaccineType: v.vaccineType,
              pathogenNames: v.pathogenNames,
              manufacturerNames: v.manufacturerNames,
              manufacturerDetails,
              createdAt: v.createdAt,
              updatedAt: v.updatedAt,
              labels: productProfiles.map(formatProductProfileLabel),
              authority: licensingAuthorities.map(formatAuthorityRow),
            };
          })
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
          vaccines: vaccinesFormatted,
        };
      })
    );

    const html = renderTempFullTreeHtml(formatted);
    return await replyTempFullTree(req, res, {
      jsonPayload: {
        success: true,
        count: formatted.length,
        pathogens: formatted,
      },
      html,
      pdfFilename: 'pathogens-temp-full-tree.pdf',
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
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Error</title></head><body style="font-family:system-ui;padding:2rem;"><h1>Something went wrong</h1><p>${escapeHtml(
          error.message
        )}</p><p><a href="?">Retry</a> · <a href="?format=json">JSON</a> · <a href="?format=pdf">PDF</a></p></body></html>`
      );
  }
};
