const Licenser = require("../models/Licenser.js");
const { sendCsv } = require("../utils/csv");

// Create single licenser
exports.createLicenser = async (req, res) => {
  try {
    const licenser = new Licenser(req.body);
    await licenser.save();
    res.status(201).json({ message: "Licenser created successfully", licenser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all licensers
exports.getAllLicensers = async (req, res) => {
  try {
    const licensers = await Licenser.find();
    res.json(licensers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get licenser by id
exports.getLicenserById = async (req, res) => {
  try {
    const licenser = await Licenser.findById(req.params.id);
    if (!licenser) return res.status(404).json({ message: "Licenser not found" });

    res.json(licenser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update licenser
exports.updateLicenser = async (req, res) => {
  try {
    const licenser = await Licenser.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!licenser) return res.status(404).json({ message: "Licenser not found" });

    res.json({ message: "Licenser updated", licenser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete licenser
exports.deleteLicenser = async (req, res) => {
  try {
    const licenser = await Licenser.findByIdAndDelete(req.params.id);
    if (!licenser) return res.status(404).json({ message: "Licenser not found" });

    res.json({ message: "Licenser deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk Insert Licensers
exports.bulkInsertLicensers = async (req, res) => {
  try {
    const data = req.body; // array of json objects
    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "Data must be an array of objects" });
    }

    const result = await Licenser.insertMany(data, { ordered: false }); 
    res.status(201).json({ message: "Bulk insert successful", insertedCount: result.length, result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Export all licensers as CSV
exports.exportLicensersCsv = async (req, res, next) => {
  try {
    const data = await Licenser.find()
      .select("-_id -__v -createdAt -updatedAt")
      .lean();
    return sendCsv(res, "licensers", data);
  } catch (error) {
    next(error);
  }
};

