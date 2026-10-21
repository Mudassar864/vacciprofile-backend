const { formatLicensingAuthorityDoc } = require('./formatLicensingAuthorityResponse');

const SKIP_ACRONYMS = new Set(['EMA', 'EEA', 'WHO']);

const REGULATORY_ALIASES_BY_COUNTRY = {
  'United States': [
    'FDA',
    'US FDA',
    'U.S. FDA',
    'Food and Drug Administration',
    'U.S. Food and Drug Administration',
  ],
  'United States of America': ['FDA', 'US FDA', 'U.S. FDA', 'Food and Drug Administration'],
  'United Kingdom': ['MHRA', 'UK MHRA', 'Medicines and Healthcare products Regulatory Agency'],
  Canada: ['Health Canada'],
  Australia: ['TGA', 'Therapeutic Goods Administration'],
  Switzerland: ['Swissmedic'],
  Japan: ['PMDA', 'MHLW'],
  China: ['NMPA'],
  India: ['CDSCO'],
  Brazil: ['ANVISA'],
  'South Korea': ['MFDS', 'Korea FDA'],
};

function isNaValue(value) {
  const trimmed = String(value || '').trim();
  return !trimmed || trimmed.toLowerCase() === 'n/a';
}

function getCountriesForRegulatoryAuthority(authorityName) {
  const norm = String(authorityName || '').trim().toLowerCase();
  if (!norm) return [];
  const countries = [];
  for (const [country, aliases] of Object.entries(REGULATORY_ALIASES_BY_COUNTRY)) {
    if (country.toLowerCase() === norm || aliases.some((alias) => alias.toLowerCase() === norm)) {
      countries.push(country);
    }
  }
  return countries;
}

function getAllMatchKeysForLicenser(licenser) {
  const keys = [];
  const ac = String(licenser.acronym || '').trim();
  const full = String(licenser.fullName || '').trim();
  const country = String(licenser.country || '').trim();

  if (ac) {
    keys.push(ac);
    const beforeParen = ac.match(/^([^(]+)\(/)?.[1]?.trim();
    if (beforeParen) keys.push(beforeParen);
    const insideParen = ac.match(/\(([^)]+)\)/)?.[1]?.trim();
    if (insideParen) keys.push(insideParen);
  }
  if (full) keys.push(full);
  if (country) keys.push(country);
  if (full && country) keys.push(`${full} (${country})`);
  if (full && ac) keys.push(`${full} (${ac})`);

  for (const alias of REGULATORY_ALIASES_BY_COUNTRY[country] || []) {
    keys.push(alias);
  }

  const acronym = ac.toUpperCase();
  if (acronym === 'EMA' || acronym === 'EEA') {
    keys.push('EMA', 'EEA', 'European Medicines Agency');
  }
  if (acronym === 'WHO') {
    keys.push('WHO', 'World Health Organization');
  }

  return Array.from(new Set(keys.filter(Boolean)));
}

function indexKeys(row) {
  const keys = [];
  const authority = String(row.vaccine_regulatory_authority || row.regulatory_authority_or_country || '').trim();
  const country = String(row.vaccine_country || '').trim();
  if (!isNaValue(authority)) keys.push(authority);
  if (!isNaValue(country)) keys.push(country);
  for (const key of [...keys]) {
    for (const countryName of getCountriesForRegulatoryAuthority(key)) {
      if (!isNaValue(countryName)) keys.push(countryName);
    }
  }
  return Array.from(new Set(keys.map((key) => key.toLowerCase())));
}

function rowIdentity(row) {
  return [
    row.vaccineName,
    row.vaccine_country,
    row.vaccine_regulatory_authority,
    row.regulatory_authority_or_country,
    row.approvalDate,
    row.approval_route,
    row.market_status,
    row.source,
  ]
    .map((part) => String(part ?? '').trim().toLowerCase())
    .join('|');
}

function deriveCountries(licensers) {
  const seen = new Set();
  for (const licenser of licensers || []) {
    const acronym = String(licenser.acronym || '').trim().toUpperCase();
    if (acronym && SKIP_ACRONYMS.has(acronym)) continue;
    const country = String(licenser.country || '').trim();
    if (country) seen.add(country);
  }
  return Array.from(seen);
}

/**
 * Sidebar counts only. Keeps full license documents on the server.
 */
function computeCountryCounts(licensers, licensingDocs) {
  const rows = (licensingDocs || [])
    .map((doc) => formatLicensingAuthorityDoc(doc))
    .filter((row) => row && String(row.vaccineName || '').trim());

  const rowsByKey = new Map();
  rows.forEach((row, index) => {
    for (const key of indexKeys(row)) {
      if (!rowsByKey.has(key)) rowsByKey.set(key, []);
      rowsByKey.get(key).push(index);
    }
  });

  const counts = {};
  for (const country of deriveCountries(licensers)) {
    const licenser = (licensers || []).find((item) => String(item.country || '').trim() === country);
    if (!licenser) {
      counts[country] = 0;
      continue;
    }

    const candidateIndexes = new Set();
    for (const key of getAllMatchKeysForLicenser(licenser)) {
      const matches = rowsByKey.get(key.trim().toLowerCase());
      if (!matches) continue;
      for (const index of matches) candidateIndexes.add(index);
    }

    const seen = new Set();
    let total = 0;
    for (const index of candidateIndexes) {
      const row = rows[index];
      const rowCountry = String(row.vaccine_country || '').trim();
      if (rowCountry && rowCountry !== country) continue;
      const identity = rowIdentity(row);
      if (seen.has(identity)) continue;
      seen.add(identity);
      total += 1;
    }

    counts[country] = total;
  }

  return counts;
}

module.exports = { computeCountryCounts };
