const Vaccine = require('../models/Vaccine');
const LicensingDate = require('../models/LicensingDate');
const ProductProfile = require('../models/ProductProfile');
const Manufacturer = require('../models/Manufacturer');
const ManufacturerProduct = require('../models/ManufacturerProduct');
const ManufacturerSource = require('../models/ManufacturerSource');
const Pathogen = require('../models/Pathogen');
const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const NITAG = require('../models/NITAG');
const Licenser = require('../models/Licenser');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const { updateLastUpdate } = require('./lastUpdateController');

// Helper function to parse CSV with proper UTF-8 encoding handling
const parseCSV = async (buffer) => {
  // Handle UTF-8 encoding properly, including BOM (Byte Order Mark)
  let csvData = buffer.toString('utf-8');
  
  // Remove UTF-8 BOM if present (common in Excel exports)
  if (csvData.charCodeAt(0) === 0xFEFF) {
    csvData = csvData.slice(1);
  }
  
  // Normalize Unicode characters (handles special characters like ® properly)
  csvData = csvData.normalize('NFC');
  
  return new Promise((resolve, reject) => {
    parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle BOM automatically
      relax_quotes: true, // Handle quotes more flexibly
      escape: '"', // Proper escape character
      relax_column_count: true, // Handle inconsistent column counts
    }, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
};

// @desc    Import vaccines from CSV
// @route   POST /api/csv/import/vaccines
// @access  Private/Admin
exports.importVaccines = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    // Helper function to merge comma-separated strings without duplicates
    const mergeStringArrays = (existingStr, newStr) => {
      if (!existingStr || !existingStr.trim()) return newStr.trim();
      if (!newStr || !newStr.trim()) return existingStr.trim();
      
      const existing = existingStr.split(',').map(s => s.trim()).filter(Boolean);
      const newItems = newStr.split(',').map(s => s.trim()).filter(Boolean);
      
      const merged = [...new Set([...existing, ...newItems])];
      return merged.join(', ');
    };

    const results = {
      success: [],
      errors: [],
      updated: [],
    };

    // Log available column names from first record for debugging
    if (records.length > 0) {
      console.log('Total records to process:', records.length);
      console.log('CSV columns:', Object.keys(records[0]));
      console.log('First record sample:', JSON.stringify(records[0], null, 2));
    }

    for (const record of records) {
      try {
        // Use exact column name from CSV (should be 'name' based on your CSV)
        // Normalize Unicode to ensure special characters like ® are handled correctly
        const vaccineName = record.name ? String(record.name).trim().normalize('NFC') : '';
        
        if (!vaccineName) {
          results.errors.push({
            name: 'Unknown',
            error: 'Vaccine name is required. Columns found: ' + Object.keys(record).join(', '),
          });
          continue;
        }

        // Check if vaccine already exists
        const vaccineExists = await Vaccine.findOne({ name: vaccineName });

        console.log(`Processing ${vaccineName}: exists=${!!vaccineExists}, pathogenNames="${record.pathogenNames}", manufacturerNames="${record.manufacturerNames}"`);

        if (vaccineExists) {
          // Vaccine exists - merge manufacturerNames, pathogenNames, and update vaccineType if they don't match
          let updatedManufacturerNames = vaccineExists.manufacturerNames;
          let updatedPathogenNames = vaccineExists.pathogenNames;
          let updatedVaccineType = vaccineExists.vaccineType;
          let wasUpdated = false;

          // Use exact column names from CSV
          const recordVaccineType = record.vaccineType ? String(record.vaccineType).trim().toLowerCase() : null;
          
          if (recordVaccineType && ['single', 'combination'].includes(recordVaccineType) && recordVaccineType !== vaccineExists.vaccineType) {
            updatedVaccineType = recordVaccineType;
            wasUpdated = true;
          }

          // Use exact column names from CSV for manufacturerNames
          const recordManufacturerNames = record.manufacturerNames ? String(record.manufacturerNames).trim() : '';

          if (recordManufacturerNames) {
            const existingManufacturers = (vaccineExists.manufacturerNames || '').split(',').map(s => s.trim().toLowerCase());
            const newManufacturers = recordManufacturerNames.split(',').map(s => s.trim()).filter(Boolean);
            
            // Check if any new manufacturer doesn't exist
            const hasNewManufacturer = newManufacturers.some(m => 
              !existingManufacturers.includes(m.trim().toLowerCase())
            );

            if (hasNewManufacturer) {
              updatedManufacturerNames = mergeStringArrays(vaccineExists.manufacturerNames, recordManufacturerNames);
              wasUpdated = true;
            }
          }

          // Use exact column names from CSV for pathogenNames
          const recordPathogenNames = record.pathogenNames ? String(record.pathogenNames).trim() : '';

          if (recordPathogenNames) {
            const existingPathogens = (vaccineExists.pathogenNames || '').split(',').map(s => s.trim().toLowerCase());
            const newPathogens = recordPathogenNames.split(',').map(s => s.trim()).filter(Boolean);
            
            // Check if any new pathogen doesn't exist
            const hasNewPathogen = newPathogens.some(p => 
              !existingPathogens.includes(p.trim().toLowerCase())
            );

            if (hasNewPathogen) {
              updatedPathogenNames = mergeStringArrays(vaccineExists.pathogenNames, recordPathogenNames);
              wasUpdated = true;
            }
          }

          // Update vaccine if there were changes
          if (wasUpdated) {
            try {
              vaccineExists.manufacturerNames = updatedManufacturerNames;
              vaccineExists.pathogenNames = updatedPathogenNames;
              vaccineExists.vaccineType = updatedVaccineType;
              await vaccineExists.save();
              results.updated.push(`${vaccineName} (updated)`);
              console.log(`Updated ${vaccineName} successfully`);
            } catch (saveError) {
              console.error(`Error saving ${vaccineName}:`, saveError);
              results.errors.push({
                name: vaccineName,
                error: `Failed to update: ${saveError.message}`,
              });
            }
          } else {
            results.success.push(`${vaccineName} (already exists)`);
            console.log(`${vaccineName} already exists with matching data`);
          }
        } else {
          // Vaccine doesn't exist - create new one
          // Try multiple column name variations - use exact column names from CSV first
          let vaccineType = record.vaccineType;
          let pathogenNames = record.pathogenNames;
          let manufacturerNames = record.manufacturerNames;
          
          // Fallback to other variations if needed
          if (!vaccineType) vaccineType = record.VaccineType || record.type || record.Type || 'single';
          if (!pathogenNames) pathogenNames = record.PathogenNames || record.pathogen || record.Pathogen || record['Pathogen Names'] || '';
          if (!manufacturerNames) manufacturerNames = record.ManufacturerNames || record.manufacturer || record.Manufacturer || record['Manufacturer Names'] || '';
          
          // Convert to string and trim
          vaccineType = String(vaccineType || 'single').trim().toLowerCase();
          pathogenNames = String(pathogenNames || '').trim();
          manufacturerNames = String(manufacturerNames || '').trim();
          
          // Check if required fields are present
          if (!pathogenNames) {
            results.errors.push({
              name: vaccineName,
              error: `Pathogen names are required. Value received: "${record.pathogenNames}". Available columns: ${Object.keys(record).join(', ')}`,
            });
            continue;
          }
          
          if (!manufacturerNames) {
            results.errors.push({
              name: vaccineName,
              error: `Manufacturer names are required. Value received: "${record.manufacturerNames}". Available columns: ${Object.keys(record).join(', ')}`,
            });
            continue;
          }
          
          // Validate vaccineType enum
          if (!['single', 'combination'].includes(vaccineType)) {
            results.errors.push({
              name: vaccineName,
              error: `Invalid vaccineType: "${vaccineType}". Must be 'single' or 'combination'`,
            });
            continue;
          }
          
          try {
            console.log(`Creating new vaccine ${vaccineName} with:`, { vaccineType, pathogenNames, manufacturerNames });
            const vaccine = await Vaccine.create({
              name: vaccineName,
              vaccineType,
              pathogenNames,
              manufacturerNames,
            });
            results.success.push(vaccine.name);
            console.log(`Successfully created ${vaccineName}`);
          } catch (createError) {
            // Catch any create errors and provide detailed message
            let createErrorMessage = createError.message;
            if (createError.name === 'ValidationError') {
              const validationErrors = Object.values(createError.errors).map(err => err.message).join(', ');
              createErrorMessage = `Validation error: ${validationErrors}`;
            }
            if (createError.code === 11000) {
              createErrorMessage = `Duplicate vaccine name: ${vaccineName}`;
            }
            console.error(`Error creating ${vaccineName}:`, createError);
            results.errors.push({
              name: vaccineName,
              error: createErrorMessage,
            });
          }
        }
      } catch (error) {
        let errorMessage = error.message;
        const errorName = record.name || record.vaccineName || 'Unknown';
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
          const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
          errorMessage = `Duplicate vaccine name: ${errorName}`;
        }
        
        // Log the full error for debugging
        try {
          console.error(`Error processing vaccine ${errorName}:`, {
            error: error.message,
            errorName: error.name,
            errorCode: error.code,
            record: record ? Object.keys(record).join(', ') : 'No record',
          });
        } catch (logError) {
          console.error(`Error logging failed: ${logError.message}`);
        }
        
        results.errors.push({
          name: errorName,
          error: errorMessage,
        });
      }
    }

    const totalProcessed = results.success.length + results.updated.length;
    try {
      console.log('Import results summary:', {
        totalProcessed,
        success: results.success.length,
        updated: results.updated.length,
        errors: results.errors.length,
        firstFewErrors: results.errors.slice(0, 5).map(e => ({ name: e.name, error: e.error })),
      });
    } catch (logError) {
      console.error('Error logging summary:', logError.message);
    }
    
    // Update last update time if any vaccines were processed
    if (totalProcessed > 0) {
      await updateLastUpdate('Vaccine');
    }

    res.status(200).json({
      success: true,
      message: `Processed ${totalProcessed} vaccines successfully (${results.success.length} created/new, ${results.updated.length} updated)`,
      imported: results.success.length,
      updated: results.updated.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    console.error('Server error in importVaccines:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// @desc    Export vaccines to CSV
// @route   GET /api/csv/export/vaccines
// @access  Private/Admin
exports.exportVaccines = async (req, res) => {
  try {
    const vaccines = await Vaccine.find().sort({ name: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(vaccines, {
        header: true,
        columns: ['name', 'vaccineType', 'pathogenNames', 'manufacturerNames'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=vaccines.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import licensing dates from CSV
// @route   POST /api/csv/import/licensing-dates
// @access  Private/Admin
exports.importLicensingDates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        // Handle lastUpdateOnVaccine - preserve the value from CSV if it exists
        // Support both 'lastUpdateOnVaccine' and 'lastUpdated' column names
        // Only default to 'N/A' if the field is truly missing or empty
        const lastUpdateValue = record.lastUpdateOnVaccine !== undefined ? record.lastUpdateOnVaccine : record.lastUpdated;
        const lastUpdate = (lastUpdateValue !== undefined && lastUpdateValue !== null && String(lastUpdateValue).trim() !== '' && String(lastUpdateValue).trim().toUpperCase() !== 'N/A')
          ? String(lastUpdateValue).trim()
          : 'N/A';

        // Handle type field similarly
        const type = (record.type !== undefined && record.type !== null && String(record.type).trim() !== '')
          ? String(record.type).trim()
          : 'N/A';

        // Handle approvalDate - validate and trim, reject if empty or 'N/A' since it's required
        const approvalDate = (record.approvalDate !== undefined && record.approvalDate !== null && String(record.approvalDate).trim() !== '' && String(record.approvalDate).trim().toUpperCase() !== 'N/A')
          ? String(record.approvalDate).trim()
          : null;

        if (!approvalDate) {
          results.errors.push({
            vaccineName: record.vaccineName || 'Unknown',
            error: 'Approval date is required and cannot be empty or N/A',
          });
          continue;
        }

        // Handle source - validate and trim since it's required
        const source = (record.source !== undefined && record.source !== null && String(record.source).trim() !== '')
          ? String(record.source).trim()
          : null;

        if (!source) {
          results.errors.push({
            vaccineName: record.vaccineName || 'Unknown',
            error: 'Source is required and cannot be empty',
          });
          continue;
        }

        const licensingDate = await LicensingDate.create({
          vaccineName: record.vaccineName,
          name: record.name,
          type: type,
          approvalDate: approvalDate,
          source: source,
          lastUpdateOnVaccine: lastUpdate,
        });
        results.success.push(`${licensingDate.vaccineName} - ${licensingDate.name}`);
      } catch (error) {
        results.errors.push({
          vaccineName: record.vaccineName || 'Unknown',
          error: error.message,
        });
      }
    }

    // Update last update time if any licensing dates were imported
    if (results.success.length > 0) {
      await updateLastUpdate('LicensingDate');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} licensing dates successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export licensing dates to CSV
// @route   GET /api/csv/export/licensing-dates
// @access  Private/Admin
exports.exportLicensingDates = async (req, res) => {
  try {
    const licensingDates = await LicensingDate.find().sort({ vaccineName: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(licensingDates, {
        header: true,
        columns: [
          'vaccineName',
          'name',
          'type',
          'approvalDate',
          'source',
          'lastUpdateOnVaccine',
        ],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=licensing-dates.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import product profiles from CSV
// @route   POST /api/csv/import/product-profiles
// @access  Private/Admin
exports.importProductProfiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        // Helper function to handle default values - only use default if field is truly empty
        const getValue = (value, defaultValue) => {
          return (value !== undefined && value !== null && String(value).trim() !== '')
            ? String(value).trim()
            : defaultValue;
        };

        const productProfile = await ProductProfile.create({
          vaccineName: record.vaccineName,
          type: record.type,
          name: record.name,
          composition: getValue(record.composition, '- not licensed yet -'),
          strainCoverage: getValue(record.strainCoverage, '- not licensed yet -'),
          indication: getValue(record.indication, '- not licensed yet -'),
          contraindication: getValue(record.contraindication, '- not licensed yet -'),
          dosing: getValue(record.dosing, '- not licensed yet -'),
          immunogenicity: getValue(record.immunogenicity, '- not licensed yet -'),
          Efficacy: getValue(record.Efficacy, '- not licensed yet -'),
          durationOfProtection: getValue(record.durationOfProtection, '- not licensed yet -'),
          coAdministration: getValue(record.coAdministration, '- not licensed yet -'),
          reactogenicity: getValue(record.reactogenicity, '- not licensed yet -'),
          safety: getValue(record.safety, '- not licensed yet -'),
          vaccinationGoal: getValue(record.vaccinationGoal, '- not licensed yet -'),
          others: getValue(record.others, '- not licensed yet -'),
        });
        results.success.push(`${productProfile.vaccineName} - ${productProfile.type}`);
      } catch (error) {
        results.errors.push({
          vaccineName: record.vaccineName,
          error: error.message,
        });
      }
    }

    // Update last update time if any product profiles were imported
    if (results.success.length > 0) {
      await updateLastUpdate('ProductProfile');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} product profiles successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export product profiles to CSV
// @route   GET /api/csv/export/product-profiles
// @access  Private/Admin
exports.exportProductProfiles = async (req, res) => {
  try {
    const productProfiles = await ProductProfile.find().sort({ vaccineName: 1, type: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(productProfiles, {
        header: true,
        columns: [
          'vaccineName',
          'type',
          'name',
          'composition',
          'strainCoverage',
          'indication',
          'contraindication',
          'dosing',
          'immunogenicity',
          'Efficacy',
          'durationOfProtection',
          'coAdministration',
          'reactogenicity',
          'safety',
          'vaccinationGoal',
          'others',
        ],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=product-profiles.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import manufacturers from CSV
// @route   POST /api/csv/import/manufacturers
// @access  Private/Admin
exports.importManufacturers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const manufacturer = await Manufacturer.create({
          name: record.name.trim(),
          description: record.description ? record.description.trim() : '',
          history: record.history ? record.history.trim() : '',
          lastUpdated: record.lastUpdated ? record.lastUpdated.trim() : '',
          details_website: record.details_website ? record.details_website.trim() : '',
          details_founded: record.details_founded ? String(record.details_founded).trim() : '',
          details_headquarters: record.details_headquarters ? record.details_headquarters.trim() : '',
          details_ceo: record.details_ceo ? record.details_ceo.trim() : '',
          details_revenue: record.details_revenue ? record.details_revenue.trim() : '',
          details_operatingIncome: record.details_operatingIncome ? record.details_operatingIncome.trim() : '',
          details_netIncome: record.details_netIncome ? record.details_netIncome.trim() : '',
          details_totalAssets: record.details_totalAssets ? record.details_totalAssets.trim() : '',
          details_totalEquity: record.details_totalEquity ? record.details_totalEquity.trim() : '',
          details_numberOfEmployees: record.details_numberOfEmployees ? String(record.details_numberOfEmployees).trim() : '',
          details_products: record.details_products ? record.details_products.trim() : '',
          licensedVaccineNames: record.licensedVaccineNames ? record.licensedVaccineNames.trim() : '',
          candidateVaccineNames: record.candidateVaccineNames ? record.candidateVaccineNames.trim() : '',
        });
        results.success.push(manufacturer.name);
      } catch (error) {
        results.errors.push({
          name: record.name || 'Unknown',
          error: error.message,
        });
      }
    }

    // Update last update time if any manufacturers were imported
    if (results.success.length > 0) {
      await updateLastUpdate('Manufacturer');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} manufacturers successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export manufacturers to CSV
// @route   GET /api/csv/export/manufacturers
// @access  Private/Admin
exports.exportManufacturers = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find().sort({ name: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(manufacturers, {
        header: true,
        columns: [
          'name',
          'description',
          'history',
          'lastUpdated',
          'details_website',
          'details_founded',
          'details_headquarters',
          'details_ceo',
          'details_revenue',
          'details_operatingIncome',
          'details_netIncome',
          'details_totalAssets',
          'details_totalEquity',
          'details_numberOfEmployees',
          'details_products',
          'licensedVaccineNames',
          'candidateVaccineNames',
        ],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturers.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import manufacturer products from CSV
// @route   POST /api/csv/import/manufacturer-products
// @access  Private/Admin
exports.importManufacturerProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const product = await ManufacturerProduct.create({
          manufacturerName: record.manufacturerName.trim(),
          productName: record.productName.trim(),
          productDescription: record.productDescription ? record.productDescription.trim() : '',
        });
        results.success.push(`${product.manufacturerName} - ${product.productName}`);
      } catch (error) {
        results.errors.push({
          manufacturerName: record.manufacturerName || 'Unknown',
          error: error.message,
        });
      }
    }

    // Update last update time if any manufacturer products were imported
    if (results.success.length > 0) {
      await updateLastUpdate('ManufacturerProduct');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} manufacturer products successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export manufacturer products to CSV
// @route   GET /api/csv/export/manufacturer-products
// @access  Private/Admin
exports.exportManufacturerProducts = async (req, res) => {
  try {
    const products = await ManufacturerProduct.find().sort({ manufacturerName: 1, productName: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(products, {
        header: true,
        columns: ['manufacturerName', 'productName', 'productDescription'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturer-products.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import manufacturer sources from CSV
// @route   POST /api/csv/import/manufacturer-sources
// @access  Private/Admin
exports.importManufacturerSources = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const source = await ManufacturerSource.create({
          manufacturerName: record.manufacturerName.trim(),
          lastUpdated: record.lastUpdated ? String(record.lastUpdated).trim() : '',
          title: record.title.trim(),
          link: record.link.trim(),
        });
        results.success.push(`${source.manufacturerName} - ${source.title}`);
      } catch (error) {
        results.errors.push({
          manufacturerName: record.manufacturerName || 'Unknown',
          error: error.message,
        });
      }
    }

    // Update last update time if any manufacturer sources were imported
    if (results.success.length > 0) {
      await updateLastUpdate('ManufacturerSource');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} manufacturer sources successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export manufacturer sources to CSV
// @route   GET /api/csv/export/manufacturer-sources
// @access  Private/Admin
exports.exportManufacturerSources = async (req, res) => {
  try {
    const sources = await ManufacturerSource.find().sort({ manufacturerName: 1, title: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(sources, {
        header: true,
        columns: ['manufacturerName', 'lastUpdated', 'title', 'link'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturer-sources.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import pathogens from CSV
// @route   POST /api/csv/import/pathogens
// @access  Private/Admin
exports.importPathogens = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const pathogen = await Pathogen.create({
          name: record.name.trim(),
          description: record.description ? record.description.trim() : '',
          image: record.image ? record.image.trim() : '',
          bulletpoints: record.bulletpoints ? record.bulletpoints.trim() : '',
          link: record.link ? record.link.trim() : '',
          vaccineNames: record.vaccineNames ? record.vaccineNames.trim() : '',
          candidateVaccineNames: record.candidateVaccineNames ? record.candidateVaccineNames.trim() : '',
        });
        results.success.push(pathogen.name);
      } catch (error) {
        results.errors.push({
          name: record.name || 'Unknown',
          error: error.message,
        });
      }
    }

    // Update last update time if any pathogens were imported
    if (results.success.length > 0) {
      await updateLastUpdate('Pathogen');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} pathogens successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export pathogens to CSV
// @route   GET /api/csv/export/pathogens
// @access  Private/Admin
exports.exportPathogens = async (req, res) => {
  try {
    const pathogens = await Pathogen.find().sort({ name: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(pathogens, {
        header: true,
        columns: [
          'name',
          'description',
          'image',
          'bulletpoints',
          'link',
          'vaccineNames',
          'candidateVaccineNames',
        ],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=pathogens.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import manufacturer candidates from CSV
// @route   POST /api/csv/import/manufacturer-candidates
// @access  Private/Admin
exports.importManufacturerCandidates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const candidate = await ManufacturerCandidate.create({
          pathogenName: record.pathogenName.trim(),
          name: record.name.trim(),
          manufacturer: record.manufacturer ? record.manufacturer.trim() : '',
          platform: record.platform ? record.platform.trim() : '',
          clinicalPhase: record.clinicalPhase ? record.clinicalPhase.trim() : '',
          companyUrl: record.companyUrl ? record.companyUrl.trim() : '',
          other: record.other ? record.other.trim() : '',
        });
        results.success.push(`${candidate.pathogenName} - ${candidate.name}`);
      } catch (error) {
        results.errors.push({
          pathogenName: record.pathogenName || 'Unknown',
          error: error.message,
        });
      }
    }

    // Update last update time if any manufacturer candidates were imported
    if (results.success.length > 0) {
      await updateLastUpdate('ManufacturerCandidate');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} manufacturer candidates successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export manufacturer candidates to CSV
// @route   GET /api/csv/export/manufacturer-candidates
// @access  Private/Admin
exports.exportManufacturerCandidates = async (req, res) => {
  try {
    const candidates = await ManufacturerCandidate.find().sort({ pathogenName: 1, name: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(candidates, {
        header: true,
        columns: ['pathogenName', 'name', 'manufacturer', 'platform', 'clinicalPhase', 'companyUrl', 'other'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturer-candidates.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import NITAGs from CSV
// @route   POST /api/csv/import/nitags
// @access  Private/Admin
exports.importNITAGs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const nitag = await NITAG.create({
          country: record.country.trim(),
          availableNitag: record.availableNitag ? record.availableNitag.trim() : '',
          availableWebsite: record.availableWebsite ? record.availableWebsite.trim() : '',
          websiteUrl: record.websiteUrl ? record.websiteUrl.trim() : '',
          nationalNitagName: record.nationalNitagName ? record.nationalNitagName.trim() : '',
          yearEstablished: record.yearEstablished ? String(record.yearEstablished).trim() : '',
        });
        results.success.push(nitag.country);
      } catch (error) {
        results.errors.push({
          country: record.country || 'Unknown',
          error: error.message,
        });
      }
    }

    // Update last update time if any NITAGs were imported
    if (results.success.length > 0) {
      await updateLastUpdate('NITAG');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} NITAGs successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export NITAGs to CSV
// @route   GET /api/csv/export/nitags
// @access  Private/Admin
exports.exportNITAGs = async (req, res) => {
  try {
    const nitags = await NITAG.find().sort({ country: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(nitags, {
        header: true,
        columns: ['country', 'availableNitag', 'availableWebsite', 'websiteUrl', 'nationalNitagName', 'yearEstablished'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=nitags.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import licensers from CSV
// @route   POST /api/csv/import/licensers
// @access  Private/Admin
exports.importLicensers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const records = await parseCSV(req.file.buffer);

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const licenser = await Licenser.create({
          acronym: record.acronym.trim(),
          region: record.region ? record.region.trim() : '',
          country: record.country ? record.country.trim() : '',
          fullName: record.fullName.trim(),
          description: record.description ? record.description.trim() : '',
          website: record.website ? record.website.trim() : '',
        });
        results.success.push(licenser.acronym);
      } catch (error) {
        results.errors.push({
          acronym: record.acronym || 'Unknown',
          error: error.message,
        });
      }
    }

    // Update last update time if any licensers were imported
    if (results.success.length > 0) {
      await updateLastUpdate('Licenser');
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} licensers successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export licensers to CSV
// @route   GET /api/csv/export/licensers
// @access  Private/Admin
exports.exportLicensers = async (req, res) => {
  try {
    const licensers = await Licenser.find().sort({ acronym: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(licensers, {
        header: true,
        columns: ['acronym', 'region', 'country', 'fullName', 'description', 'website'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=licensers.csv');
    // Send with UTF-8 BOM to ensure Excel and other tools recognize UTF-8 encoding
    res.send('\ufeff' + csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

