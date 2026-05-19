const Manufacturer = require('../models/Manufacturer');

function formatManufacturerFull(m) {
  return {
    id: m._id.toString(),
    name: m.name,
    description: m.description,
    history: m.history,
    lastUpdated: m.lastUpdated,
    details_website: m.details_website,
    details_founded: m.details_founded,
    details_headquarters: m.details_headquarters,
    details_ceo: m.details_ceo,
    details_revenue: m.details_revenue,
    details_operatingIncome: m.details_operatingIncome,
    details_netIncome: m.details_netIncome,
    details_totalAssets: m.details_totalAssets,
    details_totalEquity: m.details_totalEquity,
    details_numberOfEmployees: m.details_numberOfEmployees,
    details_products: m.details_products,
    licensedVaccineNames: m.licensedVaccineNames,
    candidateVaccineNames: m.candidateVaccineNames,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/**
 * Resolves comma-separated manufacturer name tokens to Manufacturer documents.
 * Each result includes nameFromVaccine (token from source string) for traceability.
 */
async function resolveManufacturerDetailsByCommaNames(manufacturerNamesStr) {
  const tokens = (manufacturerNamesStr || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    let doc = await Manufacturer.findOne({ name: token });
    if (!doc) {
      doc = await Manufacturer.findOne({
        name: {
          $regex: new RegExp(`^${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        },
      });
    }
    if (doc) {
      out.push({ nameFromVaccine: token, matched: true, ...formatManufacturerFull(doc) });
    } else {
      out.push({ nameFromVaccine: token, matched: false });
    }
  }
  return out;
}

module.exports = {
  formatManufacturerFull,
  resolveManufacturerDetailsByCommaNames,
};
