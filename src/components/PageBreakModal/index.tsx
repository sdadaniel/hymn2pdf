'use client';

import { useScrollLock } from '@/hooks/useScrollLock';
import {
  addBreakPoint,
  removeAllBreakPoints,
  removeBreakPoint
} from '@/utils/pageBreakUtils';
import { HymnPageBreakInfo } from '@/utils/type';
import { useEffect, useState } from 'react';
import ControlPanel from './ControlPanel';
import Footer from './Footer';
import Header from './Header';
import ScoreCanvas from './ScoreCanvas';

interface PageBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  hymnInfo: HymnPageBreakInfo | null;
  onConfirm: (hymnInfo: HymnPageBreakInfo) => void;
  loadedImage?: HTMLImageElement; // 미리보기에서 로드된 이미지 요소
}

export default function PageBreakModal({ 
  isOpen, 
  onClose, 
  hymnInfo, 
  onConfirm,
  loadedImage
}: PageBreakModalProps) {
  const [localHymnInfo, setLocalHymnInfo] = useState<HymnPageBreakInfo | null>(null);

  // 모달이 열렸을 때 백그라운드 스크롤 방지
  useScrollLock(isOpen);

  useEffect(() => {
    if (hymnInfo) {
      setLocalHymnInfo({ ...hymnInfo });
    }
  }, [hymnInfo]);

  const handleAddBreakPoint = (y: number) => {
    if (localHymnInfo) {
      const updatedHymnInfo = addBreakPoint(localHymnInfo, y);
      setLocalHymnInfo(updatedHymnInfo);
    }
  };

  const handleRemoveBreakPoint = (id: string) => {
    if (localHymnInfo) {
      const updatedHymnInfo = removeBreakPoint(localHymnInfo, id);
      setLocalHymnInfo(updatedHymnInfo);
    }
  };

  const handleRemoveAllBreakPoints = () => {
    if (localHymnInfo) {
      const updatedHymnInfo = removeAllBreakPoints(localHymnInfo);
      setLocalHymnInfo(updatedHymnInfo);
    }
  };

  

  const handleConfirm = () => {
    if (localHymnInfo) {
      onConfirm(localHymnInfo);
      onClose();
    }
  };

  if (!isOpen) return null;
  
  // hymnInfo가 로딩 중일 때 로딩 상태 표시
  if (!hymnInfo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[85vh] flex flex-col overflow-hidden">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-700">찬미가 정보를 불러오는 중...</div>
            <div className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!localHymnInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[85vh] flex flex-col overflow-hidden">
        <Header 
          hymnNumber={hymnInfo.hymnNumber} 
          onClose={onClose} 
        />
        <ControlPanel hymnInfo={localHymnInfo}onRemoveAll={handleRemoveAllBreakPoints} />

        <div className="flex flex-1 overflow-hidden">       
          <div className="flex-1 p-4 overflow-auto">
            
                         <ScoreCanvas 
               hymnInfo={localHymnInfo}
               imageUrl={hymnInfo.imageUrl}
               loadedImage={loadedImage}
               onAddBreakPoint={handleAddBreakPoint}
               onRemoveBreakPoint={handleRemoveBreakPoint}
             />
          </div>
        </div>

        <Footer 
          onClose={onClose}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
