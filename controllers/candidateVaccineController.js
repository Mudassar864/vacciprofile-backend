const CandidateVaccine = require('../models/CandidateVaccine');

exports.getAllCandidateVaccines = async (req, res, next) => {
  try {
    const candidateVaccines = await CandidateVaccine.find();
    res.json(candidateVaccines);
  } catch (error) {
    next(error);
  }
};

exports.getCandidateVaccineById = async (req, res, next) => {
  try {
    const candidateVaccine = await CandidateVaccine.findById(req.params.id);
    if (!candidateVaccine) {
      return res.status(404).json({ error: 'Candidate vaccine not found' });
    }
    res.json(candidateVaccine);
  } catch (error) {
    next(error);
  }
};

exports.createCandidateVaccine = async (req, res, next) => {
  try {
    const candidateVaccine = new CandidateVaccine(req.body);
    await candidateVaccine.save();
    res.status(201).json(candidateVaccine);
  } catch (error) {
    next(error);
  }
};

exports.bulkInsertCandidateVaccines = async (req, res, next) => {
  try {
    const candidateVaccines = await CandidateVaccine.insertMany(req.body, { ordered: false });
    res.status(201).json({ 
      message: 'Candidate vaccines inserted successfully', 
      count: candidateVaccines.length,
      data: candidateVaccines 
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCandidateVaccine = async (req, res, next) => {
  try {
    const candidateVaccine = await CandidateVaccine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!candidateVaccine) {
      return res.status(404).json({ error: 'Candidate vaccine not found' });
    }
    res.json(candidateVaccine);
  } catch (error) {
    next(error);
  }
};

exports.deleteCandidateVaccine = async (req, res, next) => {
  try {
    const candidateVaccine = await CandidateVaccine.findByIdAndDelete(req.params.id);
    if (!candidateVaccine) {
      return res.status(404).json({ error: 'Candidate vaccine not found' });
    }
    res.json({ message: 'Candidate vaccine deleted successfully' });
  } catch (error) {
    next(error);
  }
};