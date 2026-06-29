# AWS Bedrock IAM setup for VacciProfile chat

## Knowledge base types

| `KB_TYPE` in `.env` | AWS API used |
|---------------------|--------------|
| `managed` (default) | `AgenticRetrieveStream` with `generateResponse: true` |
| `self-managed` | `RetrieveAndGenerate` |

Your knowledge base **FG7MYPLH6Q** is **managed**. Do not call `RetrieveAndGenerate` on it.

## Backend `.env`

```env
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
KB_TYPE=managed
BEDROCK_KNOWLEDGE_BASE_ID=FG7MYPLH6Q
BEDROCK_MODEL_ARN=arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-sonnet-4-6
BEDROCK_AGENTIC_MAX_ITERATIONS=5
```

Restart the backend after changes.

## IAM policy (managed KB)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:AgenticRetrieve",
        "bedrock:AgenticRetrieveStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-west-2:ACCOUNT_ID:knowledge-base/FG7MYPLH6Q"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-sonnet-4-6"
      ]
    }
  ]
}
```

For **self-managed** KBs only, also allow `bedrock:RetrieveAndGenerate`.

## API

`POST /api/chat/rag` (admin JWT)

```json
{
  "query": "Which vaccines target influenza?",
  "stream": true,
  "messageHistory": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

- **Managed KB**: send `messageHistory` for follow-ups (no `sessionId`).
- **Self-managed KB**: set `KB_TYPE=self-managed` and optional `sessionId`.

Streaming events: `token`, `result`, `trace`, `done`, `error`.
