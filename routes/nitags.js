const express = require('express');
const Nitag = require('../models/Nitag');

const router = express.Router();

// Helper function for dynamic limiting
const applyLimit = (query, req) => {
  let limit = parseInt(req.query.limit) || 50;  // Default to 50
  let skip = parseInt(req.query.skip) || 0;
  const maxLimit = 100;
  limit = Math.min(limit, maxLimit);

  if (req.query.page && req.query.perPage) {
    const page = parseInt(req.query.page) || 1;
    const perPage = Math.min(parseInt(req.query.perPage) || 50, maxLimit);
    skip = (page - 1) * perPage;
    limit = perPage;
  }

  return { query: query.limit(limit).skip(skip), limit, skip };
};

// Get all NITAGs
router.get('/', async (req, res) => {
  try {
    let query = Nitag.find().select('-_id -__v -createdAt -updatedAt');

    const { query: limitedQuery, limit, skip } = applyLimit(query, req);
    const [nitags, total] = await Promise.all([
      limitedQuery,
      Nitag.countDocuments()
    ]);

    res.json({
      data: nitags,
      total,
      limit,
      skip
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get NITAG by country
router.get('/:country', async (req, res) => {
  try {
    const nitag = await Nitag.findOne({
      Country: { $regex: new RegExp(`^${req.params.country}$`, 'i') }
    }).select('-_id -__v -createdAt -updatedAt');
    if (!nitag) return res.status(404).json({ error: 'NITAG not found' });
    res.json(nitag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create NITAG
router.post('/', async (req, res) => {
  try {
    const nitag = new Nitag(req.body);
    await nitag.save();
    const saved = await Nitag.findById(nitag._id).select('-_id -__v -createdAt -updatedAt');
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk insert NITAGs
router.post('/bulk', async (req, res) => {
  try {
    const nitags = await Nitag.insertMany(req.body, { ordered: false });
    const saved = await Nitag.find({ Country: { $in: nitags.map(n => n.Country) } })
                             .select('-_id -__v -createdAt -updatedAt');
    res.status(201).json({
      message: 'NITAGs inserted successfully',
      count: nitags.length,
      data: saved
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(207).json({
        message: 'Some NITAGs already exist',
        error: error.message,
        insertedCount: error.result?.nInserted || 0
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update NITAG
router.put('/:country', async (req, res) => {
  try {
    const nitag = await Nitag.findOneAndUpdate(
      { Country: { $regex: new RegExp(`^${req.params.country}$`, 'i') } },
      req.body,
      { new: true, runValidators: true }
    ).select('-_id -__v -createdAt -updatedAt');
    if (!nitag) return res.status(404).json({ error: 'NITAG not found' });
    res.json(nitag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete NITAG
router.delete('/:country', async (req, res) => {
  try {
    const nitag = await Nitag.findOneAndDelete({
      Country: { $regex: new RegExp(`^${req.params.country}$`, 'i') }
    });
    if (!nitag) return res.status(404).json({ error: 'NITAG not found' });
    res.json({ message: 'NITAG deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;