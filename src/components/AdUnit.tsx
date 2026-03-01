import React, { useEffect, useRef } from 'react';

const AdUnit = ({
  type = 'highperformance',     // 'highperformance' | 'adsense' | 'other'
  keyOrClient = '',             // your key for highperformance or ca-pub-xxx for AdSense
  slot = '',                    // only needed for AdSense
  format = 'iframe',            // for highperformance: iframe, for AdSense: auto / rectangle etc.
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
      // Your original highperformanceformat ad script
      window.atOptions = {
        key: keyOrClient,
        format: format,
        height: height,
        width: width,
        params: {}
      };

      const inline = document.createElement('script');
      inline.textContent = `
        atOptions = {
          'key' : '${keyOrClient}',
          'format' : '${format}',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;

      const invoke = document.createElement('script');
      invoke.src = `https://www.highperformanceformat.com/${keyOrClient}/invoke.js`;
      invoke.async = true;

      container.appendChild(inline);
      container.appendChild(invoke);
    } 
    else if (type === 'adsense') {
      // Google AdSense (manual push method - most reliable in React)
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }

      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', keyOrClient);   // ca-pub-XXXXXXXXXXXXXXXX
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', format || 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');

      container.appendChild(ins);

      // Push to load the ad
      window.adsbygoogle.push({});
    } 
    else {
      // Future other networks - you can add more else if blocks later
      console.warn(`Unknown ad type: ${type}`);
    }

    // Cleanup when component unmounts (important for page changes)
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