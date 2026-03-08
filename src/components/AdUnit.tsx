import React, { useState, useEffect, useRef } from 'react';

/**
 * Performance-optimized AdUnit.
 * - Uses IntersectionObserver to only load when visible (lazy ads)
 * - Single iframe per ad, no srcdoc re-renders
 * - Minimal DOM footprint
 */
const AdUnit = React.memo(({ type = 'inarticle' }: { type?: 'inarticle' | 'horizontal' | 'effectivegate' }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy load: only create iframe when the ad slot scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const width = type === 'horizontal' ? 320 : 300;
  const height = type === 'horizontal' ? 50 : 250;

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        margin: '15px auto',
        display: 'block',
        contain: 'layout style',
      }}
      className="ad-slot mx-auto"
    >
      {shouldLoad && <AdIframe type={type} width={width} height={height} />}
    </div>
  );
});

/** Separated iframe component — only mounts once shouldLoad is true */
const AdIframe = React.memo(({ type, width, height }: { type: string; width: number; height: number }) => {
  let adScriptContent = '';
  
  if (type === 'inarticle') {
    const key = 'd05eae5216bfa715669d9c6cdb24d565';
    adScriptContent = `
      <script type="text/javascript">
        atOptions = { 'key' : '${key}', 'format' : 'iframe', 'height' : ${height}, 'width' : ${width}, 'params' : {} };
      </script>
      <script type="text/javascript" src="https://www.highperformanceformat.com/${key}/invoke.js"></script>
    `;
  } else if (type === 'horizontal') {
    const key = '18d7778442065acc40199dd860fa605c';
    adScriptContent = `
      <script type="text/javascript">
        atOptions = { 'key' : '${key}', 'format' : 'iframe', 'height' : ${height}, 'width' : ${width}, 'params' : {} };
      </script>
      <script type="text/javascript" src="https://www.highperformanceformat.com/${key}/invoke.js"></script>
    `;
  } else if (type === 'effectivegate') {
    adScriptContent = `
      <script async="async" data-cfasync="false" src="https://pl28825134.effectivegatecpm.com/5d8ede2dce71e0a3d780b81b5415a822/invoke.js"></script>
      <div id="container-5d8ede2dce71e0a3d780b81b5415a822"></div>
    `;
  }

  const adHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;overflow:hidden;background:transparent}</style></head><body>${adScriptContent}</body></html>`;

  return (
    <iframe
      title={`ad-${type}`}
      srcDoc={adHtml}
      width={width}
      height={height}
      style={{ border: 'none', overflow: 'hidden' }}
      scrolling="no"
      loading="lazy"
    />
  );
});

export default AdUnit;
