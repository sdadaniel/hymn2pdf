'use client';

import { sendHymnDownloadGAEvent } from '@/utils/hymnDownloadAnalytics';
import { GA_FORMATS, GA_SOURCES, HymnItem, HymnPageBreakInfo, PageBreakPoint } from '@/utils/type';
import jsPDF from 'jspdf';
import { useState } from 'react';
import PageBreakModal from './PageBreakModal';

interface DownloadButtonsProps {
  hymns: HymnItem[];
}

// 상수 정의
const UNIT_PAGE_HEIGHT = 2000;
const IMAGE_QUALITY = 0.1; // 이미지 품질 (0.1 ~ 1.0, 낮을수록 용량 절약)
const DOWNLOAD_DELAY = 500; // 다운로드 간격 (ms)
const SYSTEMS_PER_PAGE = 4; // 페이지당 악보 시스템 수
const LONG_SCORE_THRESHOLD = 1200; // 12줄 악보 판단 기준
const IMAGE_DOWNLOAD_WIDTH = 800; // 이미지 다운로드 시 너비
const IMAGE_DOWNLOAD_MARGIN = 20; // 이미지 다운로드 시 여백
const IMAGE_DOWNLOAD_HEIGHT = 600; // 이미지 다운로드 시 높이
const PDF_MARGIN = 20; // PDF 여백 (mm)
const PDF_FONT_SIZE = 12; // PDF 폰트 크기
const PDF_FONT_COLOR = 100; // PDF 폰트 색상
const ERROR_FONT_SIZE = 16; // 오류 메시지 폰트 크기
const ERROR_FONT_COLOR = 200; // 오류 메시지 폰트 색상

