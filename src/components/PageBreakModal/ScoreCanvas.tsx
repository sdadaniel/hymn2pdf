import { calculateImageCoordinates } from '@/utils/pageBreakUtils';
import { HymnPageBreakInfo } from '@/utils/type';
import { useEffect, useRef, useState } from 'react';

interface ScoreCanvasProps {
  hymnInfo: HymnPageBreakInfo;
  imageUrl: string;
  onAddBreakPoint: (y: number) => void;
  onRemoveBreakPoint: (id: string) => void;
}

export default function ScoreCanvas({ 
  hymnInfo, 
  imageUrl, 
  onAddBreakPoint, 
  onRemoveBreakPoint 
}: ScoreCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // 이미지 URL이 변경될 때만 로딩 상태 리셋
    if (imageRef.current) {
      setImageLoaded(false);
      
      // 10초 후에도 로딩이 안 되면 강제로 진행
      const timeout = setTimeout(() => {
        if (!imageLoaded) {
          console.warn('이미지 로딩 타임아웃, 강제 진행');
          setImageLoaded(true);
        }
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [imageUrl, imageLoaded]);

  const handleImageLoad = () => {
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 캔버스 성능 최적화 설정
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'low';
        
                 // 이미지 크기 계산 (모바일 최적화)
         const maxWidth = window.innerWidth > 768 ? 1200 : 800; // 모바일에서는 더 작게
         const maxHeight = window.innerWidth > 768 ? 1600 : 1000;
         
         let { width, height } = img;
         if (width > maxWidth || height > maxHeight) {
           const ratio = Math.min(maxWidth / width, maxHeight / height);
           width = Math.floor(width * ratio);
           height = Math.floor(height * ratio);
         }
        
        // 캔버스 크기 설정
        canvas.width = width;
        canvas.height = height;
        
        // 이미지 그리기 (최적화된 크기로)
        ctx.drawImage(img, 0, 0, width, height);
        
        setImageLoaded(true);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageLoaded || !imageRef.current) return;
    
    const coordinates = calculateImageCoordinates(e, canvasRef.current, imageRef.current);
    if (coordinates) {
      onAddBreakPoint(coordinates.y);
    }
  };

  return (
    <div className="flex justify-center overflow-y-auto">
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
            <div className="text-gray-500 flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div>이미지 처리 중...</div>
              <div className="text-xs text-gray-400">잠시만 기다려주세요</div>
            </div>
          </div>
        )}
        
        {/* 자르기 라인 표시 */}
        {imageLoaded && hymnInfo.breakPoints.map((breakPoint) => {
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
                  onRemoveBreakPoint(breakPoint.id);
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

             {/* 숨겨진 이미지 (로딩용) */}
       <img
         ref={imageRef}
         src={imageUrl}
         alt={`찬미가 ${hymnInfo.hymnNumber}장`}
         onLoad={handleImageLoad}
         onError={() => {
           console.error('이미지 로딩 실패:', imageUrl);
           // 에러 발생 시에도 모달은 열리도록 처리
           setImageLoaded(true);
         }}
         className="hidden"
       />
    </div>
  );
}
