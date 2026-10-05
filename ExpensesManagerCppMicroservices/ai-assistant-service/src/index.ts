import Fastify from 'fastify';
import { HumanMessage } from '@langchain/core/messages';
import { config } from './config.js';
import { agent } from './agent.js';
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

  const lastMessage = result.messages[result.messages.length - 1];
  const response = typeof lastMessage.content === 'string'
    ? lastMessage.content
    : lastMessage.content.map((c: any) => c.text || '').join('');

  return { response };
});

const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`AI Assistant service running on port ${config.port}`);
  }
  catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const shutdown = async () => {
  await fastify.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