export default function DownloadButtons({ hymns }: DownloadButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPageBreakModal, setShowPageBreakModal] = useState(false);
  const [currentHymnInfo, setCurrentHymnInfo] = useState<HymnPageBreakInfo | null>(null);
  const [hymnPageBreakInfos, setHymnPageBreakInfos] = useState<Map<string, HymnPageBreakInfo>>(new Map());

    const downloadImages = async () => {

      

    if (hymns.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      // 오늘 날짜 가져오기 (YYYY-MM-DD 형식)
      const today = new Date().toISOString().split('T')[0];
      
      for (let i = 0; i < hymns.length; i++) {
        const hymn = hymns[i];
        await downloadImage(hymn.imageUrl, `${today}.gif`, hymn.id);
        
        // 다운로드 간격을 두어 브라우저가 처리할 수 있도록 함
        if (i < hymns.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DOWNLOAD_DELAY));
        }
      }
      
      // 모든 다운로드가 성공적으로 완료되면 GA 이벤트 전송
      sendHymnDownloadGAEvent(hymns, GA_FORMATS.JPG, GA_SOURCES.HYMNAL_LIST);
      
    } catch (error) {
      console.error('이미지 다운로드 중 오류 발생:', error);
      alert('이미지 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

    // 공통 이미지 처리 함수
  const processImage = async (blob: Blob) => {
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

  // 페이지 자르기 정보 생성 함수
  const createPageBreakInfo = async (hymn: HymnItem): Promise<HymnPageBreakInfo> => {
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(hymn.imageUrl)}`;
      const response = await fetch(proxyUrl, { method: 'GET', cache: 'no-cache' });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const blob = await response.blob();
      const { img } = await processImage(blob);
      
      const isLongScore = img.height > UNIT_PAGE_HEIGHT;
      const breakPoints: PageBreakPoint[] = [];
      let totalPages = 1;
      
      if (isLongScore) {
        const totalSystems = img.height > LONG_SCORE_THRESHOLD ? 12 : 8;
        const systemHeight = img.height / totalSystems;
        const systemsPerPage = SYSTEMS_PER_PAGE;
        totalPages = Math.ceil(totalSystems / systemsPerPage);
        
        // 추천 자르기 포인트 생성
        for (let i = 1; i < totalPages; i++) {
          breakPoints.push({
            id: `rec_${i}`,
            y: i * systemsPerPage * systemHeight,
            isRecommended: true
          });
        }
      }
      
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
    setHymnPageBreakInfos(prev => new Map(prev.set(hymnInfo.hymnId, hymnInfo)));
  };

  // 공통 이미지 분할 함수
  const splitImageForPDF = async (img: HTMLImageElement, imgWidth: number, margin: number, contentHeight: number, hymnId?: string) => {
    const isLongScore = img.height > UNIT_PAGE_HEIGHT; // 원본 이미지 높이가 800px 이상이면 긴 악보
    
    if (isLongScore) {
      // 사용자 정의 자르기 포인트가 있는지 확인
      const customBreakInfo = hymnId ? hymnPageBreakInfos.get(hymnId) : null;
      
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
        const firstPageY = margin + (contentHeight - firstPageImgHeight) / 2;
        
        pages.push({
          base64: firstPageBase64,
          width: imgWidth,
          height: firstPageImgHeight,
          y: firstPageY,
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
          const pageY = margin + (contentHeight - pageImgHeight) / 2;
          
          pages.push({
            base64: pageBase64,
            width: imgWidth,
            height: pageImgHeight,
            y: pageY,
            pageNumber: i + 2,
            totalPages: breakPoints.length + 1,
            canvas: pageCanvas
          });
        }
        
        return { isLongScore, pages };
      } else {
        // 사용자가 자르기 포인트를 모두 제거했거나 설정하지 않은 경우
        // 원본 이미지를 1장으로 처리 (자동 분할하지 않음)
        const finalImgHeight = (img.height * imgWidth) / img.width;
        const y = margin + (contentHeight - finalImgHeight) / 2;
        
        return { 
          isLongScore: false, // 자동 분할하지 않음
          pages: [{
            base64: null, // 원본 이미지 사용
            width: imgWidth,
            height: finalImgHeight,
            y: y,
            pageNumber: 1,
            totalPages: 1,
            canvas: null
          }]
        };
      }
    } else {
      // 짧은 악보는 1장에 그대로 추가
      const finalImgHeight = (img.height * imgWidth) / img.width;
      const y = margin + (contentHeight - finalImgHeight) / 2;
      
      return { 
        isLongScore, 
        pages: [{
          base64: null, // 원본 이미지 사용
          width: imgWidth,
          height: finalImgHeight,
          y: y,
          pageNumber: 1,
          totalPages: 1,
          canvas: null
        }]
      };
    }
  };

  const downloadImage = async (url: string, filename: string, hymnId?: string) => {
    try {
      console.log('Downloading image:', url);
      
      // 프록시를 통해 이미지 다운로드
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, {
        method: 'GET',
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Downloaded image is empty');
      }
      
      // 공통 이미지 처리 함수 사용
      const { canvas, img } = await processImage(blob);
      
             // 악보 분할 처리
       const { isLongScore, pages } = await splitImageForPDF(img, IMAGE_DOWNLOAD_WIDTH, IMAGE_DOWNLOAD_MARGIN, IMAGE_DOWNLOAD_HEIGHT, hymnId);
      
      if (isLongScore && pages.length > 1) {
        // 긴 악보이고 여러 페이지로 분할된 경우에만 각 페이지별로 JPG로 변환하여 다운로드
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const pageCanvas = page.canvas;
          
          if (pageCanvas) {
            // Canvas를 JPG로 변환 (품질 설정 - 용량 절약)
            const jpgBlob = await new Promise<Blob>((resolve) => {
              pageCanvas.toBlob((blob) => {
                resolve(blob!);
              }, 'image/jpeg', IMAGE_QUALITY);
            });
            
            // JPG 파일명으로 변경 (페이지 번호 포함)
            const jpgFilename = filename.replace('.gif', `_page${page.pageNumber}.jpg`);
            
            console.log(`Successfully converted and downloaded ${jpgFilename}, size: ${jpgBlob.size} bytes`);
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(jpgBlob);
            link.download = jpgFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            // 메모리 정리
            pageCanvas.remove();
          }
        }
      } else {
        // 짧은 악보이거나 자르기 포인트가 없는 경우 1장으로 JPG 변환하여 다운로드
        const jpgBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/jpeg', IMAGE_QUALITY);
        });
        
        // JPG 파일명으로 변경
        const jpgFilename = filename.replace('.gif', '.jpg');
        
        console.log(`Successfully converted and downloaded ${jpgFilename}, size: ${jpgBlob.size} bytes`);
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(jpgBlob);
        link.download = jpgFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
      
      // 메모리 정리
      canvas.remove();
    } catch (error) {
      console.error(`이미지 다운로드 실패 (${filename}):`, error);
      alert(`이미지 다운로드 실패: ${filename}\n\n오류: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  };

  const downloadPDF = async () => {
    if (hymns.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
             const margin = PDF_MARGIN;
       const contentWidth = pageWidth - (margin * 2);
       const contentHeight = pageHeight - (margin * 2);

      for (let i = 0; i < hymns.length; i++) {
        const hymn = hymns[i];
        
        try {
          console.log(`PDF: Downloading hymn ${hymn.number}:`, hymn.imageUrl);
          
          // 프록시를 통해 이미지 다운로드
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(hymn.imageUrl)}`;
          const response = await fetch(proxyUrl, {
            method: 'GET',
            cache: 'no-cache',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Downloaded image is empty');
          }
          
          // 공통 이미지 처리 함수 사용
          const { canvas, img } = await processImage(blob);
          
          // 공통 이미지 분할 함수 사용
          const { isLongScore, pages } = await splitImageForPDF(img, contentWidth, margin, contentHeight, hymn.id);
          
          if (isLongScore && pages.length > 1) {
            // 긴 악보이고 여러 페이지로 분할된 경우에만 각 페이지별로 PDF에 추가
            for (let i = 0; i < pages.length; i++) {
              const page = pages[i];
              
              if (page.base64) {
                pdf.addImage(page.base64, 'PNG', margin, page.y, page.width, page.height);
              }
              
              // 페이지 번호 추가
              pdf.setFontSize(PDF_FONT_SIZE);
              pdf.setTextColor(PDF_FONT_COLOR);
              if (page.totalPages > 1) {
                pdf.text(`Hymn ${hymn.number} - Page ${page.pageNumber}`, margin, pageHeight - 10);
              } else {
                pdf.text(`Hymn ${hymn.number}`, margin, pageHeight - 10);
              }
              
              // 마지막 페이지가 아니면 새 페이지 추가
              if (i < pages.length - 1) {
                pdf.addPage();
              }
              
              // 메모리 정리
              if (page.canvas) {
                page.canvas.remove();
              }
            }
          } else {
            // 짧은 악보이거나 자르기 포인트가 없는 경우 1장에 그대로 추가
            const correctedBase64 = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
            pdf.addImage(correctedBase64, 'JPEG', margin, pages[0].y, pages[0].width, pages[0].height);
            
            // 페이지 번호 추가
            pdf.setFontSize(PDF_FONT_SIZE);
            pdf.setTextColor(PDF_FONT_COLOR);
            pdf.text(`Hymn ${hymn.number}`, margin, pageHeight - 10);
          }
          
          // 메모리 정리
          canvas.remove();

          console.log(`Successfully added hymn ${hymn.number} to PDF`);

          // 마지막 찬미가가 아니면 새 페이지 추가
          // 긴 악보이고 여러 페이지로 분할된 경우는 이미 새 페이지가 추가되었으므로 추가로 페이지를 만들지 않음
          if (i < hymns.length - 1 && !(isLongScore && pages.length > 1)) {
            pdf.addPage();
          }
        } catch (error) {
          console.error(`PDF 생성 중 오류 (찬미가 ${hymn.number}장):`, error);
                     // 오류가 발생해도 계속 진행
           pdf.setFontSize(ERROR_FONT_SIZE);
           pdf.setTextColor(ERROR_FONT_COLOR);
           pdf.text(`찬미가 ${hymn.number}장 - 이미지 로드 실패`, margin, pageHeight / 2);
           pdf.text(`오류: ${error instanceof Error ? error.message : String(error)}`, margin, pageHeight / 2 + 10);
          
          if (i < hymns.length - 1) {
            pdf.addPage();
          }
        }
      }

             // PDF 다운로드
      const today = new Date().toISOString().split('T')[0];
      const filename = `${today}.pdf`;
      pdf.save(filename);
      console.log(`PDF successfully created: ${filename}`);
      
      // PDF 다운로드가 성공적으로 완료되면 GA 이벤트 전송
      sendHymnDownloadGAEvent(hymns, GA_FORMATS.PDF, GA_SOURCES.HYMNAL_LIST);
      
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      alert(`PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        다운로드
      </h2>
      
             {/* 페이지 미리보기 영역 */}
       <div className="mb-4">
         <h3 className="text-lg font-semibold text-gray-700 mb-3">페이지 미리보기</h3>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {hymns.map((hymn) => {
             const hasCustomBreaks = hymnPageBreakInfos.has(hymn.id);
             const customBreakInfo = hymnPageBreakInfos.get(hymn.id);
             
             return (
               <div
                 key={hymn.id}
                 className="group cursor-pointer"
                 onClick={() => openPageBreakModal(hymn)}
               >
                 {/* 썸네일 이미지 */}
                 <div className="relative mb-2">
                   <img
                     src={hymn.imageUrl}
                     alt={`찬미가 ${hymn.number}장`}
                     className="w-full object-contain rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                     style={{ maxHeight: '200px' }}
                   />
                   
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
                   
                   {/* 상태 배지 */}
                   <div className="absolute top-2 right-2">
                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                       hasCustomBreaks
                         ? 'bg-blue-500 text-white'
                         : 'bg-gray-500 text-white'
                     }`}>
                       {hasCustomBreaks ? '커스텀' : '자동'}
                     </span>
                   </div>
                 </div>
                 
                 {/* 정보 */}
                 <div className="text-center">
                   <div className="text-sm font-medium text-gray-800">찬미가 {hymn.number}장</div>
                   <div className="text-xs text-gray-500">
                     {hasCustomBreaks 
                       ? `${customBreakInfo?.totalPages || 1}페이지`
                       : '자동 분할'
                     }
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
       </div>

       <div className="flex gap-4 mb-4">
         <button
           onClick={downloadImages}
           disabled={isDownloading || hymns.length === 0}
           className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
         >
           {isDownloading ? (
             <>
               <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               다운로드 중...
             </>
           ) : (
             <>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               이미지 다운로드 ({hymns.length}개)
             </>
           )}
         </button>

         <button
           onClick={downloadPDF}
           disabled={isDownloading || hymns.length === 0}
           className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
         >
           {isDownloading ? (
             <>
               <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               생성 중...
             </>
           ) : (
             <>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
               </svg>
               PDF 다운로드
             </>
           )}
         </button>
       </div>

                   <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">다운로드 안내</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>이미지 다운로드</strong>: 각 찬미가를 개별 JPG 파일로 다운로드</li>
          <li>• <strong>PDF 다운로드</strong>: 모든 찬미가를 순서대로 하나의 PDF 파일로 생성</li>
          <li>• 찬미가 순서는 위 목록의 순서를 따릅니다</li>
          <li>• <strong>페이지 미리보기</strong>: 썸네일을 클릭하여 자르기 포인트를 설정할 수 있습니다</li>
          <li>• <strong>자동 분할 비활성화</strong>: 자르기 포인트를 모두 제거하면 원본 이미지 그대로 사용됩니다</li>
          <li>• 추천 설정: 8줄 악보는 4줄씩 2장, 12줄 악보는 4줄씩 3장으로 분할하는 추천 포인트 제공</li>
        </ul>
      </div>

      {/* 페이지 자르기 모달 */}
      {showPageBreakModal && currentHymnInfo && (
        <PageBreakModal
          isOpen={showPageBreakModal}
          onClose={() => setShowPageBreakModal(false)}
          hymnInfo={currentHymnInfo}
          onConfirm={handlePageBreakConfirm}
        />
      )}
    </div>
  );
} 