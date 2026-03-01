import React, { useEffect, useRef } from 'react';

const AdUnit = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Helper to create and append a script
    const appendScript = (src = null, text = null) => {
      const script = document.createElement('script');
      if (src) script.src = src;
      if (text) script.textContent = text;
      script.async = true;
      container.appendChild(script);
    };

    // 1. First ad: in-article 300x250 (d05eae5216bfa715669d9c6cdb24d565)
    const ad1Options = `
      atOptions = {
        'key' : 'd05eae5216bfa715669d9c6cdb24d565',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    appendScript(null, ad1Options);
    appendScript('https://www.highperformanceformat.com/d05eae5216bfa715669d9c6cdb24d565/invoke.js');

    // Small delay to let first ad settle
    setTimeout(() => {
      // 2. Second ad: horizontal banner 320x50 (18d7778442065acc40199dd860fa605c)
      const ad2Options = `
        atOptions = {
          'key' : '18d7778442065acc40199dd860fa605c',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      appendScript(null, ad2Options);
      appendScript('https://www.highperformanceformat.com/18d7778442065acc40199dd860fa605c/invoke.js');

      // Another small delay
      setTimeout(() => {
        // 3. Third ad: placeholder for AdSense (replace slot when ready)
        if (!window.adsbygoogle) window.adsbygoogle = [];
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', 'ca-pub-9291176772735390');
        ins.setAttribute('data-ad-slot', 'YOUR_AD_SLOT_ID_HERE'); // <-- replace this
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
        container.appendChild(ins);
        window.adsbygoogle.push({});
      }, 1500); // 1.5s after second ad
    }, 1500); // 1.5s after first ad

    // Cleanup (remove scripts when component unmounts)
    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        margin: '40px auto',
        textAlign: 'center',
        maxWidth: '100%'
      }}
      className="multi-ad-container"
    >
      {/* Each ad will render inside here sequentially */}
      <div style={{ marginBottom: '30px' }}>
        {/* 300x250 in-article spot */}
        <div style={{ width: '300px', height: '250px', margin: '0 auto 20px' }} />
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        {/* 320x50 horizontal banner spot */}
        <div style={{ width: '320px', height: '50px', margin: '0 auto 20px' }} />
      </div>
      
      <div>
        {/* AdSense spot - auto size */}
        <div style={{ minHeight: '100px', margin: '0 auto' }} />
      </div>
    </div>
  );
};

export default AdUnit;