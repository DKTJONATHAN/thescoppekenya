import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const url = req.url;
    const rootDir = process.cwd();
    
    // 1. Read the compiled static HTML template
    const templatePath = path.join(rootDir, 'dist', 'client', 'index.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    
    // 2. Import the Vite SSR entry point
    const { render } = await import('../dist/server/entry-server.js');
    
    // 3. Render the requested page
    const rendered = await render(url);
    const headStr = rendered.head || '';
    const htmlStr = rendered.html || '';

    // 4. Inject the content into the HTML template
    const html = template
      .replace(//g, '')
      .replace(/<\/head>/i, `${headStr}</head>`)
      .replace(//g, '')
      .replace(/<div id="root"><\/div>/i, `<div id="root">${htmlStr}</div>`)
      .replace(/<div id=root><\/div>/i, `<div id="root">${htmlStr}</div>`);

    // 5. Apply edge caching and send the response
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('SSR Render Error:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
}