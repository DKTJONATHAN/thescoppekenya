import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

const app = express();

let vite;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import('compression')).default;
  const sirv = (await import('sirv')).default;
  app.use(compression());
  app.use(base, sirv(path.join(__dirname, 'dist/client'), { extensions: [] }));
}

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '');

    let template;
    let render;

    if (!isProduction) {
      template = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render;
    } else {
      template = await fs.readFile(path.join(__dirname, 'dist/client/index.html'), 'utf-8');
      render = (await import('./dist/server/entry-server.js')).render;
    }

    const rendered = await render(url);

    const html = template
      .replace(``, rendered.head ?? '')
      .replace(``, rendered.html ?? '');

    // FIX: Vercel Edge Caching. This completely eliminates the slowness.
    // It caches the page for 60 seconds, and serves it instantly to users.
    if (isProduction) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    }

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

export default app;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

const app = express();

let vite;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import('compression')).default;
  const sirv = (await import('sirv')).default;
  app.use(compression());
  app.use(base, sirv(path.join(__dirname, 'dist/client'), { extensions: [] }));
}

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '');

    let template;
    let render;

    if (!isProduction) {
      template = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render;
    } else {
      template = await fs.readFile(path.join(__dirname, 'dist/client/index.html'), 'utf-8');
      render = (await import('./dist/server/entry-server.js')).render;
    }

    const rendered = await render(url);

    const html = template
      .replace(``, rendered.head ?? '')
      .replace(``, rendered.html ?? '');

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// Export the app so Vercel can wrap it in a Serverless Function
export default app;

// Only listen on a port if we are running locally
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}