function wantsProgressStream(req) {
  return (
    req.query.stream === '1' ||
    (req.get('Accept') && req.get('Accept').includes('text/event-stream'))
  );
}

function writeEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {{ total: number, fileSize?: number }} meta
 */
function createImportProgress(req, res, { total, fileSize }) {
  const isStreaming = wantsProgressStream(req);

  if (isStreaming) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    writeEvent(res, { phase: 'started', total, fileSize: fileSize ?? 0 });
  }

  const step = total > 100 ? 10 : 1;

  return {
    isStreaming,
    tick(index, stats) {
      if (!isStreaming) return;
      const current = index + 1;
      if (current === 1 || current === total || current % step === 0) {
        writeEvent(res, {
          phase: 'processing',
          current,
          total,
          imported: stats.imported ?? 0,
          errors: stats.errors ?? 0,
        });
      }
    },
    complete(payload) {
      if (!isStreaming) return false;
      writeEvent(res, { phase: 'complete', ...payload });
      res.end();
      return true;
    },
    fail(message) {
      if (!isStreaming) return false;
      writeEvent(res, { phase: 'error', message });
      res.end();
      return true;
    },
  };
}

function respondImport(res, progress, payload) {
  if (progress && progress.complete(payload)) {
    return;
  }
  res.status(200).json(payload);
}

function respondImportError(res, progress, status, payload) {
  if (progress && progress.fail(payload.message || 'Import failed')) {
    return;
  }
  res.status(status).json(payload);
}

module.exports = {
  wantsProgressStream,
  createImportProgress,
  respondImport,
  respondImportError,
};
