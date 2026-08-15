import { createServer } from 'vite';

async function run() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    // Load the module using Vite's resolver (which handles extensions, JSX, etc.)
    await vite.ssrLoadModule('/test-e2e.js');
  } catch (e) {
    console.error('Test execution failed:', e);
    process.exit(1);
  } finally {
    vite.close();
  }
}

run();
