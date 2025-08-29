import {
  IMAGE_QUALITY
} from '../constants';
import { HymnItem, HymnPageBreakInfo, PageBreakPoint, PDFPageInfo } from './type';

// 공통 이미지 처리 함수
export const processImage = async (blob: Blob) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });

  // Canvas 크기 설정
  canvas.width = img.width;
  canvas.height = img.height;
  
  // 배경색 설정 (흰색)
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // 이미지를 Canvas에 그리기
  ctx?.drawImage(img, 0, 0);

  // 색상 보정을 위한 필터 적용
  const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
  if (imageData) {
    const data = imageData.data;
    // 색상 반전 문제 해결을 위한 보정
    for (let i = 0; i < data.length; i += 4) {
      // RGB 값이 모두 0에 가까우면 검은색으로, 255에 가까우면 흰색으로 처리
      if (data[i] < 50 && data[i + 1] < 50 && data[i + 2] < 50) {
        data[i] = 0;     // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
      } else if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
      }
    }
    ctx?.putImageData(imageData, 0, 0);
  }

  // 메모리 정리
  URL.revokeObjectURL(img.src);
  
  return { canvas, img };
};

// 페이지 자르기 정보 생성 함수 (자동 breakpoint 제거)
export const createPageBreakInfo = async (hymn: HymnItem): Promise<HymnPageBreakInfo> => {
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(hymn.imageUrl)}`;
    const response = await fetch(proxyUrl, { method: 'GET', cache: 'no-cache' });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    const { img } = await processImage(blob);
    
    // 자동 breakpoint 생성 로직 제거 - 사용자가 수동으로 설정해야 함
    const breakPoints: PageBreakPoint[] = [];
    const totalPages = 1; // 기본값은 1페이지
    
    return {
      hymnId: hymn.id,
      hymnNumber: hymn.number,
      imageUrl: hymn.imageUrl,
      originalHeight: img.height,
      originalWidth: img.width,
      breakPoints,
      totalPages
    };
  } catch (error) {
    console.error('페이지 자르기 정보 생성 실패:', error);
    throw error;
  }
};

// 공통 이미지 분할 함수 (자동 분할 로직 제거)
export const splitImageForPDF = async (
  img: HTMLImageElement, 
  imgWidth: number, 
  margin: number, 
  contentHeight: number, 
  hymnId?: string,
  hymnPageBreakInfos?: Map<string, HymnPageBreakInfo>,
  pageWidth?: number // PDF 페이지 전체 너비 추가
): Promise<{ isLongScore: boolean; pages: PDFPageInfo[] }> => {
  // 사용자 정의 자르기 포인트가 있는지 확인
  const customBreakInfo = hymnId && hymnPageBreakInfos ? hymnPageBreakInfos.get(hymnId) : null;
  
  if (customBreakInfo && customBreakInfo.breakPoints.length > 0) {
    // 사용자 정의 자르기 포인트 사용
    const breakPoints = customBreakInfo.breakPoints;
    const pages = [];
    
    // 첫 페이지 (시작 ~ 첫 번째 자르기 포인트)
    const firstPageHeight = breakPoints[0].y;
    const firstCanvas = document.createElement('canvas');
    const firstCtx = firstCanvas.getContext('2d');
    firstCanvas.width = img.width;
    firstCanvas.height = firstPageHeight;
    
    if (firstCtx) {
      firstCtx.fillStyle = 'white';
      firstCtx.fillRect(0, 0, firstCanvas.width, firstCanvas.height);
      firstCtx.drawImage(img, 0, 0, img.width, firstPageHeight, 0, 0, firstCanvas.width, firstCanvas.height);
    }
    
    const firstPageBase64 = firstCanvas.toDataURL('image/jpeg', IMAGE_QUALITY);
    const firstPageImgHeight = (firstPageHeight * imgWidth) / img.width;
    // 상단 정렬: Y는 margin (위쪽 여백 최소화), X는 가로 중앙
    const firstPageY = margin;
    const firstPageX = pageWidth ? margin + (pageWidth - (margin * 2) - imgWidth) / 2 : margin;
    
    pages.push({
      base64: firstPageBase64,
      width: imgWidth,
      height: firstPageImgHeight,
      y: firstPageY,
      x: firstPageX,
      pageNumber: 1,
      totalPages: breakPoints.length + 1,
      canvas: firstCanvas
    });
    
    // 중간 페이지들
    for (let i = 0; i < breakPoints.length; i++) {
      const startY = breakPoints[i].y;
      const endY = i < breakPoints.length - 1 ? breakPoints[i + 1].y : img.height;
      const pageHeight = endY - startY;
      
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d');
      pageCanvas.width = img.width;
      pageCanvas.height = pageHeight;
      
      if (pageCtx) {
        pageCtx.fillStyle = 'white';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(img, 0, startY, img.width, pageHeight, 0, 0, pageCanvas.width, pageCanvas.height);
      }
      
      const pageBase64 = pageCanvas.toDataURL('image/jpeg', IMAGE_QUALITY);
      const pageImgHeight = (pageHeight * imgWidth) / img.width;
      // 상단 정렬: Y는 margin (위쪽 여백 최소화), X는 가로 중앙
      const pageY = margin;
      const pageX = pageWidth ? margin + (pageWidth - (margin * 2) - imgWidth) / 2 : margin;
      
      pages.push({
        base64: pageBase64,
        width: imgWidth,
        height: pageImgHeight,
        y: pageY,
        x: pageX,
        pageNumber: i + 2,
        totalPages: breakPoints.length + 1,
        canvas: pageCanvas
      });
    }
    
    return { isLongScore: true, pages };
  } else {
    // 자동 분할하지 않음 - 원본 이미지를 1장으로 처리
    const finalImgHeight = (img.height * imgWidth) / img.width;
    // 상단 정렬: Y는 margin (위쪽 여백 최소화), X는 가로 중앙
    const y = margin;
    const x = pageWidth ? margin + (pageWidth - (margin * 2) - imgWidth) / 2 : margin;
    
    return { 
      isLongScore: false,
      pages: [{
        base64: null, // 원본 이미지 사용
        width: imgWidth,
        height: finalImgHeight,
        y: y,
        x: x,
        pageNumber: 1,
        totalPages: 1,
        canvas: null
      }]
    };
  }
};

// PDF에서 이미지 크기 조정 함수 추가
export const adjustImageSizeForPDF = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
) => {
  // 비율을 유지하면서 최대 크기에 맞게 조정
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);
  
  return {
    width: originalWidth * ratio,
    height: originalHeight * ratio
  };
};

// PDF에서 이미지 위치를 정확하게 계산하는 함수
export const calculateImagePositionForPDF = (
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  alignment: 'left' | 'center' | 'right' = 'center'
) => {
  let x: number;
  
  switch (alignment) {
    case 'left':
      x = margin;
      break;
    case 'center':
      x = margin + (pageWidth - imageWidth) / 2;
      break;
    case 'right':
      x = pageWidth - imageWidth - margin;
      break;
    default:
      x = margin;
  }
  
  // 세로는 항상 상단에서 margin만큼
  const y = margin;
  
  return { x, y };
};

// PDF에서 이미지를 최대한 크게 표시하기 위한 크기 계산 함수
export const calculateOptimalImageSizeForPDF = (
  originalWidth: number,
  originalHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin: number
) => {
  // 페이지에서 여백을 제외한 사용 가능한 영역
  const availableWidth = pageWidth - (margin * 2);
  const availableHeight = pageHeight - (margin * 2);
  
  // 이미지 비율
  const imageAspectRatio = originalWidth / originalHeight;
  const pageAspectRatio = availableWidth / availableHeight;
  
  let finalWidth, finalHeight;
  
  if (imageAspectRatio > pageAspectRatio) {
    // 이미지가 더 가로로 긴 경우 - 너비에 맞춤
    finalWidth = availableWidth;
    finalHeight = availableWidth / imageAspectRatio;
  } else {
    // 이미지가 더 세로로 긴 경우 - 높이에 맞춤
    finalHeight = availableHeight;
    finalWidth = availableHeight * imageAspectRatio;
  }
  
  // 가로는 중앙 정렬, 세로는 상단에 가깝게 배치 (위쪽 여백 최소화)
  const x = margin + (availableWidth - finalWidth) / 2;
  const y = margin; // 상단 여백만 적용하여 위쪽 여백 최소화
  
  return {
    width: finalWidth,
    height: finalHeight,
    x,
    y
  };
};
