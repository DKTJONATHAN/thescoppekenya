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

// FIX: We removed the async wrapper and are using top-level await.
// This guarantees Express sets up the CSS/JS static routes BEFORE the wildcard catch-all.
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base
  });
  app.use(vite.middlewares);
} else {
  // FIX: Using built-in express.static to serve your Tailwind CSS and JS bundles instantly
  app.use(base, express.static(path.join(__dirname, 'dist/client'), {
    index: false, 
    maxAge: '1y' 
  }));
}

// Now the catch-all only fires if the browser asks for a real webpage, not a CSS file
app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '');

    let template;
    let render;

    if (!isProduction) {
      template = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
      template = await vite?.transformIndexHtml(url, template);
      render = (await vite?.ssrLoadModule('/src/entry-server.tsx')).render;
    } else {
      template = await fs.readFile(path.join(__dirname, 'dist/client/index.html'), 'utf-8');
      render = (await import('./dist/server/entry-server.js')).render;
    }

    const rendered = await render(url);

    const html = template
      .replace(``, rendered.head ?? '')
      .replace(``, rendered.html ?? '');

    // Vercel Edge Caching to keep performance at 90+
    if (isProduction) {
      res.set({
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'text/html'
      });
    } else {
      res.set({ 'Content-Type': 'text/html' });
    }

    res.status(200).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.error('SSR Render Error:', e);
    res.status(500).end('Internal Server Error while rendering the page.');
  }
});

export default app;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}