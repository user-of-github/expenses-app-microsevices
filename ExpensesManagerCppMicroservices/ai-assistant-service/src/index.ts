import { HumanMessage } from '@langchain/core/messages';
import Fastify from 'fastify';

import { agent } from './agent.js';
import { config } from './config.js';
import { pool } from './tools.js';

const fastify = Fastify({ logger: true });

type ChatRequest = {
  message: string;
};

fastify.get('/', async () => {
  return { message: 'AI Assistant Service is running' };
});

fastify.post<{ Body: ChatRequest }>('/chat', async (request, reply) => {
  const { message } = request.body;
  if (!message) {
    return reply.status(400).send({ error: 'message is required' });
  }

  const result = await agent.invoke({
    messages: [new HumanMessage(message)]
  });

  const lastMessage = result.messages.at(-1);
  if (!lastMessage) {
    return reply.status(500).send({ error: 'empty agent response' });
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