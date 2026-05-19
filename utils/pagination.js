const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse ?page=&limit= from query. When omitted, returns enabled: false (full list).
 */
function parsePaginationQuery(query = {}) {
  const hasPagination =
    query.page !== undefined ||
    query.limit !== undefined ||
    query.pageSize !== undefined;

  if (!hasPagination) {
    return { enabled: false, page: DEFAULT_PAGE, limit: null, skip: 0 };
  }

  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit ?? query.pageSize, 10) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { enabled: true, page, limit, skip };
}

function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Run a paginated or full find against a Mongoose model.
 */
async function paginateQuery(Model, filter, sort, pagination) {
  const sortOption = sort || {};

  if (!pagination.enabled) {
    const docs = await Model.find(filter).sort(sortOption);
    return { docs, total: docs.length, pagination: null };
  }

  const [docs, total] = await Promise.all([
    Model.find(filter).sort(sortOption).skip(pagination.skip).limit(pagination.limit),
    Model.countDocuments(filter),
  ]);

  return {
    docs,
    total,
    pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
  };
}

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePaginationQuery,
  buildPaginationMeta,
  paginateQuery,
};
