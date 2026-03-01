import React, { useEffect, useRef } from 'react';

const AdUnit = ({ type = 'inarticle' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    let key = '';
    let width = 300;
    let height = 250;
    let format = 'iframe';

    if (type === 'inarticle') {
      key = 'd05eae5216bfa715669d9c6cdb24d565';
    } else if (type === 'horizontal') {
      key = '18d7778442065acc40199dd860fa605c';
      width = 320;
      height = 50;
    } else {
      return; // unknown type - do nothing
    }

    // Set global atOptions (simple working method from first successful version)
    window.atOptions = {
      key,
      format,
      height,
      width,
      params: {}
    };

    const inlineScript = document.createElement('script');
    inlineScript.textContent = `
      atOptions = {
        'key' : '${key}',
        'format' : '${format}',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.src = `https://www.highperformanceformat.com/${key}/invoke.js`;
    invokeScript.async = true;

    container.appendChild(inlineScript);
    container.appendChild(invokeScript);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [type]);

  return (
    <div 
      ref={containerRef}
      style={{
        width: type === 'horizontal' ? '320px' : '300px',
        height: type === 'horizontal' ? '50px' : '250px',
        margin: '40px auto',
        display: 'block',
        clear: 'both',
        textAlign: 'center'
      }}
      className="ad-slot mx-auto"
    />
  );
};

export default AdUnit;