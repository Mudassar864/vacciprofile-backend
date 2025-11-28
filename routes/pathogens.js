const express = require('express');
const Pathogen = require('../models/Pathogen');

const router = express.Router();

// Helper function for dynamic limiting
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

// Get all pathogens
router.get('/', async (req, res) => {
  try {
    const populate = req.query.populate === 'true';
    let query = Pathogen.find().select('-_id -__v -createdAt -updatedAt');

    if (populate) {
      query = query.populate('vaccines', '-_id -__v -createdAt -updatedAt')
                   .populate('candidateVaccines', '-_id -__v -createdAt -updatedAt');
    }

    const { query: limitedQuery, limit, skip } = applyLimit(query, req);
    const [pathogens, total] = await Promise.all([
      limitedQuery,
      Pathogen.countDocuments()
    ]);

    const page = req.query.page ? parseInt(req.query.page) || 1 : Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: pathogens,
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

// Get pathogen by ID with related data
router.get('/:id', async (req, res) => {
  try {
    const populate = req.query.populate === 'true';
    let query = Pathogen.findOne({ pathogenId: parseInt(req.params.id) })
                         .select('-_id -__v -createdAt -updatedAt');

    if (populate) {
      query = query.populate('vaccines', '-_id -__v -createdAt -updatedAt')
                   .populate('candidateVaccines', '-_id -__v -createdAt -updatedAt');
    }

    const pathogen = await query;
    if (!pathogen) return res.status(404).json({ error: 'Pathogen not found' });
    res.json(pathogen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create pathogen
router.post('/', async (req, res) => {
  try {
    const pathogen = new Pathogen(req.body);
    await pathogen.save();
    const saved = await Pathogen.findById(pathogen._id).select('-_id -__v -createdAt -updatedAt');
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk insert pathogens
router.post('/bulk', async (req, res) => {
  try {
    const pathogens = await Pathogen.insertMany(req.body, { ordered: false });
    const saved = await Pathogen.find({ pathogenId: { $in: pathogens.map(p => p.pathogenId) } })
                                .select('-_id -__v -createdAt -updatedAt');
    res.status(201).json({
      message: 'Pathogens inserted successfully',
      count: pathogens.length,
      data: saved
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(207).json({
        message: 'Some pathogens already exist',
        error: error.message,
        insertedCount: error.result?.nInserted || 0
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update pathogen
router.put('/:id', async (req, res) => {
  try {
    const pathogen = await Pathogen.findOneAndUpdate(
      { pathogenId: parseInt(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    ).select('-_id -__v -createdAt -updatedAt');
    if (!pathogen) return res.status(404).json({ error: 'Pathogen not found' });
    res.json(pathogen);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete pathogen
router.delete('/:id', async (req, res) => {
  try {
    const pathogen = await Pathogen.findOneAndDelete({ pathogenId: parseInt(req.params.id) });
    if (!pathogen) return res.status(404).json({ error: 'Pathogen not found' });
    res.json({ message: 'Pathogen deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;