import React, { useState, useEffect, useId } from 'react';

const AdUnit = ({ type = 'inarticle' }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Create a unique identifier for this specific ad instance
  const rawId = useId();
  const uniqueId = rawId.replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    // Listen for messages specific to this unique ad instance
    const handleMessage = (event) => {
      if (event.data === `adLoadError_${uniqueId}`) {
        setIsVisible(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [uniqueId]);

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
        <div id="ad-wrapper-${uniqueId}">
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
            onerror="window.parent.postMessage('adLoadError_${uniqueId}', '*')"
          ></script>
        </div>
        
        <script type="text/javascript">
          // Check if an ad actually injected visual elements after 1.5 seconds
          setTimeout(function() {
            var wrapper = document.getElementById('ad-wrapper-${uniqueId}');
            
            // Ad networks usually inject an iframe, image, or link.
            var obviousAdElements = document.querySelectorAll('iframe, img, a');
            
            // Sometimes they inject a generic div. Let's see if any div has actual height.
            var allDivs = document.querySelectorAll('div');
            var hasTallDiv = false;
            for (var i = 0; i < allDivs.length; i++) {
              if (allDivs[i].id !== 'ad-wrapper-${uniqueId}' && allDivs[i].clientHeight >= 10) {
                hasTallDiv = true;
                break;
              }
            }

            // If we found zero ad-related tags and zero tall divs, the ad is blank.
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