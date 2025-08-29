import { calculateImageCoordinates } from '@/utils/pageBreakUtils';
import { HymnPageBreakInfo } from '@/utils/type';
import { useEffect, useRef, useState } from 'react';

interface ScoreCanvasProps {
  hymnInfo: HymnPageBreakInfo;
  imageUrl: string;
  loadedImage?: HTMLImageElement; // 미리보기에서 로드된 이미지 요소
  onAddBreakPoint: (y: number) => void;
  onRemoveBreakPoint: (id: string) => void;
}

export default function ScoreCanvas({ 
  hymnInfo, 
  imageUrl, 
  loadedImage,
  onAddBreakPoint, 
  onRemoveBreakPoint 
}: ScoreCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // loadedImage로부터 이미지 로드 (최적화됨)
  const loadImageFromElement = (img: HTMLImageElement) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // ✅ 즉시 Canvas 크기 설정 (빠른 렌더링을 위해)
      const maxWidth = window.innerWidth > 768 ? 1200 : 800;
      const maxHeight = window.innerWidth > 768 ? 1600 : 1000;
      
      let { naturalWidth: width, naturalHeight: height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Canvas 크기 설정
      canvas.width = width;
      canvas.height = height;
      
      // ✅ 성능 최적화 설정
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = 'low';
      
      // ✅ requestAnimationFrame으로 비동기 렌더링
      requestAnimationFrame(() => {
        if (ctx && canvas) {
          // 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height);
          
          // 성공 상태 설정
          setImageLoaded(true);
          setImageError(false);
          
          // 타임아웃 정리
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            setLoadingTimeout(null);
          }
          
          console.log('=== ScoreCanvas loadImageFromElement 상세 로그 ===');
          console.log('원본 이미지 크기:', {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          });
          console.log('최적화된 크기:', {
            maxWidth,
            maxHeight,
            finalWidth: width,
            finalHeight: height
          });
          console.log('캔버스 크기:', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
          });
          console.log('화면 크기:', {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            isMobile: window.innerWidth <= 768
          });
          console.log('========================================');
        }
      });
    }
  };

    useEffect(() => {
    // 이미지 URL이 변경될 때 상태 리셋
    console.log('ScoreCanvas: 이미지 URL 변경됨:', imageUrl);
    console.log('ScoreCanvas: 현재 화면 크기:', window.innerWidth, 'x', window.innerHeight);
    console.log('ScoreCanvas: loadedImage 존재 여부:', !!loadedImage);
    
    setImageLoaded(false);
    setImageError(false);
    
    // loadedImage가 있으면 바로 로드
    if (loadedImage && canvasRef.current) {
      console.log('ScoreCanvas: loadedImage로 바로 로드 시작');
      console.log('ScoreCanvas: loadedImage 크기:', loadedImage.naturalWidth, 'x', loadedImage.naturalHeight);
      loadImageFromElement(loadedImage);
      return;
    } else {
      console.log('ScoreCanvas: loadedImage 없음 또는 canvasRef 없음');
      console.log('ScoreCanvas: loadedImage 존재 여부:', !!loadedImage);
      console.log('ScoreCanvas: canvasRef 존재 여부:', !!canvasRef.current);
    }
    
    // 기존 타임아웃 정리
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    // 새로운 타임아웃 설정 (15초)
    const timeout = setTimeout(() => {
      if (!imageLoaded && !imageError) {
        console.warn('ScoreCanvas: 이미지 로딩 타임아웃, 에러 상태로 설정');
        console.warn('ScoreCanvas: 타임아웃 시점의 상태 - loaded:', imageLoaded, 'error:', imageError);
        setImageError(true);
        setImageLoaded(false);
      }
    }, 15000);
    
    setLoadingTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [imageUrl, loadedImage]);

  const handleImageLoad = () => {
    console.log('ScoreCanvas: 이미지 로드 시작');
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      console.log('ScoreCanvas: 이미지 정보:', {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      });
      
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
         
         // 성공 상태 설정
         setImageLoaded(true);
         setImageError(false);
         
         // 타임아웃 정리
         if (loadingTimeout) {
           clearTimeout(loadingTimeout);
           setLoadingTimeout(null);
         }
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageLoaded) return;
    
    // loadedImage가 있으면 그것을 사용, 없으면 imageRef 사용
    const referenceImage = loadedImage || imageRef.current;
    if (!referenceImage) return;
    
    console.log('=== ScoreCanvas 클릭 이벤트 상세 로그 ===');
    console.log('Canvas 상태:', {
      imageLoaded,
      imageError,
      canvasRefExists: !!canvasRef.current
    });
    console.log('참조 이미지 정보:', {
      isLoadedImage: !!loadedImage,
      isImageRef: !!imageRef.current,
      referenceImageNaturalSize: `${referenceImage.naturalWidth}x${referenceImage.naturalHeight}`,
      referenceImageDisplaySize: `${referenceImage.width}x${referenceImage.height}`
    });
    console.log('Canvas 요소 정보:', {
      canvasWidth: canvasRef.current.width,
      canvasHeight: canvasRef.current.height,
      canvasOffsetWidth: canvasRef.current.offsetWidth,
      canvasOffsetHeight: canvasRef.current.offsetHeight
    });
    
    const coordinates = calculateImageCoordinates(e, canvasRef.current, referenceImage);
    if (coordinates) {
      console.log('ScoreCanvas: 최종 좌표 계산 결과:', {
        clickY: e.clientY,
        clickPageY: e.pageY,
        canvasRect: canvasRef.current.getBoundingClientRect(),
        imageSize: `${referenceImage.naturalWidth}x${referenceImage.naturalHeight}`,
        calculatedY: coordinates.y,
        calculatedX: coordinates.x
      });
      onAddBreakPoint(coordinates.y);
    } else {
      console.log('ScoreCanvas: 좌표 계산 실패');
    }
    console.log('========================================');
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
        
        {!imageLoaded && !imageError && (
          <div className="w-96 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-gray-500 flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div>이미지 처리 중...</div>
              <div className="text-xs text-gray-400">잠시만 기다려주세요</div>
            </div>
          </div>
        )}
        
        {imageError && (
          <div className="w-96 h-64 bg-red-50 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center">
            <div className="text-red-500 flex flex-col items-center gap-2">
              <div className="text-4xl">⚠️</div>
              <div>이미지 로딩 실패</div>
              <div className="text-xs text-red-400 text-center">
                네트워크 연결을 확인해주세요<br />
                또는 잠시 후 다시 시도해주세요
              </div>
              <button
                onClick={() => {
                  setImageError(false);
                  setImageLoaded(false);
                  // 이미지 다시 로드 시도
                  if (imageRef.current) {
                    imageRef.current.src = imageUrl;
                  }
                }}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
        
                 {/* 자르기 라인 표시 */}
         {imageLoaded && hymnInfo.breakPoints.map((breakPoint) => {
           const canvas = canvasRef.current;
           if (!canvas) return null;
           
           // loadedImage가 있으면 그것을 사용, 없으면 imageRef 사용
           const referenceImage = loadedImage || imageRef.current;
           if (!referenceImage) return null;
           
           // ✅ 수정된 스케일링: Canvas 실제 크기 vs 원본 이미지 크기
           const scaleY = canvas.height / referenceImage.naturalHeight;
           const displayY = breakPoint.y * scaleY;
           
           console.log('ScoreCanvas: 자르기 라인 위치 계산 (수정됨):', {
             breakPointY: breakPoint.y,
             referenceImageHeight: referenceImage.naturalHeight,
             canvasActualHeight: canvas.height,
             scaleY: `${scaleY} (${canvas.height} / ${referenceImage.naturalHeight})`,
             displayY
           });
           
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
         onError={(e) => {
           const target = e.target as HTMLImageElement;
           console.error('ScoreCanvas: 이미지 로딩 실패:', imageUrl);
           console.error('ScoreCanvas: 에러 상세:', {
             naturalWidth: target.naturalWidth,
             naturalHeight: target.naturalHeight,
             complete: target.complete
           });
           
           // 에러 상태 설정
           setImageError(true);
           setImageLoaded(false);
           
           // 타임아웃 정리
           if (loadingTimeout) {
             clearTimeout(loadingTimeout);
           }
         }}
         className="hidden"
       />
    </div>
  );
}
