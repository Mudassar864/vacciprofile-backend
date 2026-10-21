const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');

const LABEL_KEYS = ['name', 'title', 'productName', 'acronym', 'country', 'vaccineName', 'email', 'fullName'];
const ID_PATH = /^\/([a-f0-9]{24})(?:\/[a-z-]+)?\/?$/i;

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || '').slice(0, 64);
}

function pickLabel(source) {
  if (!source || typeof source !== 'object') return '';
  for (const key of LABEL_KEYS) {
    if (source[key] && typeof source[key] !== 'object') return String(source[key]).slice(0, 200);
  }
  return '';
}

/** Find the entity object inside a controller response, e.g. { vaccine: {...} }. */
function entityFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  for (const value of Object.values(payload)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && (value.id || value._id)) {
      return value;
    }
  }
  return null;
}

/** Fire-and-forget write: auditing must never break or slow down the request. */
function recordActivity(req, entry) {
  const user = req.user || {};
  ActivityLog.create({
    user: user._id,
    userName: user.name || '',
    userEmail: user.email || '',
    ip: clientIp(req),
    method: req.method,
    path: req.originalUrl.split('?')[0].slice(0, 300),
    ...entry,
  }).catch((error) => {
    console.error('[audit] failed to record activity:', error.message);
  });
}

function resolveAction(req, payload) {
  const path = req.path;
  if (path.startsWith('/import') || path.includes('/import/')) return 'import';
  if (path.endsWith('/bulk-delete')) return 'bulk-delete';
  if (path.endsWith('/password')) return 'password-change';
  if (req.method === 'DELETE') return 'delete';
  if (req.method === 'PUT' || req.method === 'PATCH') return 'update';
  if (req.method === 'POST') {
    if (payload && (payload.created === false || payload.updated === true || payload.wasUpdated === true)) {
      return 'update';
    }
    return 'create';
  }
  return null;
}

/**
 * Router-level middleware that logs successful writes for one resource.
 * For deletes it reads the record label up front (the response has none).
 *
 * @param {string | ((req: import('express').Request) => string)} entity  resource key, e.g. 'vaccines'
 * @param {import('mongoose').Model} [Model]
 */
function auditTrail(entity, Model) {
  return async (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

    const idMatch = req.path.match(ID_PATH);
    const entityId = idMatch ? idMatch[1] : '';
    let preLabel = '';

    if (req.method === 'DELETE' && Model && entityId && mongoose.Types.ObjectId.isValid(entityId)) {
      try {
        const doc = await Model.findById(entityId).lean();
        preLabel = pickLabel(doc);
      } catch {
        // Label is best-effort.
      }
    }

    let payload = null;
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      payload = body;
      return originalJson(body);
    };

    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      const action = resolveAction(req, payload);
      if (!action) return;

      const target = entityFromPayload(payload);
      const meta = {};
      if (payload && typeof payload === 'object') {
        for (const key of ['imported', 'updated', 'errors', 'deleted', 'count']) {
          if (typeof payload[key] === 'number') meta[key] = payload[key];
        }
      }
      if (action === 'import' && req.file) {
        meta.file = String(req.file.originalname || '').slice(0, 200);
        meta.size = req.file.size;
      }

      recordActivity(req, {
        action,
        entity: typeof entity === 'function' ? entity(req) : entity,
        entityId: entityId || (target ? String(target.id || target._id) : ''),
        label: preLabel || pickLabel(target) || pickLabel(req.body),
        status: res.statusCode,
        meta: Object.keys(meta).length ? meta : undefined,
      });
    });

    next();
  };
}

module.exports = { auditTrail, recordActivity };
