/**
 * Drop operator-style keys ($gt, $where, a.b) from user input so request bodies
 * can never smuggle MongoDB operators into queries.
 */
function stripOperators(value, depth = 0) {
  if (depth > 10 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => stripOperators(item, depth + 1));

  const clean = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = stripOperators(inner, depth + 1);
  }
  return clean;
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = stripOperators(req.body);
  }
  next();
}

/**
 * Require non-empty scalar values for the listed body fields (create endpoints).
 * Returns 400 with per-field errors instead of letting `undefined.trim()` crash as a 500.
 */
function requireFields(...fields) {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    for (const field of fields) {
      const value = body[field];
      if (value === undefined || value === null || (typeof value === 'object')) {
        errors.push({ field, msg: `${field} is required` });
      } else if (String(value).trim() === '') {
        errors.push({ field, msg: `${field} is required` });
      }
    }
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors.map((e) => e.msg).join('; '),
        errors,
      });
    }
    next();
  };
}

/**
 * Coerce scalar body fields to strings so controllers can safely call `.trim()`.
 * Numbers/booleans become strings; nested objects are rejected.
 */
function stringFields(...fields) {
  return (req, res, next) => {
    const body = req.body || {};
    for (const field of fields) {
      const value = body[field];
      if (value === undefined || value === null) continue;
      if (typeof value === 'object') {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string`,
          errors: [{ field, msg: `${field} must be a string` }],
        });
      }
      body[field] = String(value);
    }
    next();
  };
}

/**
 * Content resources store every field as a string. Coerce numbers/booleans to strings,
 * join arrays with ", ", and reject nested objects so `.trim()` never crashes a controller.
 */
function coerceStringBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    if (Array.isArray(body)) {
      return res.status(400).json({ success: false, message: 'Request body must be an object' });
    }
    return next();
  }
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      body[key] = value
        .filter((item) => item !== null && typeof item !== 'object')
        .map((item) => String(item).trim())
        .filter(Boolean)
        .join(', ');
    } else if (typeof value === 'object') {
      return res.status(400).json({
        success: false,
        message: `${key} must be a string`,
        errors: [{ field: key, msg: `${key} must be a string` }],
      });
    } else if (typeof value !== 'string') {
      body[key] = String(value);
    }
  }
  next();
}

module.exports = { sanitizeBody, requireFields, stringFields, coerceStringBody, stripOperators };
