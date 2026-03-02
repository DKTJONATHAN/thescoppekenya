import React from 'react';
import AdUnit from './AdUnit';

const AdInjector = ({ children, frequency = 3 }) => {
  // Convert standard React children into an array
  const childrenArray = React.Children.toArray(children);
  const contentWithAds = [];
  
  // Define the rotation of ad types
  const adRotation = ['effectivegate', 'inarticle', 'horizontal'];
  let adCounter = 0;

  childrenArray.forEach((child, index) => {
    // Add the original content block (paragraph, section, or post card)
    contentWithAds.push(child);
    
    // Inject ad after every 'frequency' items, but not after the very last item
    if ((index + 1) % frequency === 0 && index !== childrenArray.length - 1) {
      // Pick the next ad type in the rotation
      const currentType = adRotation[adCounter % adRotation.length];
      
      contentWithAds.push(
        <AdUnit key={`injected-ad-${index}`} type={currentType} />
      );
      
      adCounter++;
    }
  });

  return <>{contentWithAds}</>;
};

export default AdInjector;