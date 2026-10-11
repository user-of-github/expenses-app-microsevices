import { HumanMessage } from '@langchain/core/messages';
import Fastify from 'fastify';

import { agent } from './agent.js';
import { config } from './config.js';
import { pool } from './tools.js';

const fastify = Fastify({ logger: true });

type ChatRequest = {
  message: string;
};

const usedTool = (result: { messages: { getType(): string }[] }): boolean =>
  result.messages.some((entry) => entry.getType() === 'tool');

fastify.get('/', async () => {
  return { message: 'AI Assistant Service is running' };
});

fastify.get('/health', async () => {
  return { status: 'ok' };
});

fastify.post<{ Body: ChatRequest }>('/chat', async (request, reply) => {
  const { message } = request.body;
  if (!message) {
    return reply.status(400).send({ error: 'message is required' });
  }

  let result = await agent.invoke({
    messages: [new HumanMessage(message)]
  });

  // Small models sometimes answer from memory without querying. Retry once
  // with an explicit instruction to force the tool call.
  if (!usedTool(result)) {
    result = await agent.invoke({
      messages: [
        new HumanMessage(message),
        new HumanMessage(
          'You must call the execute_select_query tool to answer this. '
          + 'Do not answer from memory or guess any number.'
        )
      ]
    });
  }

  const lastMessage = result.messages.at(-1);
  if (!lastMessage) {
    return reply.status(500).send({ error: 'empty agent response' });
  }

  // Guard: the answer must come from a real DB query. Small models can leak
  // their reasoning or a raw `tool_call` blob into `content` without ever
  // invoking the tool; never return that raw text to the client.
  if (!usedTool(result)) {
    return {
      response: 'I could not retrieve expense data for that question. '
        + 'Please ask about your expenses, receipts, categories, shops, or payment methods.'
    };
  }

  const { content } = lastMessage;
  const response = typeof content === 'string'
    ? content
    : content
      .map((part) => ('text' in part && typeof part.text === 'string' ? part.text : ''))
      .join('');

  return { response };
});

const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`AI Assistant service running on port ${config.port}`);
  }
  catch (err) {
    fastify.log.error(err instanceof Error ? err : String(err));
    process.exit(1);
  }
};

const shutdown = async (): Promise<void> => {
  await fastify.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();