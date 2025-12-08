const Vaccine = require('../models/Vaccine');
const Pathogen = require('../models/Pathogen');
const Manufacturer = require('../models/Manufacturer');

exports.getAllVaccines = async (req, res, next) => {
  try {
    let query = Vaccine.find().populate({
        path: "manufacturerDetails",
        select: 'name'   // Only include these fields
      });
;
    const vaccines = await query;
    res.json(vaccines);
  } catch (error) {
    next(error);
  }
};

exports.getVaccineById = async (req, res, next) => {
  try {
    const populate = req.query.populate === 'true';
    const vaccine = await Vaccine.findOne({ vaccineId: req.params.id });
    
    if (!vaccine) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }
    
    if (populate) {
      const vaccineObj = vaccine.toObject();
      
      vaccineObj.pathogenDetails = await Pathogen.find({ 
        pathogenId: { $in: vaccine.pathogenId } 
      });
      
      const manufacturerIds = vaccine.manufacturers.map(m => m.manufacturerId);
      vaccineObj.manufacturerDetails = await Manufacturer.find({ 
        manufacturerId: { $in: manufacturerIds } 
      });
      
      return res.json(vaccineObj);
    }
    
    res.json(vaccine);
  } catch (error) {
    next(error);
  }
};

exports.createVaccine = async (req, res, next) => {
  try {
    const vaccine = new Vaccine(req.body);
    await vaccine.save();
    res.status(201).json(vaccine);
  } catch (error) {
    next(error);
  }
};

exports.bulkInsertVaccines = async (req, res, next) => {
  try {
    const vaccines = await Vaccine.insertMany(req.body, { ordered: false });
    res.status(201).json({ 
      message: 'Vaccines inserted successfully', 
      count: vaccines.length,
      data: vaccines 
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(207).json({ 
        message: 'Some vaccines already exist', 
        error: error.message,
        insertedCount: error.result?.nInserted || 0
      });
    } else {
      next(error);
    }
  }
};

exports.updateVaccine = async (req, res, next) => {
  try {
    const vaccine = await Vaccine.findOneAndUpdate(
      { vaccineId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!vaccine) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }
    res.json(vaccine);
  } catch (error) {
    next(error);
  }
};

exports.deleteVaccine = async (req, res, next) => {
  try {
    const vaccine = await Vaccine.findOneAndDelete({ vaccineId: req.params.id });
    if (!vaccine) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }
    res.json({ message: 'Vaccine deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getVaccinesByPathogen = async (req, res, next) => {
  try {
    const vaccines = await Vaccine.find({ 
      pathogenId: parseInt(req.params.pathogenId) 
    });
    res.json(vaccines);
  } catch (error) {
    next(error);
  }
};

exports.getVaccinesByManufacturer = async (req, res, next) => {
  try {
    const vaccines = await Vaccine.find({ 
      'manufacturers.manufacturerId': parseInt(req.params.manufacturerId) 
    });
    res.json(vaccines);
  } catch (error) {
    next(error);
  }
};
