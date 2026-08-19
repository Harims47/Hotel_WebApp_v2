import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';

export async function securityPlugin(fastify: FastifyInstance) {
  // Hook to set security headers and manage correlation ID
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // correlation ID
    const correlationId = (request.headers['x-correlation-id'] as string) || randomUUID();
    request.headers['x-correlation-id'] = correlationId;
    reply.header('X-Correlation-ID', correlationId);

    // security headers
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
  });

  // Global exception handler
  fastify.setErrorHandler((error, request, reply) => {
    const status = error.statusCode || 500;
    
    if (status === 413) {
      return reply.status(413).send({
        success: false,
        data: null,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload too large; maximum request size is 2MB', details: {} }
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.validation }
      });
    }

    // Hide internal database and node stack traces
    return reply.status(status).send({
      success: false,
      data: null,
      error: {
        code: status === 500 ? 'INTERNAL_SERVER_ERROR' : error.name,
        message: status === 500 ? 'An unexpected server error occurred' : error.message,
        details: {}
      }
    });
  });
}
