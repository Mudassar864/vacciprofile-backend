// Shared pathogen name matching for Vaccine.pathogenNames and ManufacturerCandidate.pathogenName

function generatePathogenSearchPatterns(pathogenName) {
  const patterns = [];
  const name = pathogenName.trim();

  patterns.push(name);

  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const abbreviation = parenMatch[1].trim();
    patterns.push(abbreviation);

    const nameWithoutParens = name.replace(/\s*\([^)]+\)\s*/g, '').trim();
    if (nameWithoutParens) {
      patterns.push(nameWithoutParens);
    }
  }

  const withoutVirus = name.replace(/\s*(virus|viruses)\s*/gi, '').trim();
  if (withoutVirus && withoutVirus !== name) {
    patterns.push(withoutVirus);
  }

  const aliasMap = {
    'human papilloma': ['HPV', 'Human Papillomavirus', 'Papillomavirus', 'Human Papilloma'],
    'human papillomavirus': ['HPV', 'Human Papilloma Virus', 'Papillomavirus', 'Human Papilloma'],
    'japanese encephalitis': ['JEV', 'Japanese Encephalitis'],
    'monkeypox': ['MPV', 'MPXV', 'hMPXV', 'Monkey pox', 'Monkey Pox'],
    rabies: ['RabV', 'Rabies Virus', 'Rabies virus'],
    'respiratory syncytial': ['RSV', 'Respiratory Syncytial'],
    'severe acute respiratory syndrome coronavirus 2': [
      'SARS-CoV-2',
      'SARS-CoV2',
      'SARS-CoV 2',
      'COVID-19',
      'COVID19',
      'SARS-CoV-2',
      'SARS CoV-2',
      'SARS CoV 2',
    ],
    'sars-cov-2': ['Severe Acute Respiratory Syndrome Coronavirus 2', 'COVID-19', 'COVID19', 'SARS-CoV2'],
    'covid-19': ['Severe Acute Respiratory Syndrome Coronavirus 2', 'SARS-CoV-2', 'SARS-CoV2'],
    'tick-borne encephalitis': ['TBE', 'Tick Borne Encephalitis', 'Tick-Borne Encephalitis'],
    'varicella-zoster': [
      'VZV',
      'Varicella Zoster Virus',
      'Varicella-Zoster Virus',
      'Chickenpox',
      'Herpes Zoster',
      'Varicella',
    ],
  };

  const nameLower = name.toLowerCase();
  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      patterns.push(...aliases);
    }
  }

  return [...new Set(patterns.filter((p) => p && p.length > 0))];
}

function pathogenNameToVaccineQuery(pathogenName) {
  const searchPatterns = generatePathogenSearchPatterns(pathogenName);
  if (searchPatterns.length > 0) {
    return {
      $or: searchPatterns.map((pattern) => ({
        pathogenNames: {
          $regex: pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          $options: 'i',
        },
      })),
    };
  }
  return {
    pathogenNames: {
      $regex: pathogenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i',
    },
  };
}

function pathogenNameToCandidateQuery(pathogenName) {
  const searchPatterns = generatePathogenSearchPatterns(pathogenName);
  if (searchPatterns.length > 0) {
    return {
      $or: searchPatterns.map((pattern) => ({
        pathogenName: {
          $regex: pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          $options: 'i',
        },
      })),
    };
  }
  return {
    pathogenName: {
      $regex: pathogenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i',
    },
  };
}

module.exports = {
  generatePathogenSearchPatterns,
  pathogenNameToVaccineQuery,
  pathogenNameToCandidateQuery,
};
