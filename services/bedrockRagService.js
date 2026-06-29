const {
  BedrockAgentRuntimeClient,
  AgenticRetrieveStreamCommand,
  RetrieveAndGenerateCommand,
} = require('@aws-sdk/client-bedrock-agent-runtime');

function getBedrockConfig() {
  const region = process.env.AWS_REGION || 'us-west-2';
  const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'FG7MYPLH6Q';
  const modelArn =
    process.env.BEDROCK_MODEL_ARN ||
    'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-sonnet-4-6';
  const maxAgentIteration = Number(process.env.BEDROCK_AGENTIC_MAX_ITERATIONS || 5);
  const kbType = (process.env.KB_TYPE || 'managed').trim().toLowerCase();
  const useManagedKb = kbType !== 'self-managed';

  return {
    region,
    knowledgeBaseId,
    modelArn,
    maxAgentIteration,
    kbType: useManagedKb ? 'managed' : 'self-managed',
    useManagedKb,
  };
}

function createBedrockClient() {
  const { region } = getBedrockConfig();
  const config = { region };

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return new BedrockAgentRuntimeClient(config);
}

function assertBedrockConfigured() {
  const { knowledgeBaseId } = getBedrockConfig();
  if (!knowledgeBaseId) {
    const error = new Error('Bedrock knowledge base is not configured');
    error.statusCode = 503;
    throw error;
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) {
    const error = new Error(
      'AWS credentials are missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the backend .env file.'
    );
    error.statusCode = 503;
    throw error;
  }
}

function normalizeMessageHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((message) => {
      const role = message?.role;
      const text =
        typeof message?.content === 'string'
          ? message.content.trim()
          : message?.content?.text?.trim();
      return (role === 'user' || role === 'assistant') && text;
    })
    .map((message) => ({
      role: message.role,
      content: {
        text:
          typeof message.content === 'string'
            ? message.content.trim()
            : String(message.content.text).trim(),
      },
    }));
}

function mapRetrievalResults(results = []) {
  return results.map((item, index) => ({
    id: `result-${index}`,
    text: item.content?.text || '',
    score: item.score ?? null,
    location: item.location || null,
    metadata: item.metadata || null,
  }));
}

function dedupeCitations(citations) {
  const seen = new Set();
  return citations.filter((citation) => {
    const key = citation.text?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function retrieveAndGenerate(query, sessionId) {
  assertBedrockConfigured();
  const client = createBedrockClient();
  const { knowledgeBaseId, modelArn } = getBedrockConfig();

  const commandInput = {
    input: { text: query },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId,
        modelArn,
      },
    },
  };

  if (sessionId) {
    commandInput.sessionId = sessionId;
  }

  const response = await client.send(new RetrieveAndGenerateCommand(commandInput));

  const citations = dedupeCitations(
    response.citations?.flatMap((citation, citationIndex) =>
      (citation.retrievedReferences || []).map((ref, refIndex) => ({
        id: `citation-${citationIndex}-${refIndex}`,
        text: ref.content?.text || '',
        location: ref.location || null,
      }))
    ) || []
  );

  return {
    answer: response.output?.text || '',
    sessionId: response.sessionId || null,
    citations,
    kbType: 'self-managed',
  };
}

async function runAgenticRetrieve({ messages, generateResponse = true, onEvent }) {
  assertBedrockConfigured();
  const client = createBedrockClient();
  const { knowledgeBaseId, maxAgentIteration } = getBedrockConfig();

  const response = await client.send(
    new AgenticRetrieveStreamCommand({
      messages,
      retrievers: [
        {
          configuration: {
            knowledgeBase: { knowledgeBaseId },
          },
        },
      ],
      agenticRetrieveConfiguration: {
        foundationModelType: 'MANAGED',
        rerankingModelType: 'MANAGED',
        maxAgentIteration,
        generateResponse,
      },
    })
  );

  let streamedText = '';
  let finalAnswer = '';
  const citations = [];
  const traces = [];

  if (!response.stream) {
    return {
      answer: '',
      citations: [],
      traces: [],
      kbType: 'managed',
    };
  }

  for await (const event of response.stream) {
    if (event.responseEvent?.text) {
      streamedText += event.responseEvent.text;
      onEvent?.({ type: 'token', text: event.responseEvent.text });
    }

    if (event.result) {
      if (event.result.generatedResponse?.answer) {
        finalAnswer = event.result.generatedResponse.answer;
      }

      const mappedResults = mapRetrievalResults(event.result.results);
      for (const result of mappedResults) {
        if (result.text) {
          citations.push({
            id: result.id,
            text: result.text,
            location: result.location,
          });
        }
      }

      if (mappedResults.length > 0) {
        onEvent?.({ type: 'result', results: mappedResults });
      }
    }

    if (event.traceEvent) {
      const { step, status, message } = event.traceEvent.attributes || {};
      const trace = {
        step: step || '',
        status: status || '',
        message: message || '',
      };
      traces.push(trace);
      onEvent?.({ type: 'trace', ...trace });
    }
  }

  return {
    answer: finalAnswer || streamedText,
    citations: dedupeCitations(citations),
    traces,
    kbType: 'managed',
  };
}

async function chat(query, options = {}, onEvent) {
  const { messageHistory = [], sessionId } = options;
  const { useManagedKb } = getBedrockConfig();

  if (!useManagedKb) {
    return retrieveAndGenerate(query, sessionId);
  }

  const messages = [
    ...normalizeMessageHistory(messageHistory),
    { role: 'user', content: { text: query } },
  ];

  return runAgenticRetrieve({
    messages,
    generateResponse: true,
    onEvent,
  });
}

module.exports = {
  getBedrockConfig,
  normalizeMessageHistory,
  retrieveAndGenerate,
  runAgenticRetrieve,
  chat,
};
