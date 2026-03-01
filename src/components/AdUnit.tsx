import React, { useEffect, useRef } from 'react';

const AdUnit = ({
  type = 'highperformance',
  keyOrClient = '',
  slot = '',
  format = 'iframe',
  width = 300,
  height = 250,
  style = {},
  className = '',
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    if (type === 'highperformance') {
      // Create a self-contained script block with its OWN atOptions (no global pollution)
      const scriptContent = `
        (function() {
          var atOptions = {
            'key' : '${keyOrClient}',
            'format' : '${format}',
            'height' : ${height},
            'width' : ${width},
            'params' : {}
          };
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = 'https://www.highperformanceformat.com/${keyOrClient}/invoke.js';
          var target = document.currentScript || document.body.lastChild;
          target.parentNode.insertBefore(script, target.nextSibling || target);
        })();
      `;

      const inlineScript = document.createElement('script');
      inlineScript.textContent = scriptContent;

      container.appendChild(inlineScript);
    } 
    else if (type === 'adsense') {
      // AdSense part unchanged for now
      if (!window.adsbygoogle) window.adsbygoogle = [];
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', keyOrClient);
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', format || 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      container.appendChild(ins);
      window.adsbygoogle.push({});
    }

    // Cleanup
    return () => {
      container.innerHTML = '';
    };
  }, [type, keyOrClient, slot, format, width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        margin: '40px auto',
        display: 'block',
        clear: 'both',
        ...style
      }}
      className={`ad-unit mx-auto ${className}`}
    />
  );
};

export default AdUnit;