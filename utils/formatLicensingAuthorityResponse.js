function normalizeApprovalDate(value) {
  if (value == null || typeof value === 'boolean') return '';
  const s = String(value).trim();
  if (!s || s.toLowerCase() === 'true' || s.toLowerCase() === 'false') return '';
  return s;
}

/**
 * Serialize a LicensingAuthority document for JSON APIs (single shape everywhere).
 */
function formatLicensingAuthorityDoc(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  const id = (o._id || doc._id).toString();
  return {
    id,
    vaccineName: o.vaccineName,
    regulatory_authority_or_country: o.regulatory_authority_or_country,
    type: o.type,
    source: o.source,
    approvalDate: normalizeApprovalDate(o.approvalDate),
    approval_route: o.approval_route,
    market_status: o.market_status,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

module.exports = { formatLicensingAuthorityDoc };
