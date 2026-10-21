const { escapeHtml } = require('./htmlEscape');

const manufacturerTempTreeStyles = `
    .mfr-grid { display: flex; flex-direction: column; gap: 0.85rem; margin-top: 0.35rem; }
    .mfr-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      border-top: 3px solid #475569;
    }
    .mfr-card.mfr-unmatched {
      border-top-color: #d97706;
      background: #fffbeb;
    }
    .mfr-head { margin: 0 0 0.35rem; font-size: 1rem; font-weight: 700; color: #1e293b; }
    .mfr-sub { margin: 0 0 0.75rem; font-size: 0.82rem; color: var(--muted); }
    .mfr-dl { margin-top: 0.25rem; }
`;

function renderManufacturerSectionHtml(details, options = {}) {
  const emptyMessage =
    options.emptyMessage || 'No manufacturer names on this record.';
  const listingLabel = options.listingLabel || 'Listed on vaccine';
  const dbNameLabel = options.dbNameLabel || 'Database name';

  const fmtDd = (v) => {
    if (v == null || String(v).trim() === '') return '<span class="muted">—</span>';
    return `<span class="multiline">${escapeHtml(String(v))}</span>`;
  };
  const fmtWebsite = (v) => {
    const u = (v || '').trim();
    if (/^https?:\/\//i.test(u)) {
      return `<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u)}</a>`;
    }
    return fmtDd(v);
  };

  if (!details || details.length === 0) {
    return `<p class="muted">${escapeHtml(emptyMessage)}</p>`;
  }

  return `<div class="mfr-grid">${details
    .map((m) => {
      if (!m.matched) {
        return `<article class="mfr-card mfr-unmatched">
  <h5 class="mfr-head">Manufacturer (not in database)</h5>
  <p class="mfr-sub">${escapeHtml(listingLabel)}: <strong>${escapeHtml(m.nameFromVaccine)}</strong></p>
  <p class="muted small">No manufacturer document matched this name (exact or case-insensitive).</p>
</article>`;
      }
      const listedDiff =
        m.nameFromVaccine !== m.name
          ? `<p class="mfr-sub">${escapeHtml(listingLabel)}: <strong>${escapeHtml(
              m.nameFromVaccine
            )}</strong> · ${escapeHtml(dbNameLabel)}: <strong>${escapeHtml(m.name)}</strong></p>`
          : '';
      return `<article class="mfr-card">
  <h5 class="mfr-head">${escapeHtml(m.name)}</h5>
  ${listedDiff}
  <dl class="field-list mfr-dl">
    <div class="dl-row"><dt>Description</dt><dd>${fmtDd(m.description)}</dd></div>
    <div class="dl-row"><dt>History</dt><dd>${fmtDd(m.history)}</dd></div>
    <div class="dl-row"><dt>Last updated</dt><dd>${fmtDd(m.lastUpdated)}</dd></div>
    <div class="dl-row"><dt>Website</dt><dd>${fmtWebsite(m.details_website)}</dd></div>
    <div class="dl-row"><dt>Founded</dt><dd>${fmtDd(m.details_founded)}</dd></div>
    <div class="dl-row"><dt>Headquarters</dt><dd>${fmtDd(m.details_headquarters)}</dd></div>
    <div class="dl-row"><dt>CEO</dt><dd>${fmtDd(m.details_ceo)}</dd></div>
    <div class="dl-row"><dt>Revenue</dt><dd>${fmtDd(m.details_revenue)}</dd></div>
    <div class="dl-row"><dt>Operating income</dt><dd>${fmtDd(m.details_operatingIncome)}</dd></div>
    <div class="dl-row"><dt>Net income</dt><dd>${fmtDd(m.details_netIncome)}</dd></div>
    <div class="dl-row"><dt>Total assets</dt><dd>${fmtDd(m.details_totalAssets)}</dd></div>
    <div class="dl-row"><dt>Total equity</dt><dd>${fmtDd(m.details_totalEquity)}</dd></div>
    <div class="dl-row"><dt>Number of employees</dt><dd>${fmtDd(m.details_numberOfEmployees)}</dd></div>
    <div class="dl-row"><dt>Products</dt><dd>${fmtDd(m.details_products)}</dd></div>
    <div class="dl-row"><dt>Licensed vaccine names</dt><dd>${fmtDd(m.licensedVaccineNames)}</dd></div>
    <div class="dl-row"><dt>Candidate vaccine names</dt><dd>${fmtDd(m.candidateVaccineNames)}</dd></div>
    <div class="dl-row"><dt>Record ID</dt><dd><span class="small muted">${escapeHtml(m.id)}</span></dd></div>
    <div class="dl-row"><dt>Created / updated</dt><dd class="small">${fmtDd(
      m.createdAt ? new Date(m.createdAt).toISOString() : ''
    )} · ${fmtDd(m.updatedAt ? new Date(m.updatedAt).toISOString() : '')}</dd></div>
  </dl>
</article>`;
    })
    .join('')}</div>`;
}

module.exports = {
  renderManufacturerSectionHtml,
  manufacturerTempTreeStyles,
  escapeHtml,
};
