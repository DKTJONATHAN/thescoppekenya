import React, { useEffect, useRef, useState } from 'react';

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
  const [isVisible, setIsVisible] = useState(true);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

    const container = containerRef.current;

    if (type === 'highperformance') {
      // Isolated IIFE so each ad has its own atOptions (fixes multiple ads issue)
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
          
          // Insert right after this inline script
          var target = document.currentScript || document.body.lastChild;
          target.parentNode.insertBefore(script, target.nextSibling || target);
        })();
      `;

      const inlineScript = document.createElement('script');
      inlineScript.textContent = scriptContent;

      container.appendChild(inlineScript);

      // Mark that we attempted to load something
      setHasContent(true);
    } 
    else if (type === 'adsense') {
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
      setHasContent(true);
    }

    // Check after 10 seconds if the ad actually rendered anything useful
    const checkTimer = setTimeout(() => {
      if (container.children.length === 0 || container.offsetHeight < 20) {
        // Nothing loaded → hide completely
        setIsVisible(false);
      }
    }, 10000);

    return () => {
      clearTimeout(checkTimer);
      container.innerHTML = '';
    };
  }, [type, keyOrClient, slot, format, width, height, isVisible]);

  // If we decided it's not loading / blocked / failed → render nothing
  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        minHeight: '1px',              // prevents total zero-height flicker
        margin: '40px auto',
        display: 'block',
        clear: 'both',
        overflow: 'hidden',
        ...style
      }}
      className={`ad-unit mx-auto ${className}`}
    />
  );
};

export default AdUnit;