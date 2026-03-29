import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function getInitialDetection(): MobileDetection {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  
  // Check for mobile devices via user agent
  const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  
  // Combine user agent and screen size detection
  const isMobile = width < MOBILE_BREAKPOINT || (isMobileUA && !isTabletUA);
  const isTablet = (width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT) || isTabletUA;
  const isDesktop = width >= TABLET_BREAKPOINT && !isMobileUA;

  return { isMobile, isTablet, isDesktop, screenWidth: width };
}

export function useMobileDetect(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>(getInitialDetection());

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Check for mobile devices via user agent
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
      
      // Combine user agent and screen size detection
      const isMobile = width < MOBILE_BREAKPOINT || (isMobileUA && !isTabletUA);
      const isTablet = (width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT) || isTabletUA;
      const isDesktop = width >= TABLET_BREAKPOINT && !isMobileUA;

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return detection;
}
