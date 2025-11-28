const express = require('express');
const Vaccine = require('../models/Vaccine');
const Pathogen = require('../models/Pathogen');
const Manufacturer = require('../models/Manufacturer');

const router = express.Router();

// Helper function for dynamic limiting (same as above)
const applyLimit = (query, req) => {
  let limit = parseInt(req.query.limit) || 20;
  let skip = parseInt(req.query.skip) || 0;
  const maxLimit = 100;
  limit = Math.min(limit, maxLimit);

  if (req.query.page && req.query.perPage) {
    const page = parseInt(req.query.page) || 1;
    const perPage = Math.min(parseInt(req.query.perPage) || 20, maxLimit);
    skip = (page - 1) * perPage;
    limit = perPage;
  }

  return { query: query.limit(limit).skip(skip), limit, skip };
};

// Get all vaccines with populated references
router.get('/', async (req, res) => {
  try {
    const populate = req.query.populate === 'true';
    let query = Vaccine.find().select('-_id -__v -createdAt -updatedAt');

    if (populate) {
      // Manual population logic (select applied to main query; sub-queries below)
      const { query: limitedQuery, limit, skip } = applyLimit(query, req);
      const vaccines = await limitedQuery;

      // Get all unique pathogen IDs
      const pathogenIds = [...new Set(vaccines.flatMap(v => v.pathogenId))];
      const pathogens = await Pathogen.find({ pathogenId: { $in: pathogenIds } })
                                      .select('-_id -__v -createdAt -updatedAt');

      // Get all unique manufacturer IDs
      const manufacturerIds = [...new Set(vaccines.flatMap(v =>
        v.manufacturers.map(m => m.manufacturerId)
      ))];
      const manufacturers = await Manufacturer.find({ manufacturerId: { $in: manufacturerIds } })
                                              .select('-_id -__v -createdAt -updatedAt');

      // Map data
      const vaccinesWithData = vaccines.map(vaccine => {
        const vaccineObj = vaccine.toObject();
        vaccineObj.pathogenDetails = pathogens.filter(p =>
          vaccine.pathogenId.includes(p.pathogenId)
        );
        vaccineObj.manufacturerDetails = manufacturers.filter(m =>
          vaccine.manufacturers.some(vm => vm.manufacturerId === m.manufacturerId)
        );
        return vaccineObj;
      });

      const total = await Vaccine.countDocuments();

      const page = req.query.page ? parseInt(req.query.page) || 1 : Math.floor(skip / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return res.json({
        data: vaccinesWithData,
        total,
        limit,
        skip,
        page,
        totalPages
      });
    }

    const { query: limitedQuery, limit, skip } = applyLimit(query, req);
    const [vaccines, total] = await Promise.all([
      limitedQuery,
      Vaccine.countDocuments()
    ]);

    const page = req.query.page ? parseInt(req.query.page) || 1 : Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: vaccines,
      total,
      limit,
      skip,
      page,
      totalPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vaccine by ID with populated data
router.get('/:id', async (req, res) => {
  try {
    const populate = req.query.populate === 'true';
    const vaccine = await Vaccine.findOne({ vaccineId: parseInt(req.params.id) })
                                 .select('-_id -__v -createdAt -updatedAt');

    if (!vaccine) return res.status(404).json({ error: 'Vaccine not found' });

    if (populate) {
      const vaccineObj = vaccine.toObject();

      // Get pathogen details
      vaccineObj.pathogenDetails = await Pathogen.find({
        pathogenId: { $in: vaccine.pathogenId }
      }).select('-_id -__v -createdAt -updatedAt');

      // Get manufacturer details
      const manufacturerIds = vaccine.manufacturers.map(m => m.manufacturerId);
      vaccineObj.manufacturerDetails = await Manufacturer.find({
        manufacturerId: { $in: manufacturerIds }
      }).select('-_id -__v -createdAt -updatedAt');

      return res.json(vaccineObj);
    }

    res.json(vaccine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vaccine
router.post('/', async (req, res) => {
  try {
    const vaccine = new Vaccine(req.body);
    await vaccine.save();
    const saved = await Vaccine.findById(vaccine._id).select('-_id -__v -createdAt -updatedAt');
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk insert vaccines
router.post('/bulk', async (req, res) => {
  try {
    const vaccines = await Vaccine.insertMany(req.body, { ordered: false });
    const saved = await Vaccine.find({ vaccineId: { $in: vaccines.map(v => v.vaccineId) } })
                               .select('-_id -__v -createdAt -updatedAt');
    res.status(201).json({
      message: 'Vaccines inserted successfully',
      count: vaccines.length,
      data: saved
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(207).json({
        message: 'Some vaccines already exist',
        error: error.message,
        insertedCount: error.result?.nInserted || 0
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update vaccine
router.put('/:id', async (req, res) => {
  try {
    const vaccine = await Vaccine.findOneAndUpdate(
      { vaccineId: parseInt(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    ).select('-_id -__v -createdAt -updatedAt');
    if (!vaccine) return res.status(404).json({ error: 'Vaccine not found' });
    res.json(vaccine);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete vaccine
router.delete('/:id', async (req, res) => {
  try {
    const vaccine = await Vaccine.findOneAndDelete({ vaccineId: parseInt(req.params.id) });
    if (!vaccine) return res.status(404).json({ error: 'Vaccine not found' });
    res.json({ message: 'Vaccine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search vaccines by pathogen
router.get('/by-pathogen/:pathogenId', async (req, res) => {
  try {
    let query = Vaccine.find({
      pathogenId: parseInt(req.params.pathogenId)
    }).select('-_id -__v -createdAt -updatedAt');

    const { query: limitedQuery, limit, skip } = applyLimit(query, req);
    const [vaccines, total] = await Promise.all([
      limitedQuery,
      Vaccine.countDocuments({ pathogenId: parseInt(req.params.pathogenId) })
    ]);

    const page = req.query.page ? parseInt(req.query.page) || 1 : Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: vaccines,
      total,
      limit,
      skip,
      page,
      totalPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search vaccines by manufacturer
router.get('/by-manufacturer/:manufacturerId', async (req, res) => {
  try {
    let query = Vaccine.find({
      'manufacturers.manufacturerId': parseInt(req.params.manufacturerId)
    }).select('-_id -__v -createdAt -updatedAt');

    const { query: limitedQuery, limit, skip } = applyLimit(query, req);
    const [vaccines, total] = await Promise.all([
      limitedQuery,
      Vaccine.countDocuments({ 'manufacturers.manufacturerId': parseInt(req.params.manufacturerId) })
    ]);

    const page = req.query.page ? parseInt(req.query.page) || 1 : Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: vaccines,
      total,
      limit,
      skip,
      page,
      totalPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;