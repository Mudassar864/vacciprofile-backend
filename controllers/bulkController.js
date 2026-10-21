const mongoose = require('mongoose');
const { getResource } = require('../utils/resourceRegistry');
const { updateLastUpdate } = require('./lastUpdateController');
const { handleError, HttpError } = require('../utils/httpErrors');

const MAX_BULK_IDS = 5000;

function parseIds(body) {
  const ids = Array.isArray(body?.ids) ? body.ids : null;
  if (!ids || ids.length === 0) {
    throw new HttpError(400, 'ids must be a non-empty array');
  }
  if (ids.length > MAX_BULK_IDS) {
    throw new HttpError(400, `At most ${MAX_BULK_IDS} ids can be deleted at once`);
  }
  const unique = [...new Set(ids.map((id) => String(id)))];
  const invalid = unique.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalid.length) {
    throw new HttpError(400, `Invalid id format: ${invalid.slice(0, 3).join(', ')}`);
  }
  return unique;
}

/**
 * POST /api/<resource>/bulk-delete  { ids: string[] }
 * Deletes in one round trip (plus cascades) instead of one HTTP request per row.
 */
exports.bulkDeleteFor = (resourceKey) => async (req, res) => {
  try {
    const resource = getResource(resourceKey);
    if (!resource) throw new HttpError(404, 'Unknown resource');

    const ids = parseIds(req.body);
    const { Model } = resource;

    const docs = await Model.find({ _id: { $in: ids } }).lean();
    if (docs.length === 0) {
      return res.status(200).json({ success: true, deleted: 0, count: 0, message: 'Nothing to delete' });
    }

    const cascade = resource.onDelete ? await resource.onDelete(docs) : {};
    const result = await Model.deleteMany({ _id: { $in: docs.map((d) => d._id) } });

    await updateLastUpdate(resource.modelName);

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} record${result.deletedCount === 1 ? '' : 's'}`,
      deleted: result.deletedCount,
      count: result.deletedCount,
      notFound: ids.length - docs.length,
      cascade,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.parseIds = parseIds;
