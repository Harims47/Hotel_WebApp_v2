import { FastifyInstance } from 'fastify';
import { pool } from '../../database/index.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return reply.status(200).send({ status: 'healthy' });
  });

  fastify.get('/ready', async (request, reply) => {
    try {
      await pool.query('SELECT 1');
      return reply.status(200).send({ status: 'ready' });
    } catch (err) {
      return reply.status(503).send({ status: 'unready', error: 'Database unreachable' });
    }
  });
}
