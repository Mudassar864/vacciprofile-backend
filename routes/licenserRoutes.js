const express = require("express");
const router = express.Router();
const licenserController = require("../controllers/licenserController.js");

// CRUD routes
router.post("/", licenserController.createLicenser);
router.get("/", licenserController.getAllLicensers);
router.get("/export/csv", licenserController.exportLicensersCsv);
router.get("/:id", licenserController.getLicenserById);
router.put("/:id", licenserController.updateLicenser);
router.delete("/:id", licenserController.deleteLicenser);

// Bulk insert
router.post("/bulk", licenserController.bulkInsertLicensers);

module.exports = router;
