'use client';

import { HymnPageBreakInfo, PageBreakPoint } from '@/utils/type';
import { useEffect, useRef, useState } from 'react';

interface PageBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  hymnInfo: HymnPageBreakInfo | null;
  onConfirm: (hymnInfo: HymnPageBreakInfo) => void;
}

export default function PageBreakModal({ 
  isOpen, 
  onClose, 
  hymnInfo, 
  onConfirm 
}: PageBreakModalProps) {
  const [localHymnInfo, setLocalHymnInfo] = useState<HymnPageBreakInfo | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (hymnInfo) {
      setLocalHymnInfo({ ...hymnInfo });
      setImageLoaded(false);
    }
  }, [hymnInfo]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Canvas 크기를 이미지 크기에 맞춤
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // 흰색 배경으로 채우기
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0);
      }
    }
  };

  const addBreakPoint = (y: number) => {
    if (!localHymnInfo) return;
    
    const newBreakPoint: PageBreakPoint = {
      id: Date.now().toString(),
      y,
      isRecommended: false
    };
    
    const updatedBreakPoints = [...localHymnInfo.breakPoints, newBreakPoint]
      .sort((a, b) => a.y - b.y);
    
    setLocalHymnInfo({
      ...localHymnInfo,
      breakPoints: updatedBreakPoints,
      totalPages: updatedBreakPoints.length + 1
    });
  };

  const removeBreakPoint = (id: string) => {
    if (!localHymnInfo) return;
    
    const updatedBreakPoints = localHymnInfo.breakPoints.filter(bp => bp.id !== id);
    
    setLocalHymnInfo({
      ...localHymnInfo,
      breakPoints: updatedBreakPoints,
      totalPages: updatedBreakPoints.length + 1
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageLoaded) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const scaleY = (imageRef.current?.naturalHeight || 0) / rect.height;
    const actualY = y * scaleY;
    
    addBreakPoint(actualY);
  };

  const handleConfirm = () => {
    if (localHymnInfo) {
      onConfirm(localHymnInfo);
      onClose();
    }
  };

  if (!isOpen || !hymnInfo || !localHymnInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">
              찬미가 {hymnInfo.hymnNumber}장 - 페이지 자르기 설정
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl hover:bg-gray-100 rounded-full p-1 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex h-[calc(95vh-140px)]">       
          <div className="flex-1 p-4 overflow-auto">
            {/* 고정 영역: 현재 라인 정보 및 제어 */}
            <div className="sticky top-0 bg-white border-b border-gray-200 pb-4 mb-4 z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-semibold text-gray-800">
                    현재 자르기 포인트: <span className="text-blue-600">{localHymnInfo.breakPoints.length}</span>개
                  </div>
                  <div className="text-sm text-gray-600">
                    총 {localHymnInfo.totalPages}페이지
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // 추천 자르기 포인트 복원
                      if (hymnInfo) {
                        setLocalHymnInfo({ ...hymnInfo });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    추천 설정 복원
                  </button>
                  
                  <button
                    onClick={() => {
                      // 모든 자르기 포인트 제거
                      setLocalHymnInfo({
                        ...localHymnInfo,
                        breakPoints: [],
                        totalPages: 1
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    모두 제거
                  </button>
                </div>
              </div>
              
              {/* 자르기 포인트 목록 */}
              {localHymnInfo.breakPoints.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {localHymnInfo.breakPoints.map((breakPoint, index) => (
                    <div
                      key={breakPoint.id}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        라인 {index + 1}: {Math.round(breakPoint.y)}px
                      </span>
                      <button
                        onClick={() => removeBreakPoint(breakPoint.id)}
                        className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="삭제"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {breakPoint.isRecommended && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          추천
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 악보 영역 */}
            <div className="flex justify-center">
              <div className="relative inline-block">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="border-2 border-gray-300 cursor-crosshair hover:border-blue-500 transition-colors"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    display: imageLoaded ? 'block' : 'none'
                  }}
                />
                
                {!imageLoaded && (
                  <div className="w-96 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-gray-500">이미지 로딩 중...</div>
                  </div>
                )}
                
                {/* 자르기 라인 표시 */}
                {imageLoaded && localHymnInfo.breakPoints.map((breakPoint) => {
                  const canvas = canvasRef.current;
                  if (!canvas) return null;
                  
                  const rect = canvas.getBoundingClientRect();
                  const scaleY = rect.height / (imageRef.current?.naturalHeight || 1);
                  const displayY = breakPoint.y * scaleY;
                  
                  return (
                    <div
                      key={breakPoint.id}
                      className="absolute left-0 right-0 flex items-center z-10"
                      style={{
                        top: `${displayY}px`,
                        transform: 'translateY(-50%)'
                      }}
                    >
                      {/* 자르기 라인 */}
                      <div className="flex-1 bg-red-500 h-0.5" />
                      
                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBreakPoint(breakPoint.id);
                        }}
                        className="ml-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                        title="자르기 포인트 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 숨겨진 이미지 (로딩용) */}
            <img
              ref={imageRef}
              src={hymnInfo.imageUrl}
              alt={`찬미가 ${hymnInfo.hymnNumber}장`}
              onLoad={handleImageLoad}
              className="hidden"
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
