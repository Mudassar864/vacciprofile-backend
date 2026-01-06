const Pathogen = require('../models/Pathogen');
const Vaccine = require('../models/Vaccine');
const LicensingDate = require('../models/LicensingDate');
const ProductProfile = require('../models/ProductProfile');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { clearPathogenCache } = require('../middleware/cacheHelper');

// Helper function to generate search patterns for a pathogen name
// Handles abbreviations, variations, and common aliases
function generatePathogenSearchPatterns(pathogenName) {
  const patterns = [];
  const name = pathogenName.trim();
  
  // Add the full name as-is
  patterns.push(name);
  
  // Extract abbreviation from parentheses (e.g., "Human Papilloma Virus (HPV)" -> "HPV")
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const abbreviation = parenMatch[1].trim();
    patterns.push(abbreviation);
    
    // Also try without parentheses
    const nameWithoutParens = name.replace(/\s*\([^)]+\)\s*/g, '').trim();
    if (nameWithoutParens) {
      patterns.push(nameWithoutParens);
    }
  }
  
  // Handle common variations
  // Remove "Virus" suffix variations
  const withoutVirus = name.replace(/\s*(virus|viruses)\s*/gi, '').trim();
  if (withoutVirus && withoutVirus !== name) {
    patterns.push(withoutVirus);
  }
  
  // Handle specific known aliases and variations
  const aliasMap = {
    'human papilloma': ['HPV', 'Human Papillomavirus', 'Papillomavirus', 'Human Papilloma'],
    'human papillomavirus': ['HPV', 'Human Papilloma Virus', 'Papillomavirus', 'Human Papilloma'],
    'japanese encephalitis': ['JEV', 'Japanese Encephalitis'],
    'monkeypox': ['MPV', 'MPXV', 'hMPXV', 'Monkey pox', 'Monkey Pox'],
    'rabies': ['RabV', 'Rabies Virus', 'Rabies virus'],
    'respiratory syncytial': ['RSV', 'Respiratory Syncytial'],
    'severe acute respiratory syndrome coronavirus 2': ['SARS-CoV-2', 'SARS-CoV2', 'SARS-CoV 2', 'COVID-19', 'COVID19', 'SARS-CoV-2', 'SARS CoV-2', 'SARS CoV 2'],
    'sars-cov-2': ['Severe Acute Respiratory Syndrome Coronavirus 2', 'COVID-19', 'COVID19', 'SARS-CoV2'],
    'covid-19': ['Severe Acute Respiratory Syndrome Coronavirus 2', 'SARS-CoV-2', 'SARS-CoV2'],
    'tick-borne encephalitis': ['TBE', 'Tick Borne Encephalitis', 'Tick-Borne Encephalitis'],
    'varicella-zoster': ['VZV', 'Varicella Zoster Virus', 'Varicella-Zoster Virus', 'Chickenpox', 'Herpes Zoster', 'Varicella'],
  };
  
  // Check for known aliases (case-insensitive partial matching)
  const nameLower = name.toLowerCase();
  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      patterns.push(...aliases);
    }
  }
  
  // Remove duplicates and empty strings
  return [...new Set(patterns.filter(p => p && p.length > 0))];
}

// @desc    Get all pathogens
// @route   GET /api/pathogens
// @access  Private/Admin
exports.getPathogens = async (req, res) => {
  try {
    const pathogens = await Pathogen.find().sort({ name: 1 });

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
    clearPathogenCache();

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
    clearPathogenCache();

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
    clearPathogenCache();

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
        // Generate multiple search patterns to handle abbreviations and variations
        const searchPatterns = generatePathogenSearchPatterns(p.name);
        
        // Build query to match any of the patterns
        // Escape regex special characters in each pattern
        const vaccineQuery = searchPatterns.length > 0 ? {
          $or: searchPatterns.map(pattern => ({
            pathogenNames: { $regex: pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
          }))
        } : {
          // Fallback to simple match if no patterns generated
          pathogenNames: { $regex: p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
        };
        
        // Find vaccines where any of the pathogen name patterns appear in pathogenNames
        const vaccines = await Vaccine.find(vaccineQuery).sort({ name: 1 });

        // For each vaccine, get licensing dates (product profiles fetched on demand)
        const vaccinesFormatted = await Promise.all(
          vaccines.map(async (v) => {
            // Find licensing dates for this vaccine
            const licensingDates = await LicensingDate.find({
              vaccineName: v.name,
            }).sort({ approvalDate: 1 });

            // Product profiles are not included - they should be fetched on demand via /api/product-profiles?vaccineName=...

            const licensingDatesFormatted = licensingDates.map((ld) => ({
              id: ld._id.toString(),
              vaccineName: ld.vaccineName,
              name: ld.name,
              type: ld.type,
              approvalDate: ld.approvalDate,
              source: ld.source,
              lastUpdateOnVaccine: ld.lastUpdateOnVaccine,
              createdAt: ld.createdAt,
              updatedAt: ld.updatedAt,
            }));

            return {
              id: v._id.toString(),
              name: v.name,
              vaccineType: v.vaccineType,
              pathogenNames: v.pathogenNames,
              manufacturerNames: v.manufacturerNames,
              licensingDates: licensingDatesFormatted,
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

    // Generate multiple search patterns to handle abbreviations and variations
    const searchPatterns = generatePathogenSearchPatterns(pathogen.name);
    
    // Build query to match any of the patterns
    // Escape regex special characters in each pattern
    const vaccineQuery = searchPatterns.length > 0 ? {
      $or: searchPatterns.map(pattern => ({
        pathogenNames: { $regex: pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
      }))
    } : {
      // Fallback to simple match if no patterns generated
      pathogenNames: { $regex: pathogen.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    };
    
    // Find vaccines where any of the pathogen name patterns appear in pathogenNames
    const vaccines = await Vaccine.find(vaccineQuery).sort({ name: 1 });

    // For each vaccine, get licensing dates (product profiles fetched on demand)
    const vaccinesFormatted = await Promise.all(
      vaccines.map(async (v) => {
        // Find licensing dates for this vaccine
        const licensingDates = await LicensingDate.find({
          vaccineName: v.name,
        }).sort({ approvalDate: 1 });

        // Product profiles are not included - they should be fetched on demand via /api/product-profiles?vaccineName=...

        const licensingDatesFormatted = licensingDates.map((ld) => ({
          id: ld._id.toString(),
          vaccineName: ld.vaccineName,
          name: ld.name,
          type: ld.type,
          approvalDate: ld.approvalDate,
          source: ld.source,
          lastUpdateOnVaccine: ld.lastUpdateOnVaccine,
          createdAt: ld.createdAt,
          updatedAt: ld.updatedAt,
        }));

        return {
          id: v._id.toString(),
          name: v.name,
          vaccineType: v.vaccineType,
          pathogenNames: v.pathogenNames,
          manufacturerNames: v.manufacturerNames,
          licensingDates: licensingDatesFormatted,
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

