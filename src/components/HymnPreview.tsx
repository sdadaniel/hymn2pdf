'use client';

import { createPageBreakInfo } from '@/utils/imageProcessor';
import { HymnItem, HymnPageBreakInfo } from '@/utils/type';
import { useState } from 'react';
import PageBreakModal from './PageBreakModal';

interface HymnPreviewProps {
  hymns: HymnItem[];
  hymnPageBreakInfos: Map<string, HymnPageBreakInfo>;
  onPageBreakConfirm: (hymnInfo: HymnPageBreakInfo) => void;
  onRemoveHymn: (id: string) => void;
}


export default function HymnPreview({ 
  hymns, 
  hymnPageBreakInfos, 
  onPageBreakConfirm,
  onRemoveHymn
}: HymnPreviewProps) {
  const [showPageBreakModal, setShowPageBreakModal] = useState(false);
  const [currentHymnInfo, setCurrentHymnInfo] = useState<HymnPageBreakInfo | null>(null);
  const [hymnImageData, setHymnImageData] = useState<Map<string, string>>(new Map());

    // 이미지 로드 상태 추적
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

  // 이미지 로드 완료 시 상태 저장
  const handleImageLoaded = (hymnId: string, img: HTMLImageElement) => {
    setLoadedImages(prev => new Map(prev).set(hymnId, img));
    console.log(`HymnPreview: ${hymnId} 이미지 로드 완료, 크기:`, img.naturalWidth, 'x', img.naturalHeight);
  };

  // 페이지 자르기 모달 열기
  const openPageBreakModal = async (hymn: HymnItem) => {
    try {
      const hymnInfo = await createPageBreakInfo(hymn);
      setCurrentHymnInfo(hymnInfo);
      setShowPageBreakModal(true);
    } catch (error) {
      console.error('페이지 자르기 모달 열기 실패:', error);
      alert('페이지 자르기 정보를 불러오는데 실패했습니다.');
    }
  };

  // 페이지 자르기 설정 확인
  const handlePageBreakConfirm = (hymnInfo: HymnPageBreakInfo) => {
    onPageBreakConfirm(hymnInfo);
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">페이지 미리보기</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {hymns.map((hymn) => {
          const customBreakInfo = hymnPageBreakInfos.get(hymn.id);
          // 실제로 breakPoints가 설정되어 있는지 확인
          const hasCustomBreaks = customBreakInfo && customBreakInfo.breakPoints && customBreakInfo.breakPoints.length > 0;
          // 이미지 높이가 1800px 이상이면 검토필요 (breakpoint 설정 여부와 무관)
          const needsReview = customBreakInfo && customBreakInfo.originalHeight > 1800;
          
          return (
                         <div
               key={hymn.id}
               className="group cursor-pointer select-none touch-manipulation"
               style={{ WebkitTapHighlightColor: 'transparent' }}
               onClick={() => openPageBreakModal(hymn)}
             >
                             {/* 썸네일 이미지 */}
               <div className="relative mb-2">
                 <img
                   src={hymn.imageUrl}
                   alt={`찬미가 ${hymn.number}장`}
                   className="w-full object-contain rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors opacity-0 transition-opacity duration-300"
                   style={{ maxHeight: '200px' }}
                   onLoad={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.classList.remove('opacity-0');
                     target.classList.add('opacity-100');
                     
                     // 스켈레톤 숨기기
                     const skeleton = target.parentElement?.querySelector('.skeleton-image');
                     if (skeleton) {
                       skeleton.classList.add('hidden');
                     }
                     
                                           // 이미지 로드 완료 상태 저장
                      handleImageLoaded(hymn.id, target);
                   }}
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.style.display = 'none';
                     const skeleton = target.parentElement?.querySelector('.skeleton-image');
                     if (skeleton) {
                       skeleton.classList.remove('hidden');
                     }
                   }}
                 />
                 
                 {/* 스켈레톤 이미지 */}
                 <div className="skeleton-image absolute inset-0 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                   <div className="text-gray-400 text-sm">로딩 중...</div>
                 </div>
                
                {/* 자르기 포인트 표시 */}
                {hasCustomBreaks && customBreakInfo && customBreakInfo.breakPoints.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {customBreakInfo.breakPoints.map((breakPoint, index) => {
                      const percentage = (breakPoint.y / customBreakInfo.originalHeight) * 100;
                      return (
                        <div
                          key={breakPoint.id}
                          className="absolute left-0 right-0 bg-red-500 h-0.5"
                          style={{
                            top: `${percentage}%`,
                            transform: 'translateY(-50%)'
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                
                                 {/* 삭제 버튼 - 썸네일 우측 상단 */}
                 <button
                   onClick={(e) => {
                     e.stopPropagation(); // 모달 열기 방지
                     onRemoveHymn(hymn.id);
                   }}
                   className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-lg transition-all duration-200 active:scale-95"
                   title="삭제"
                 >
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
              </div>
              
                             {/* 정보 */}
               <div className="p-1">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-800">찬미가 {hymn.number}장</div>
                  {/* 왼쪽: 상태 배지 */}
                  <div>
                      {needsReview ? (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-orange-500 text-white">
                          검토필요
                        </span>
                      ) : hasCustomBreaks ? (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-500 text-white">
                          커스텀
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-500 text-white">
                          기본
                        </span>
                      )}
                    </div>
                </div>

                
                 
                                   {/* 상태 배지와 페이지 정보 - 좌우 배치 */}
                  <div className="mt-1 mb-2 flex  items-center">
                    
                    
                    {/* 오른쪽: 페이지 정보 */}
                    <div className="text-xs text-gray-500">
                    {`${customBreakInfo?.totalPages || 1}페이지`}
                    </div>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

             {/* 페이지 자르기 모달 */}
       {showPageBreakModal && currentHymnInfo && (() => {
         const loadedImage = loadedImages.get(currentHymnInfo.hymnId);
         console.log('HymnPreview: 모달 열기 시 loadedImage 전달');
         console.log('HymnPreview: hymnId:', currentHymnInfo.hymnId);
         console.log('HymnPreview: loadedImage 존재 여부:', !!loadedImage);
         console.log('HymnPreview: loadedImage 크기:', loadedImage ? `${loadedImage.naturalWidth}x${loadedImage.naturalHeight}` : '없음');
         
         return (
           <PageBreakModal
             isOpen={showPageBreakModal}
             onClose={() => setShowPageBreakModal(false)}
             hymnInfo={currentHymnInfo}
             onConfirm={handlePageBreakConfirm}
             loadedImage={loadedImage}
           />
         );
       })()}
    </div>
  );
}
