const Nitag = require('../models/Nitag');

exports.getAllNitags = async (req, res, next) => {
  try {
    const { first, last } = req.query;
    let nitags;
    const totalCount = await Nitag.countDocuments();

    // Fields to hide
    const projection = "-_id -__v -createdAt -updatedAt";

    if (first && last) {
      const startIndex = parseInt(first, 10) - 1;
      const endIndex = parseInt(last, 10);
      const limitCount = endIndex - startIndex;

      if (startIndex >= 0 && limitCount > 0) {
        nitags = await Nitag.find()
          .select(projection)
          .skip(startIndex)
          .limit(limitCount);
      } else {
        return res.status(400).json({ error: 'Invalid range parameters' });
      }
    } else {
      nitags = await Nitag.find().select(projection);
    }

    res.json({ nitags, totalCount });
  } catch (error) {
    next(error);
  }
};


exports.getNitagByCountry = async (req, res, next) => {
  try {
    const nitag = await Nitag.findOne({ 
      Country: { $regex: new RegExp(`^${req.params.country}$`, 'i') }
    });
    if (!nitag) {
      return res.status(404).json({ error: 'NITAG not found' });
    }
    res.json(nitag);
  } catch (error) {
    next(error);
  }
};

exports.createNitag = async (req, res, next) => {
  try {
    const nitag = new Nitag(req.body);
    await nitag.save();
    res.status(201).json(nitag);
  } catch (error) {
    next(error);
  }
};

exports.bulkInsertNitags = async (req, res, next) => {
  try {
    const nitags = await Nitag.insertMany(req.body, { ordered: false });
    res.status(201).json({ 
      message: 'NITAGs inserted successfully', 
      count: nitags.length,
      data: nitags 
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(207).json({ 
        message: 'Some NITAGs already exist', 
        error: error.message,
        insertedCount: error.result?.nInserted || 0
      });
    } else {
      next(error);
    }
  }
};

exports.updateNitag = async (req, res, next) => {
  try {
    const nitag = await Nitag.findOneAndUpdate(
      { Country: { $regex: new RegExp(`^${req.params.country}$`, 'i') } },
      req.body,
      { new: true, runValidators: true }
    );
    if (!nitag) {
      return res.status(404).json({ error: 'NITAG not found' });
    }
    res.json(nitag);
  } catch (error) {
    next(error);
  }
};

exports.deleteNitag = async (req, res, next) => {
  try {
    const nitag = await Nitag.findOneAndDelete({ 
      Country: { $regex: new RegExp(`^${req.params.country}$`, 'i') }
    });
    if (!nitag) {
      return res.status(404).json({ error: 'NITAG not found' });
    }
    res.json({ message: 'NITAG deleted successfully' });
  } catch (error) {
    next(error);
  }
};