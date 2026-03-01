import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

const app = express();
const rootDir = process.cwd();

let vite;

if (!isProduction) {
  (async () => {
    try {
      // FIX: Splitting the string blindfolds Vercel's bundler so it doesn't 
      // try to package the massive Vite dev engine into production.
      const viteName = 'v' + 'ite';
      const { createServer } = await import(viteName);
      vite = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        base
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('Dev server initialization failed:', e);
    }
  })();
} else {
  // Production static file serving
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
      if (vite) {
        template = await vite.transformIndexHtml(url, template);
        const devEntry = '/src/entry-server.tsx';
        render = (await vite.ssrLoadModule(devEntry)).render;
      }
    } else {
      template = await fs.readFile(path.join(rootDir, 'dist/client/index.html'), 'utf-8');
      
      // FIX: Splitting the string here stops Vercel from aggressively 
      // rewriting your Vite SSR output into CommonJS, eliminating the '.' SyntaxError
      const prodEntry = './dist/server/entry-server.js';
      const serverEntry = await import(prodEntry);
      render = serverEntry.render;
    }

    if (!render) throw new Error("Render function failed to load");

    const rendered = await render(url);
    const headStr = rendered.head ? rendered.head : '';
    const htmlStr = rendered.html ? rendered.html : '';

    const html = template
      .replace(//g, '')
      .replace(/<\/head>/i, `${headStr}</head>`)
      .replace(//g, '')
      .replace(/<div id="root"><\/div>/i, `<div id="root">${htmlStr}</div>`)
      .replace(/<div id=root><\/div>/i, `<div id="root">${htmlStr}</div>`);

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
    if (vite) vite.ssrFixStacktrace(e);
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