import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

export function render(url: string) {
  const helmetContext = {} as any;
  
  const html = renderToString(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
  
  const { helmet } = helmetContext;
  
  // FIX: Removed all whitespace, tabs, and newlines. 
  // Stray whitespace here forces the browser to create a blank gap above the header.
  const head = helmet ? `${helmet.title.toString()}${helmet.meta.toString()}${helmet.link.toString()}` : "";
  
  return { html, head };
}