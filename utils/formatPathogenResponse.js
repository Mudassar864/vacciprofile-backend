function pickTrimmed(value) {
  if (value == null) return '';
  return String(value).trim();
}

const CSV_TAG_SCIENTIFIC = '🟦 Tag 1 (Scientific Feature)';
const CSV_TAG_CHARACTERISTIC = '🟩 Tag 2 (Characteristic)';
const CSV_TAG_CLINICAL = '🟥 Tag 3 (Clinical/Public Health)';

/** Public CSV download/import columns (exact headers). */
const PATHOGEN_CSV_COLUMNS = [
  'name',
  'image',
  'link',
  'Category',
  CSV_TAG_SCIENTIFIC,
  CSV_TAG_CHARACTERISTIC,
  CSV_TAG_CLINICAL,
  'disease_name',
  'pathogen_type',
  'transmission_type',
  'who_priority_level',
  'vaccine_available',
  'first_identified_year',
  'definition',
  'transmission',
  'symptoms',
  'prevention',
  'key_facts',
  'video_title',
  'video_url',
  'thumbnail_url',
];

const PATHOGEN_DB_FIELDS = [
  'name',
  'image',
  'link',
  'category',
  'scientific_feature_tags',
  'characteristic_tags',
  'clinical_public_health_tags',
  'disease_name',
  'pathogen_type',
  'transmission_type',
  'who_priority_level',
  'vaccine_available',
  'first_identified_year',
  'definition',
  'transmission',
  'symptoms',
  'prevention',
  'key_facts',
  'video_title',
  'video_url',
  'thumbnail_url',
  'vaccine_names',
  'candidate_vaccine_names',
];

const CSV_HEADER_TO_DB = {
  name: 'name',
  image: 'image',
  link: 'link',
  Category: 'category',
  [CSV_TAG_SCIENTIFIC]: 'scientific_feature_tags',
  [CSV_TAG_CHARACTERISTIC]: 'characteristic_tags',
  [CSV_TAG_CLINICAL]: 'clinical_public_health_tags',
  disease_name: 'disease_name',
  pathogen_type: 'pathogen_type',
  transmission_type: 'transmission_type',
  who_priority_level: 'who_priority_level',
  vaccine_available: 'vaccine_available',
  first_identified_year: 'first_identified_year',
  definition: 'definition',
  transmission: 'transmission',
  symptoms: 'symptoms',
  prevention: 'prevention',
  key_facts: 'key_facts',
  video_title: 'video_title',
  video_url: 'video_url',
  thumbnail_url: 'thumbnail_url',
  vaccine_names: 'vaccine_names',
  candidate_vaccine_names: 'candidate_vaccine_names',
};

/** API / legacy aliases → canonical DB field */
const PAYLOAD_ALIASES = {
  name: ['name'],
  image: ['image'],
  link: ['link'],
  category: ['category', 'Category'],
  scientific_feature_tags: [
    'scientific_feature_tags',
    'scientificFeatureTags',
    CSV_TAG_SCIENTIFIC,
  ],
  characteristic_tags: ['characteristic_tags', 'characteristicTags', CSV_TAG_CHARACTERISTIC],
  clinical_public_health_tags: [
    'clinical_public_health_tags',
    'clinicalPublicHealthTags',
    CSV_TAG_CLINICAL,
  ],
  disease_name: ['disease_name', 'diseaseName', 'disease'],
  pathogen_type: ['pathogen_type', 'pathogenType'],
  transmission_type: ['transmission_type', 'transmissionType'],
  who_priority_level: ['who_priority_level', 'whoPriorityLevel', 'whoPriorityPathogen'],
  vaccine_available: ['vaccine_available', 'vaccineAvailable'],
  first_identified_year: ['first_identified_year', 'firstIdentifiedYear', 'firstIdentified'],
  definition: ['definition', 'description'],
  transmission: ['transmission', 'transmissionDetails'],
  symptoms: ['symptoms'],
  prevention: ['prevention'],
  key_facts: ['key_facts', 'keyFacts', 'bulletpoints'],
  video_title: ['video_title', 'videoTitle', 'aboutSummary'],
  video_url: ['video_url', 'videoUrl'],
  thumbnail_url: ['thumbnail_url', 'thumbnailUrl'],
  vaccine_names: ['vaccine_names', 'vaccineNames'],
  candidate_vaccine_names: ['candidate_vaccine_names', 'candidateVaccineNames'],
};

