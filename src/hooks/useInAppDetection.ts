import { useState, useEffect } from 'react';

export const useInAppDetection = () => {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    // 카카오톡 인앱 감지
    const checkInApp = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isKakaoTalk = userAgent.includes('kakaotalk');
      const isInAppBrowser = userAgent.includes('kakao') || 
                           userAgent.includes('line') || 
                           userAgent.includes('fbav') || 
                           userAgent.includes('instagram') ||
                           userAgent.includes('naver');
      
      setIsInApp(isInAppBrowser);
      console.log({isInAppBrowser})
      
      if (isInAppBrowser) {
        // 인앱 브라우저에서 기본 브라우저로 열기
        const currentUrl = window.location.href;
        const encodedUrl = encodeURIComponent(currentUrl);
        
        // 카카오톡의 경우
        if (isKakaoTalk) {
          window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=http;package=com.android.chrome;end`;
        } else {
          // 다른 인앱 브라우저의 경우
          window.open(currentUrl, '_blank');
        }
      }
    };

    checkInApp();
  }, []);

  return { isInApp };
};
