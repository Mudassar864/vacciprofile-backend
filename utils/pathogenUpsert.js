const Pathogen = require('../models/Pathogen');
const { pathogenDocumentFromParsed } = require('./formatPathogenResponse');

function pickTrimmed(value) {
  if (value == null) return '';
  return String(value).trim();
}

/**
 * Create a pathogen or update an existing one matched by exact name (trimmed).
 */
async function upsertPathogenByName(parsed) {
  const name = pickTrimmed(parsed.name);
  if (!name) {
    throw new Error('Pathogen name is required');
  }

  const existing = await Pathogen.findOne({ name });

  if (existing) {
    const updateData = pathogenDocumentFromParsed({ ...parsed, name }, { partial: true });
    const pathogen = await Pathogen.findByIdAndUpdate(existing._id, updateData, {
      new: true,
      runValidators: true,
    });
    return { pathogen, created: false };
  }

  const pathogen = await Pathogen.create(pathogenDocumentFromParsed({ ...parsed, name }));
  return { pathogen, created: true };
}

module.exports = { upsertPathogenByName };
