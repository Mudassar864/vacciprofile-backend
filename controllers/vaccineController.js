const Vaccine = require('../models/Vaccine');
const Pathogen = require('../models/Pathogen');
const Manufacturer = require('../models/Manufacturer');
const { sendCsv } = require('../utils/csv');

exports.getAllVaccines = async (req, res, next) => {
  try {
    let query = Vaccine.find().populate({
      path: "manufacturerDetails",
      select: "name" // Only include these fields
    });
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

exports.getVaccinesByLicenser = async (req, res) => {
  try {
    // Group vaccines under each licenser name present in licensingDates
    const grouped = await Vaccine.aggregate([
      { $unwind: "$licensingDates" },
      {
        $match: {
          "licensingDates.name": { $exists: true, $ne: null, $ne: "" }
        }
      },
      // Pull related pathogen and manufacturer details
      {
        $lookup: {
          from: "pathogens",
          localField: "pathogenId",
          foreignField: "pathogenId",
          as: "pathogenDetails",
          pipeline: [{ $project: { _id: 0, pathogenId: 1, name: 1 } }]
        }
      },
      {
        $lookup: {
          from: "manufacturers",
          localField: "manufacturers.manufacturerId",
          foreignField: "manufacturerId",
          as: "manufacturerDetails",
          pipeline: [
            { $project: { _id: 0, manufacturerId: 1, name: 1, country: 1 } }
          ]
        }
      },
      {
        $group: {
          _id: "$licensingDates.name",
          vaccines: {
            $push: {
              vaccineId: "$vaccineId",
              name: "$name",
              type: "$licensingDates.type",
              approvalDate: "$licensingDates.approvalDate",
              source: "$licensingDates.source",
              pathogens: "$pathogenDetails",
              manufacturers: "$manufacturerDetails"
            }
          }
        }
      },
      { $project: { _id: 0, licenserName: "$_id", vaccines: 1 } },
      { $sort: { licenserName: 1 } }
    ]);

    res.status(200).json({ success: true, data: grouped });
  } catch (error) {
    console.error("Error fetching licensing names:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.exportVaccinesCsv = async (req, res, next) => {
  try {
    const vaccines = await Vaccine.find()
      .select("-_id -__v -createdAt -updatedAt")
      .lean();
    return sendCsv(res, "vaccines", vaccines);
  } catch (error) {
    next(error);
  }
};
