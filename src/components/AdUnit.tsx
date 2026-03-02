import React, { useState, useEffect, useId } from 'react';

const AdUnit = ({ type = 'inarticle' }) => {
  const [isVisible, setIsVisible] = useState(true);

  const rawId = useId();
  const uniqueId = rawId.replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === `adLoadError_${uniqueId}`) {
        setIsVisible(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [uniqueId]);

  if (!isVisible) return null;

  let key = '';
  let width = 300;
  let height = 250;
  let format = 'iframe';
  let adScriptContent = '';

  // Logic to handle the three different ad formats
  if (type === 'inarticle') {
    key = 'd05eae5216bfa715669d9c6cdb24d565';
    adScriptContent = `
      <script type="text/javascript">
        atOptions = { 'key' : '${key}', 'format' : '${format}', 'height' : ${height}, 'width' : ${width}, 'params' : {} };
      </script>
      <script type="text/javascript" src="https://www.highperformanceformat.com/${key}/invoke.js" onerror="window.parent.postMessage('adLoadError_${uniqueId}', '*')"></script>
    `;
  } else if (type === 'horizontal') {
    key = '18d7778442065acc40199dd860fa605c';
    width = 320;
    height = 50;
    adScriptContent = `
      <script type="text/javascript">
        atOptions = { 'key' : '${key}', 'format' : '${format}', 'height' : ${height}, 'width' : ${width}, 'params' : {} };
      </script>
      <script type="text/javascript" src="https://www.highperformanceformat.com/${key}/invoke.js" onerror="window.parent.postMessage('adLoadError_${uniqueId}', '*')"></script>
    `;
  } else if (type === 'effectivegate') {
    width = 300;
    height = 250;
    adScriptContent = `
      <script async="async" data-cfasync="false" src="https://pl28825134.effectivegatecpm.com/5d8ede2dce71e0a3d780b81b5415a822/invoke.js" onerror="window.parent.postMessage('adLoadError_${uniqueId}', '*')"></script>
      <div id="container-5d8ede2dce71e0a3d780b81b5415a822"></div>
    `;
  } else {
    return null;
  }

  const adHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; overflow: hidden; background: transparent; }
        </style>
      </head>
      <body>
        <div id="ad-wrapper-${uniqueId}">${adScriptContent}</div>
        <script type="text/javascript">
          setTimeout(function() {
            var wrapper = document.getElementById('ad-wrapper-${uniqueId}');
            var obviousAdElements = document.querySelectorAll('iframe, img, a');
            var allDivs = document.querySelectorAll('div');
            var hasTallDiv = false;
            for (var i = 0; i < allDivs.length; i++) {
              if (allDivs[i].id !== 'ad-wrapper-${uniqueId}' && allDivs[i].clientHeight >= 10) {
                hasTallDiv = true;
                break;
              }
            }
            if (obviousAdElements.length === 0 && !hasTallDiv) {
              window.parent.postMessage('adLoadError_${uniqueId}', '*');
            }
          }, 1500);
        </script>
      </body>
    </html>
  `;

  return (
    <div 
      style={{
        width: type === 'horizontal' ? '320px' : '300px',
        height: type === 'horizontal' ? '50px' : '250px',
        margin: '15px auto', 
        display: 'block',
        clear: 'both',
        textAlign: 'center'
      }}
      className="ad-slot mx-auto"
    >
      <iframe
        title={`ad-${type}-${uniqueId}`}
        srcDoc={adHtml}
        width={width}
        height={height}
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
      />
    </div>
  );
};

export default AdUnit;