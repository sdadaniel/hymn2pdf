import { useEffect } from 'react';

/**
 * 모달이 열렸을 때 백그라운드 스크롤을 방지하는 훅
 */
export const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (isLocked) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      
      // body에 스크롤 방지 스타일 적용
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // cleanup 함수
      return () => {
        // 스크롤 방지 스타일 제거
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // 원래 스크롤 위치로 복원
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
};
