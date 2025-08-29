import { HymnPageBreakInfo, PageBreakPoint } from './type';

/**
 * 새로운 자르기 포인트를 추가하고 정렬된 배열을 반환
 */
export const addBreakPoint = (
  hymnInfo: HymnPageBreakInfo, 
  y: number
): HymnPageBreakInfo => {
  const newBreakPoint: PageBreakPoint = {
    id: Date.now().toString(),
    y,
    isRecommended: false
  };
  
  const updatedBreakPoints = [...hymnInfo.breakPoints, newBreakPoint]
    .sort((a, b) => a.y - b.y);
  
  return {
    ...hymnInfo,
    breakPoints: updatedBreakPoints,
    totalPages: updatedBreakPoints.length + 1
  };
};

/**
 * 자르기 포인트를 제거
 */
export const removeBreakPoint = (
  hymnInfo: HymnPageBreakInfo, 
  id: string
): HymnPageBreakInfo => {
  const updatedBreakPoints = hymnInfo.breakPoints.filter(bp => bp.id !== id);
  
  return {
    ...hymnInfo,
    breakPoints: updatedBreakPoints,
    totalPages: updatedBreakPoints.length + 1
  };
};

/**
 * 모든 자르기 포인트를 제거
 */
export const removeAllBreakPoints = (
  hymnInfo: HymnPageBreakInfo
): HymnPageBreakInfo => {
  return {
    ...hymnInfo,
    breakPoints: [],
    totalPages: 1
  };
};

/**
 * 추천 설정으로 복원
 */
export const restoreRecommendedSettings = (
  originalHymnInfo: HymnPageBreakInfo
): HymnPageBreakInfo => {
  return { ...originalHymnInfo };
};

/**
 * Canvas 클릭 이벤트에서 실제 이미지 좌표 계산
 */
export const calculateImageCoordinates = (
  event: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  imageRef: HTMLImageElement | null
): { x: number; y: number } | null => {
  if (!imageRef) {
    console.log('calculateImageCoordinates: imageRef가 null입니다');
    return null;
  }
  
  const rect = canvas.getBoundingClientRect();
  
  // Canvas 내부 좌표 계산
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // ✅ 정확한 스케일링 계산: 원본 이미지 크기 vs Canvas 크기
  const scaleX = imageRef.naturalWidth / canvas.width;
  const scaleY = imageRef.naturalHeight / canvas.height;
  
  // 실제 이미지 좌표로 변환
  const actualX = x * scaleX;
  const actualY = y * scaleY;
  
  console.log('=== calculateImageCoordinates 상세 로그 ===');
  console.log('클릭 이벤트 정보:', {
    clientX: event.clientX,
    clientY: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY
  });
  console.log('Canvas 정보:', {
    width: canvas.width,
    height: canvas.height,
    offsetWidth: canvas.offsetWidth,
    offsetHeight: canvas.offsetHeight,
    scrollWidth: canvas.scrollWidth,
    scrollHeight: canvas.scrollHeight
  });
  console.log('getBoundingClientRect 정보:', {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom
  });
  console.log('이미지 정보:', {
    naturalWidth: imageRef.naturalWidth,
    naturalHeight: imageRef.naturalHeight,
    width: imageRef.width,
    height: imageRef.height
  });
  console.log('✅ 수정된 스케일링 계산:', {
    canvasX: x,
    canvasY: y,
    scaleX: `${scaleX} (${imageRef.naturalWidth} / ${canvas.width})`,
    scaleY: `${scaleY} (${imageRef.naturalHeight} / ${canvas.height})`,
    actualX,
    actualY
  });
  console.log('========================================');
  
  return { x: actualX, y: actualY };
};

/**
 * Canvas에 이미지 그리기
 */
export const drawImageOnCanvas = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Canvas 크기를 이미지 크기에 맞춤
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  
  // 흰색 배경으로 채우기
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 이미지 그리기
  ctx.drawImage(image, 0, 0);
};
