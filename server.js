const path = require('node:path');
const Fastify = require('fastify');
const fastifyOpenTelemetry = require('@autotelic/fastify-opentelemetry');
const fastifyStatic = require('@fastify/static');

(async function startServer() {
  const fastify = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
      },
    },
  });

  fastify.register(async (fastify) => {
    fastify.register(fastifyOpenTelemetry, { wrapRoutes: true });

    fastify.register(fastifyStatic, {
      root: path.join(__dirname, './public'),
      prefix: '/_/static',
    });

    fastify.register(async (instance) => {
      instance.get('/', async (_request, reply) => reply.code(200).type('text/plain').send('Hello, world'));
      instance.setNotFoundHandler(async (_request, reply) => reply.code(404).type('text/plain').send('Not found'));
    });
  });

  return fastify.listen({ port: 3000 });
}());
