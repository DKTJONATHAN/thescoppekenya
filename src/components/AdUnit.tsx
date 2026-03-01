import React, { useEffect, useRef, useState } from 'react';

const AdUnit = ({
  type = 'highperformance-inarticle', // 'highperformance-inarticle' | 'highperformance-horizontal' | 'adsense'
  keyOrClient = '',
  slot = '',                        // only for AdSense
  format = 'iframe',
  width = 300,
  height = 250,
  style = {},
  className = '',
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

    const container = containerRef.current;

    if (type === 'highperformance-inarticle') {
      // Main in-article 300x250 (your original one)
      const scriptContent = `
        (function() {
          var atOptions = {
            'key' : '${keyOrClient || 'd05eae5216bfa715669d9c6cdb24d565'}',
            'format' : '${format}',
            'height' : ${height},
            'width' : ${width},
            'params' : {}
          };
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = 'https://www.highperformanceformat.com/${keyOrClient || 'd05eae5216bfa715669d9c6cdb24d565'}/invoke.js';
          var target = document.currentScript || document.body.lastChild;
          target.parentNode.insertBefore(script, target.nextSibling || target);
        })();
      `;

      const inlineScript = document.createElement('script');
      inlineScript.textContent = scriptContent;
      container.appendChild(inlineScript);
    } 
    else if (type === 'highperformance-horizontal') {
      // The 320x50 / horizontal banner style from your old index.html
      const scriptContent = `
        (function() {
          var atOptions = {
            'key' : '${keyOrClient || '18d7778442065acc40199dd860fa605c'}',
            'format' : 'iframe',
            'height' : ${height || 50},
            'width' : ${width || 320},
            'params' : {}
          };
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = 'https://www.highperformanceformat.com/${keyOrClient || '18d7778442065acc40199dd860fa605c'}/invoke.js';
          document.body.appendChild(script);
        })();
      `;

      const inlineScript = document.createElement('script');
      inlineScript.textContent = scriptContent;
      document.body.appendChild(inlineScript);
    } 
    else if (type === 'adsense') {
      // Google AdSense support
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.style.minHeight = `${height}px`;
      ins.style.minWidth = `${width}px`;
      ins.setAttribute('data-ad-client', keyOrClient || 'ca-pub-9291176772735390');
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', format || 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');

      container.appendChild(ins);
      window.adsbygoogle.push({});
    }

    // Hide container if ad doesn't load after 10 seconds (adblock / no fill / error)
    const checkTimer = setTimeout(() => {
      if (container.children.length === 0 || container.offsetHeight < 20) {
        setIsVisible(false);
      }
    }, 10000);

    return () => {
      clearTimeout(checkTimer);
      container.innerHTML = '';
    };
  }, [type, keyOrClient, slot, format, width, height, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        minHeight: '1px',
        margin: type.includes('horizontal') ? '20px auto' : '40px auto',
        display: 'block',
        clear: 'both',
        overflow: 'hidden',
        textAlign: 'center',
        ...style
      }}
      className={`ad-unit mx-auto ${className}`}
    />
  );
};

export default AdUnit;