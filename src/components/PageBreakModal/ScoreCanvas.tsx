import { calculateImageCoordinates, drawImageOnCanvas } from '@/utils/pageBreakUtils';
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
    setImageLoaded(false);
  }, [imageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (imageRef.current && canvasRef.current) {
      drawImageOnCanvas(canvasRef.current, imageRef.current);
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
            <div className="text-gray-500">이미지 로딩 중...</div>
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
        className="hidden"
      />
    </div>
  );
}
