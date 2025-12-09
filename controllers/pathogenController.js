const Pathogen = require('../models/Pathogen');
const { sendCsv } = require('../utils/csv');
exports.getAllPathogens = async (req, res, next) => {
  try {
    const projection = "-_id -__v -createdAt -updatedAt";
    let query = Pathogen.find().select(projection);

    query = query.populate({
      path: 'vaccines',
      select: 'name vaccineTyp licensingDates'   // Only include these fields
    });

    const pathogens = await query;
    res.json(pathogens);
  } catch (error) {
    next(error);
  }
};


exports.getPathogenById = async (req, res, next) => {
  try {
    const populate = req.query.populate === 'true';
    let query = Pathogen.findOne({ pathogenId: req.params.id });

    if (populate) {
      query = query.populate('vaccines').populate('candidateVaccines');
    }

    const pathogen = await query;
    if (!pathogen) {
      return res.status(404).json({ error: 'Pathogen not found' });
    }
    res.json(pathogen);
  } catch (error) {
    next(error);
  }
};

exports.createPathogen = async (req, res, next) => {
  try {
    const pathogen = new Pathogen(req.body);
    await pathogen.save();
    res.status(201).json(pathogen);
  } catch (error) {
    next(error);
  }
};

exports.bulkInsertPathogens = async (req, res, next) => {
  try {
    const pathogens = await Pathogen.insertMany(req.body, { ordered: false });
    res.status(201).json({
      message: 'Pathogens inserted successfully',
      count: pathogens.length,
      data: pathogens
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(207).json({
        message: 'Some pathogens already exist',
        error: error.message,
        insertedCount: error.result?.nInserted || 0
      });
    } else {
      next(error);
    }
  }
};

exports.updatePathogen = async (req, res, next) => {
  try {
    const pathogen = await Pathogen.findOneAndUpdate(
      { pathogenId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!pathogen) {
      return res.status(404).json({ error: 'Pathogen not found' });
    }
    res.json(pathogen);
  } catch (error) {
    next(error);
  }
};

exports.deletePathogen = async (req, res, next) => {
  try {
    const pathogen = await Pathogen.findOneAndDelete({ pathogenId: req.params.id });
    if (!pathogen) {
      return res.status(404).json({ error: 'Pathogen not found' });
    }
    res.json({ message: 'Pathogen deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.exportPathogensCsv = async (req, res, next) => {
  try {
    const data = await Pathogen.find()
      .select("-_id -__v -createdAt -updatedAt")
      .lean();
    return sendCsv(res, "pathogens", data);
  } catch (error) {
    next(error);
  }
};