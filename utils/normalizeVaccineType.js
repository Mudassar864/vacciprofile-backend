/**
 * Maps s/S/single/Single and c/C/combination/Combination onto the stored enum.
 * Unrecognized values are returned trimmed and lowercased so validation can reject them.
 */
function normalizeVaccineType(value) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
  if (!raw) return '';

  const token = raw.split(' ')[0];
  if (raw === 'c' || token === 'c' || raw === 'combination' || raw.startsWith('combination')) {
    return 'combination';
  }
  if (raw === 's' || token === 's' || raw === 'single' || raw.startsWith('single')) {
    return 'single';
  }
  return raw;
}

module.exports = { normalizeVaccineType };
