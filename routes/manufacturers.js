const express = require('express');
const Manufacturer = require('../models/Manufacturer');

const router = express.Router();

// Helper function for dynamic limiting (same as in pathogens.js)
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

// Get all manufacturers
router.get('/', async (req, res) => {
  try {
    const populate = req.query.populate === 'true';
    let query = Manufacturer.find().select('-_id -__v -createdAt -updatedAt');

    if (populate) {
      query = query.populate('licensedVaccines', '-_id -__v -createdAt -updatedAt')
                   .populate('candidateVaccines', '-_id -__v -createdAt -updatedAt');
    }

    const { query: limitedQuery, limit, skip } = applyLimit(query, req);
    const [manufacturers, total] = await Promise.all([
      limitedQuery,
      Manufacturer.countDocuments()
    ]);

    const page = req.query.page ? parseInt(req.query.page) || 1 : Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: manufacturers,
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

// Get manufacturer by ID with related data
router.get('/:id', async (req, res) => {
  try {
    const populate = req.query.populate === 'true';
    let query = Manufacturer.findOne({ manufacturerId: parseInt(req.params.id) })
                            .select('-_id -__v -createdAt -updatedAt');

    if (populate) {
      query = query.populate('licensedVaccines', '-_id -__v -createdAt -updatedAt')
                   .populate('candidateVaccines', '-_id -__v -createdAt -updatedAt');
    }

    const manufacturer = await query;
    if (!manufacturer) return res.status(404).json({ error: 'Manufacturer not found' });
    res.json(manufacturer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create manufacturer
router.post('/', async (req, res) => {
  try {
    const manufacturer = new Manufacturer(req.body);
    await manufacturer.save();
    const saved = await Manufacturer.findById(manufacturer._id).select('-_id -__v -createdAt -updatedAt');
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk insert manufacturers
router.post('/bulk', async (req, res) => {
  try {
    const manufacturers = await Manufacturer.insertMany(req.body, { ordered: false });
    const saved = await Manufacturer.find({ manufacturerId: { $in: manufacturers.map(m => m.manufacturerId) } })
                                    .select('-_id -__v -createdAt -updatedAt');
    res.status(201).json({
      message: 'Manufacturers inserted successfully',
      count: manufacturers.length,
      data: saved
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(207).json({
        message: 'Some manufacturers already exist',
        error: error.message,
        insertedCount: error.result?.nInserted || 0
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update manufacturer
router.put('/:id', async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findOneAndUpdate(
      { manufacturerId: parseInt(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    ).select('-_id -__v -createdAt -updatedAt');
    if (!manufacturer) return res.status(404).json({ error: 'Manufacturer not found' });
    res.json(manufacturer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete manufacturer
router.delete('/:id', async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findOneAndDelete({ manufacturerId: parseInt(req.params.id) });
    if (!manufacturer) return res.status(404).json({ error: 'Manufacturer not found' });
    res.json({ message: 'Manufacturer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;