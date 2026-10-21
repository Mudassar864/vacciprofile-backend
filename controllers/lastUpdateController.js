const LastUpdate = require('../models/LastUpdate');
const { invalidatePublicCache } = require('../middleware/publicCache');
const { scheduleSiteRevalidate } = require('../utils/siteRevalidate');
const { handleError } = require('../utils/httpErrors');

// @desc    Get the most recent update time across all models
// @route   GET /api/last-update
// @access  Public
exports.getLastUpdate = async (req, res) => {
  try {
    // Find the most recent update across all models
    const mostRecent = await LastUpdate.findOne()
      .sort({ lastUpdatedAt: -1 })
      .select('lastUpdatedAt modelName');

    if (!mostRecent) {
      // If no updates tracked yet, return current time
      return res.status(200).json({
        success: true,
        lastUpdatedAt: new Date(),
        modelName: null,
        message: 'No updates tracked yet',
      });
    }

    res.status(200).json({
      success: true,
      lastUpdatedAt: mostRecent.lastUpdatedAt,
      modelName: mostRecent.modelName,
    });
  } catch (error) {
    console.error('Error fetching last update:', error);
    handleError(res, error);
  }
};

// Helper function to update last update time for a model.
// Every write path calls this, so it is also where the public response cache is dropped.
exports.updateLastUpdate = async (modelName) => {
  invalidatePublicCache();
  scheduleSiteRevalidate();
  try {
    await LastUpdate.findOneAndUpdate(
      { modelName },
      { lastUpdatedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Error updating last update for ${modelName}:`, error);
    // Don't throw - this is a non-critical operation
  }
};

