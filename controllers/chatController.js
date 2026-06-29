const { chat, getBedrockConfig, normalizeMessageHistory } = require('../services/bedrockRagService');

function getQueryFromRequest(req) {
  const query = (req.body?.query || req.body?.message || '').trim();
  if (!query) {
    const error = new Error('Query is required');
    error.statusCode = 400;
    throw error;
  }
  return query;
}

exports.getChatConfig = async (req, res) => {
  const config = getBedrockConfig();
  const hasCredentials = Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim()
  );

  res.status(200).json({
    success: true,
    data: {
      region: config.region,
      knowledgeBaseId: config.knowledgeBaseId,
      modelArn: config.modelArn,
      kbType: config.kbType,
      useManagedKb: config.useManagedKb,
      configured: Boolean(config.knowledgeBaseId && hasCredentials),
    },
  });
};

exports.rag = async (req, res) => {
  try {
    const query = getQueryFromRequest(req);
    const messageHistory = normalizeMessageHistory(req.body?.messageHistory);
    const sessionId = req.body?.sessionId || undefined;
    const stream = req.body?.stream === true;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const data = await chat(
        query,
        { messageHistory, sessionId },
        (event) => {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      );

      res.write(`data: ${JSON.stringify({ type: 'done', data })}\n\n`);
      res.end();
      return;
    }

    const data = await chat(query, { messageHistory, sessionId });
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to generate RAG response',
      });
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        message: error.message || 'Failed to generate RAG response',
      })}\n\n`
    );
    res.end();
  }
};
