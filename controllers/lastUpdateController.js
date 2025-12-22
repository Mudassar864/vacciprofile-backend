const LastUpdate = require('../models/LastUpdate');

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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Helper function to update last update time for a model
exports.updateLastUpdate = async (modelName) => {
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

