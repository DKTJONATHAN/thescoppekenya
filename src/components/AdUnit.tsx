import React, { useState, useEffect } from 'react';

const AdUnit = ({ type = 'inarticle' }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Listen for messages from the iframe
    const handleMessage = (event) => {
      if (event.data === `adLoadError_${type}`) {
        setIsVisible(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [type]);

  // If the ad failed, was blocked, or is empty, close down the space entirely
  if (!isVisible) return null;

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
    return null; // unknown type
  }

  // Create a contained HTML environment for the ad
  const adHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            overflow: hidden; 
            background: transparent;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${key}',
            'format' : '${format}',
            'height' : ${height},
            'width' : ${width},
            'params' : {}
          };
        </script>
        <script 
          type="text/javascript" 
          src="https://www.highperformanceformat.com/${key}/invoke.js"
          onerror="window.parent.postMessage('adLoadError_${type}', '*')"
        ></script>
        <script type="text/javascript">
          // Check if an ad actually loaded after 3 seconds
          setTimeout(function() {
            if (document.body.clientHeight < 10) {
              window.parent.postMessage('adLoadError_${type}', '*');
            }
          }, 3000);
        </script>
      </body>
    </html>
  `;

  return (
    <div 
      style={{
        width: type === 'horizontal' ? '320px' : '300px',
        height: type === 'horizontal' ? '50px' : '250px',
        margin: '40px auto',
        display: 'block',
        clear: 'both',
        textAlign: 'center'
      }}
      className="ad-slot mx-auto"
    >
      <iframe
        title={`ad-${type}`}
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