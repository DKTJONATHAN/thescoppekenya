import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

const app = express();

// FIX: Using process.cwd() bypasses the Vercel import.meta.url syntax crash entirely
const rootDir = process.cwd();

let vite;

if (!isProduction) {
  // FIX: Tucked the dev setup back into an async wrapper so Vercel does not crash on a top-level await
  (async () => {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
      base
    });
    app.use(vite.middlewares);
  })();
} else {
  // FIX: Synchronous static file serving for production stays outside so your CSS loads instantly
  app.use(base, express.static(path.join(rootDir, 'dist/client'), {
    index: false, 
    maxAge: '1y' 
  }));
}

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '');

    let template;
    let render;

    if (!isProduction) {
      template = await fs.readFile(path.join(rootDir, 'index.html'), 'utf-8');
      template = await vite?.transformIndexHtml(url, template);
      render = (await vite?.ssrLoadModule('/src/entry-server.tsx')).render;
    } else {
      template = await fs.readFile(path.join(rootDir, 'dist/client/index.html'), 'utf-8');
      render = (await import('./dist/server/entry-server.js')).render;
    }

    const rendered = await render(url);

    const html = template
      .replace(//g, '')
      .replace(/<\/head>/i, `${rendered.head || ''}</head>`)
      .replace(//g, '')
      .replace(/<div id="root"><\/div>/i, `<div id="root">${rendered.html || ''}</div>`)
      .replace(/<div id=root><\/div>/i, `<div id="root">${rendered.html || ''}</div>`);

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