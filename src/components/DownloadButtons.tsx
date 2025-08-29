'use client';

import {
  DOWNLOAD_DELAY,
  ERROR_FONT_COLOR,
  ERROR_FONT_SIZE,
  IMAGE_DOWNLOAD_HEIGHT,
  IMAGE_DOWNLOAD_MARGIN,
  IMAGE_DOWNLOAD_WIDTH,
  IMAGE_QUALITY,
  PDF_FONT_COLOR,
  PDF_FONT_SIZE,
  PDF_MARGIN
} from '@/utils/constants';
import { sendHymnDownloadGAEvent } from '@/utils/hymnDownloadAnalytics';
import { calculateOptimalImageSizeForPDF, processImage, splitImageForPDF } from '@/utils/imageProcessor';
import { GA_FORMATS, HymnItem, HymnPageBreakInfo } from '@/utils/type';
import jsPDF from 'jspdf';
import { useState } from 'react';

interface DownloadButtonsProps {
  hymns: HymnItem[];
  hymnPageBreakInfos: Map<string, HymnPageBreakInfo>;
}

export default function DownloadButtons({ hymns, hymnPageBreakInfos }: DownloadButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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
      sendHymnDownloadGAEvent(hymns, GA_FORMATS.JPG);
      
    } catch (error) {
      console.error('이미지 다운로드 중 오류 발생:', error);
      alert('이미지 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
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
      const { isLongScore, pages } = await splitImageForPDF(
        img, 
        IMAGE_DOWNLOAD_WIDTH, 
        IMAGE_DOWNLOAD_MARGIN, 
        IMAGE_DOWNLOAD_HEIGHT, 
        hymnId,
        hymnPageBreakInfos,
        undefined // 이미지 다운로드의 경우 pageWidth는 필요 없음
      );
      
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
      const { isLongScore, pages } = await splitImageForPDF(
        img, 
        contentWidth, 
        margin, 
        contentHeight, 
        hymn.id,
        hymnPageBreakInfos,
        pageWidth
      );
          
          if (isLongScore && pages.length > 1) {
            // 긴 악보이고 여러 페이지로 분할된 경우에만 각 페이지별로 PDF에 추가
            for (let i = 0; i < pages.length; i++) {
              const page = pages[i];
              
              if (page.base64) {
                // 새로운 최적화 함수를 사용하여 이미지 크기와 위치 계산
                const optimalSize = calculateOptimalImageSizeForPDF(
                  page.width,
                  page.height,
                  pageWidth,
                  pageHeight,
                  margin
                );
                console.log('optimalSize', optimalSize);
                
                pdf.addImage(page.base64, 'JPEG', optimalSize.x, optimalSize.y, optimalSize.width, optimalSize.height);
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
            
            // 새로운 최적화 함수를 사용하여 이미지 크기와 위치 계산
            const optimalSize = calculateOptimalImageSizeForPDF(
              pages[0].width,
              pages[0].height,
              pageWidth,
              pageHeight,
              margin
            );
            
            pdf.addImage(correctedBase64, 'JPEG', optimalSize.x, optimalSize.y, optimalSize.width, optimalSize.height);
            
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
      sendHymnDownloadGAEvent(hymns, GA_FORMATS.PDF);
      
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
          <li>• <strong>높이 1800px 이상</strong>: 검토필요 뱃지가 표시되며, 수동으로 자르기 포인트를 설정하는 것을 권장합니다</li>
          <li>• <strong>수동 설정</strong>: 자르기 포인트를 설정하지 않으면 원본 이미지 그대로 사용됩니다</li>
          <li>• <strong>검토필요</strong>: 긴 악보의 경우 적절한 페이지 분할을 위해 수동 설정을 권장합니다</li>
        </ul>
      </div>
    </div>
  );
} 