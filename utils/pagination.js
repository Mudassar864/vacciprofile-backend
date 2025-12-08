// utils/pagination.js
exports.applyFirstLast = (query, first, last) => {
  if (first && last) {
    const startIndex = parseInt(first, 10) - 1;
    const endIndex = parseInt(last, 10);
    const limitCount = endIndex - startIndex;

    if (startIndex >= 0 && limitCount > 0) {
      return query.skip(startIndex).limit(limitCount);
    } else {
      throw new Error("Invalid range parameters");
    }
  }
  return query;
};
