import { buildApp } from './app.js';

const server = buildApp();
const port = 8000;

server.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
