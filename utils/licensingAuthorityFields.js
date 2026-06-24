const AUTHORITY_TO_COUNTRY = {
  FDA: 'United States',
  'US FDA': 'United States',
  'U.S. FDA': 'United States',
  'FOOD AND DRUG ADMINISTRATION': 'United States',
  MHRA: 'United Kingdom',
  'UK MHRA': 'United Kingdom',
  'HEALTH CANADA': 'Canada',
  TGA: 'Australia',
  SWISSMEDIC: 'Switzerland',
  PMDA: 'Japan',
  NMPA: 'China',
  CDSCO: 'India',
  ANVISA: 'Brazil',
  MFDS: 'South Korea',
  'KOREA FDA': 'South Korea',
  EMA: 'European Union',
  WHO: 'Global',
};

const KNOWN_COUNTRY_NAMES = new Set([
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Bahrain', 'Belgium', 'Brazil', 'Bulgaria', 'Canada', 'Chile', 'China', 'Colombia',
  'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Egypt', 'Estonia', 'Finland',
  'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'India', 'Ireland', 'Israel',
  'Italy', 'Japan', 'Kenya', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Mexico',
  'Moldova', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Peru', 'Poland',
  'Portugal', 'Romania', 'Russia', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia',
  'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Tanzania',
  'Togo', 'Turkey', 'Ukraine', 'United Kingdom', 'United States', 'United States of America',
]);

function pickTrimmed(record, ...keys) {
  for (const key of keys) {
    if (record[key] != null && String(record[key]).trim() !== '') {
      return String(record[key]).trim();
    }
  }
  return '';
}

function deriveCountryFromAuthority(authority) {
  const raw = (authority || '').trim();
  if (!raw || raw.toUpperCase() === 'N/A') return '';

  if (KNOWN_COUNTRY_NAMES.has(raw)) return raw;

  const upper = raw.toUpperCase();
  if (AUTHORITY_TO_COUNTRY[upper]) return AUTHORITY_TO_COUNTRY[upper];

  for (const [alias, country] of Object.entries(AUTHORITY_TO_COUNTRY)) {
    if (upper === alias || upper.includes(alias) || alias.includes(upper)) {
      return country;
    }
  }

  return raw;
}

/**
 * Normalize authority/country from stored data or API payloads.
 * Missing values become N/A only — no inferred country or authority.
 */
function resolveLicensingAuthorityFields(input = {}) {
  const legacy = pickTrimmed(input, 'regulatory_authority_or_country');
  let vaccine_regulatory_authority = pickTrimmed(
    input,
    'vaccine_regulatory_authority',
    'regulatoryAuthority',
    'regulatory_authority'
  );
  const vaccine_country = pickTrimmed(input, 'vaccine_country', 'country');

  if (!vaccine_regulatory_authority && legacy) {
    vaccine_regulatory_authority = legacy;
  }

  return {
    vaccine_regulatory_authority: vaccine_regulatory_authority || 'N/A',
    vaccine_country: vaccine_country || 'N/A',
  };
}

function parseLicensingAuthorityPayload(body = {}) {
  const vaccineName = pickTrimmed(body, 'vaccineName', 'vaccine_name');
  const { vaccine_regulatory_authority, vaccine_country } = resolveLicensingAuthorityFields(body);

  return {
    vaccineName,
    vaccine_regulatory_authority,
    vaccine_country,
    approvalDate: pickTrimmed(body, 'approvalDate', 'approval_date'),
    source: pickTrimmed(body, 'source') || 'N/A',
    approval_route: pickTrimmed(body, 'approval_route', 'approvalRoute') || 'N/A',
    market_status: pickTrimmed(body, 'market_status', 'marketStatus') || 'N/A',
  };
}

function buildAuthorityMatchOrConditions(keys) {
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return keys.flatMap((k) => {
    const exact = new RegExp(`^${escapeRegex(k)}$`, 'i');
    const partial = new RegExp(escapeRegex(k), 'i');
    return [
      { vaccine_regulatory_authority: { $regex: exact } },
      { vaccine_regulatory_authority: { $regex: partial } },
      { vaccine_country: { $regex: exact } },
      { vaccine_country: { $regex: partial } },
      { regulatory_authority_or_country: { $regex: exact } },
      { regulatory_authority_or_country: { $regex: partial } },
    ];
  });
}

function toCsvRow(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const { vaccine_regulatory_authority, vaccine_country } = resolveLicensingAuthorityFields(o);
  return {
    vaccineName: o.vaccineName || '',
    vaccine_regulatory_authority,
    vaccine_country,
    source: o.source || 'N/A',
    approvalDate: o.approvalDate || '',
    approval_route: o.approval_route || 'N/A',
    market_status: o.market_status || 'N/A',
  };
}

const CSV_COLUMNS = [
  'vaccineName',
  'vaccine_regulatory_authority',
  'vaccine_country',
  'source',
  'approvalDate',
  'approval_route',
  'market_status',
];

module.exports = {
  AUTHORITY_TO_COUNTRY,
  deriveCountryFromAuthority,
  resolveLicensingAuthorityFields,
  parseLicensingAuthorityPayload,
  buildAuthorityMatchOrConditions,
  toCsvRow,
  CSV_COLUMNS,
};
