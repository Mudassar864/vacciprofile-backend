const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 200;

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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Case-insensitive "contains" search across the given fields.
 * Returns {} for an empty term so it can be merged into any filter.
 */
function buildSearchFilter(search, fields) {
  const term = typeof search === 'string' ? search.trim().slice(0, MAX_SEARCH_LENGTH) : '';
  if (!term || !fields || fields.length === 0) return {};
  const regex = { $regex: escapeRegex(term), $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

/** Combine filter fragments with $and, skipping empty ones. */
function combineFilters(...parts) {
  const nonEmpty = parts.filter((part) => part && Object.keys(part).length > 0);
  if (nonEmpty.length === 0) return {};
  if (nonEmpty.length === 1) return nonEmpty[0];
  return { $and: nonEmpty };
}

/**
 * Parse ?sort=field or ?sort=-field against a whitelist. Falls back to defaultSort.
 * A tiebreaker on _id keeps paging stable when sort keys repeat.
 */
function parseSort(sortParam, allowedFields, defaultSort) {
  const raw = typeof sortParam === 'string' ? sortParam.trim() : '';
  let sort = defaultSort || {};
  if (raw) {
    const desc = raw.startsWith('-');
    const field = desc ? raw.slice(1) : raw;
    if (allowedFields.includes(field)) {
      sort = { [field]: desc ? -1 : 1 };
    }
  }
  if (!Object.prototype.hasOwnProperty.call(sort, '_id')) {
    sort = { ...sort, _id: 1 };
  }
  return sort;
}

/**
 * Run a paginated or full find against a Mongoose model.
 * Documents are returned as plain objects (lean) — callers only read fields.
 */
async function paginateQuery(Model, filter, sort, pagination, { select } = {}) {
  const sortOption = sort || {};
  const base = () => {
    let q = Model.find(filter).sort(sortOption).lean();
    if (select) q = q.select(select);
    return q;
  };

  if (!pagination.enabled) {
    const docs = await base();
    return { docs, total: docs.length, pagination: null };
  }

  const [docs, total] = await Promise.all([
    base().skip(pagination.skip).limit(pagination.limit),
    Model.countDocuments(filter),
  ]);

  return {
    docs,
    total,
    pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
  };
}

/**
 * Standard admin list query: ?search= across searchFields, ?sort= over sortFields,
 * merged with any resource-specific filter.
 */
function buildListOptions(query, { searchFields = [], sortFields = [], defaultSort, filter = {} }) {
  return {
    filter: combineFilters(filter, buildSearchFilter(query.search ?? query.q, searchFields)),
    sort: parseSort(query.sort, sortFields, defaultSort),
    pagination: parsePaginationQuery(query),
  };
}

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  escapeRegex,
  parsePaginationQuery,
  buildPaginationMeta,
  buildSearchFilter,
  combineFilters,
  parseSort,
  paginateQuery,
  buildListOptions,
};
