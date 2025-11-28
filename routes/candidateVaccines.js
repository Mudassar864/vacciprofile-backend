const express = require('express');
const CandidateVaccine = require('../models/CandidateVaccine');

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

// Get all candidate vaccines
router.get('/', async (req, res) => {
  try {
    let query = CandidateVaccine.find().select('-_id -__v -createdAt -updatedAt');

    const { query: limitedQuery, limit, skip } = applyLimit(query, req);
    const [candidateVaccines, total] = await Promise.all([
      limitedQuery,
      CandidateVaccine.countDocuments()
    ]);

    const page = req.query.page ? parseInt(req.query.page) || 1 : Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: candidateVaccines,
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

// Get candidate vaccine by ID
router.get('/:id', async (req, res) => {
  try {
    const candidateVaccine = await CandidateVaccine.findById(req.params.id)
                                                   .select('-_id -__v -createdAt -updatedAt');
    if (!candidateVaccine) return res.status(404).json({ error: 'Candidate vaccine not found' });
    res.json(candidateVaccine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create candidate vaccine
router.post('/', async (req, res) => {
  try {
    const candidateVaccine = new CandidateVaccine(req.body);
    await candidateVaccine.save();
    const saved = await CandidateVaccine.findById(candidateVaccine._id)
                                        .select('-_id -__v -createdAt -updatedAt');
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk insert candidate vaccines
router.post('/bulk', async (req, res) => {
  try {
    const candidateVaccines = await CandidateVaccine.insertMany(req.body, { ordered: false });
    const saved = await CandidateVaccine.find({ _id: { $in: candidateVaccines.map(cv => cv._id) } })
                                        .select('-_id -__v -createdAt -updatedAt');
    res.status(201).json({
      message: 'Candidate vaccines inserted successfully',
      count: candidateVaccines.length,
      data: saved
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update candidate vaccine
router.put('/:id', async (req, res) => {
  try {
    const candidateVaccine = await CandidateVaccine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-_id -__v -createdAt -updatedAt');
    if (!candidateVaccine) return res.status(404).json({ error: 'Candidate vaccine not found' });
    res.json(candidateVaccine);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete candidate vaccine
router.delete('/:id', async (req, res) => {
  try {
    const candidateVaccine = await CandidateVaccine.findByIdAndDelete(req.params.id);
    if (!candidateVaccine) return res.status(404).json({ error: 'Candidate vaccine not found' });
    res.json({ message: 'Candidate vaccine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;