function firstFromSource(source, keys) {
  if (!source) return '';
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      const value = pickTrimmed(source[key]);
      if (value) return value;
    }
  }
  return '';
}

/** Normalize stored or legacy documents to canonical snake_case fields. */
function normalizePathogenFields(raw = {}) {
  const o = raw.toObject ? raw.toObject() : raw;
  const normalized = {};

  for (const field of PATHOGEN_DB_FIELDS) {
    normalized[field] = firstFromSource(o, PAYLOAD_ALIASES[field]);
  }

  // Legacy: short transmission lived in `transmission`; details in `transmissionDetails`
  if (!normalized.transmission_type) {
    const legacyShort = pickTrimmed(o.transmission);
    const legacyLong = pickTrimmed(o.transmissionDetails);
    if (legacyShort && legacyShort !== legacyLong) {
      normalized.transmission_type = legacyShort;
    }
  }
  if (!normalized.transmission && o.transmissionDetails) {
    normalized.transmission = pickTrimmed(o.transmissionDetails);
  } else if (!normalized.transmission && o.transmission && !normalized.transmission_type) {
    normalized.transmission = pickTrimmed(o.transmission);
  }

  if (!normalized.video_url && o.link && !normalized.link) {
    normalized.video_url = pickTrimmed(o.link);
  }

  return normalized;
}

function parsePathogenPayload(body = {}) {
  const result = {};

  for (const field of PATHOGEN_DB_FIELDS) {
    const aliasKeys = [...(PAYLOAD_ALIASES[field] || [field])];
    const csvHeader = DB_TO_CSV[field];
    if (csvHeader && !aliasKeys.includes(csvHeader)) {
      aliasKeys.push(csvHeader);
    }

    const hasExplicitValue = aliasKeys.some((key) =>
      Object.prototype.hasOwnProperty.call(body, key)
    );

    if (hasExplicitValue) {
      result[field] = firstFromSource(body, aliasKeys);
    }
  }

  if (!result.name) {
    result.name = firstFromSource(body, ['name']);
  }

  return result;
}

function pathogenDocumentFromParsed(parsed, { partial = false } = {}) {
  const document = {};
  for (const field of PATHOGEN_DB_FIELDS) {
    if (partial && !Object.prototype.hasOwnProperty.call(parsed, field)) {
      continue;
    }
    document[field] = pickTrimmed(parsed[field]);
  }
  return document;
}

function formatPathogenDoc(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  const fields = normalizePathogenFields(o);

  return {
    id: o._id || doc._id ? (o._id || doc._id).toString() : '',
    ...fields,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const DB_TO_CSV = Object.fromEntries(
  Object.entries(CSV_HEADER_TO_DB).map(([csv, db]) => [db, csv])
);

function toPathogenCsvRow(doc) {
  const formatted = formatPathogenDoc(doc);
  const row = {};
  for (const column of PATHOGEN_CSV_COLUMNS) {
    const dbField = CSV_HEADER_TO_DB[column];
    row[column] = formatted[dbField] ?? '';
  }
  return row;
}

function fromPathogenCsvRow(record = {}) {
  return parsePathogenPayload(record);
}

module.exports = {
  PATHOGEN_DB_FIELDS,
  PATHOGEN_CSV_COLUMNS,
  CSV_TAG_SCIENTIFIC,
  CSV_TAG_CHARACTERISTIC,
  CSV_TAG_CLINICAL,
  parsePathogenPayload,
  pathogenDocumentFromParsed,
  normalizePathogenFields,
  formatPathogenDoc,
  toPathogenCsvRow,
  fromPathogenCsvRow,
};
