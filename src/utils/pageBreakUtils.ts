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
  if (!imageRef) return null;
  
  const rect = canvas.getBoundingClientRect();
  
  // Canvas 내부 좌표 계산
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Canvas와 이미지 크기 비율 계산
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // 실제 이미지 좌표로 변환
  const actualX = x * scaleX;
  const actualY = y * scaleY;
  
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
