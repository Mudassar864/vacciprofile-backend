const Manufacturer = require("../models/Manufacturer");

exports.getAllManufacturers = async (req, res, next) => {
  try {
    let query = Manufacturer.find();

    query = query.populate({path:"licensedVaccines",select:"-productProfiles"}).populate("candidateVaccines");

    const manufacturers = await query;
    res.json(manufacturers);
  } catch (error) {
    next(error);
  }
};

exports.getManufacturerById = async (req, res, next) => {
  try {
    const populate = req.query.populate === "true";
    let query = Manufacturer.findOne({ manufacturerId: req.params.id });

    if (populate) {
      query = query.populate("licensedVaccines").populate("candidateVaccines");
    }

    const manufacturer = await query;
    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer not found" });
    }
    res.json(manufacturer);
  } catch (error) {
    next(error);
  }
};

exports.createManufacturer = async (req, res, next) => {
  try {
    const manufacturer = new Manufacturer(req.body);
    await manufacturer.save();
    res.status(201).json(manufacturer);
  } catch (error) {
    next(error);
  }
};

exports.bulkInsertManufacturers = async (req, res, next) => {
  try {
    const manufacturers = await Manufacturer.insertMany(req.body, {
      ordered: false,
    });
    res.status(201).json({
      message: "Manufacturers inserted successfully",
      count: manufacturers.length,
      data: manufacturers,
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(207).json({
        message: "Some manufacturers already exist",
        error: error.message,
        insertedCount: error.result?.nInserted || 0,
      });
    } else {
      next(error);
    }
  }
};

exports.updateManufacturer = async (req, res, next) => {
  try {
    const manufacturer = await Manufacturer.findOneAndUpdate(
      { manufacturerId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer not found" });
    }
    res.json(manufacturer);
  } catch (error) {
    next(error);
  }
};

exports.deleteManufacturer = async (req, res, next) => {
  try {
    const manufacturer = await Manufacturer.findOneAndDelete({
      manufacturerId: req.params.id,
    });
    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer not found" });
    }
    res.json({ message: "Manufacturer deleted successfully" });
  } catch (error) {
    next(error);
  }
};
