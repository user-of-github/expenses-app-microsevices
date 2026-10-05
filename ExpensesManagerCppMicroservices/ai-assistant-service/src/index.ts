import Fastify from 'fastify';

const fastify = Fastify({
  logger: true,
});

fastify.get('/', async () => {
  return { message: 'AI Assistant Service is running' };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 5000;
    await fastify.listen({ port, host: '0.0.0.0' });
  }
  catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
