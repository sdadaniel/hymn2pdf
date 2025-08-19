'use client';

import { HymnItem } from '@/types/hymn';
import jsPDF from 'jspdf';
import { useState } from 'react';

interface DownloadButtonsProps {
  hymns: HymnItem[];
}

const UNIT_PAGE_HEIGHT = 2000;

export default function DownloadButtons({ hymns }: DownloadButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImages = async () => {
    if (hymns.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      for (let i = 0; i < hymns.length; i++) {
        const hymn = hymns[i];
        await downloadImage(hymn.imageUrl, `hymn_${hymn.number}.gif`);
        
        // 다운로드 간격을 두어 브라우저가 처리할 수 있도록 함
        if (i < hymns.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
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

  // 공통 이미지 분할 함수
  const splitImageForPDF = async (img: HTMLImageElement, imgWidth: number, margin: number, contentHeight: number, pageHeight: number, hymnNumber: number) => {
    const isLongScore = img.height > UNIT_PAGE_HEIGHT; // 원본 이미지 높이가 800px 이상이면 긴 악보
    
    if (isLongScore) {
      // 악보 시스템 수 계산 (8줄 또는 12줄)
      const totalSystems = img.height > UNIT_PAGE_HEIGHT*2 ? 12 : 8; // 1200px 이상이면 12줄, 아니면 8줄
      const systemHeight = img.height / totalSystems; // 시스템당 높이
      const systemsPerPage = 4; // 페이지당 4줄씩
      const totalPages = Math.ceil(totalSystems / systemsPerPage); // 총 페이지 수
      
      console.log(`악보 정보: 총 ${totalSystems}줄, ${totalPages}페이지, 시스템 높이: ${systemHeight}px`);
      
      const pages = [];
      
      // 각 페이지별로 처리
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const startSystem = pageNum * systemsPerPage;
        const endSystem = Math.min(startSystem + systemsPerPage, totalSystems);
        const partHeight = (endSystem - startSystem) * systemHeight;
        
        // 해당 부분의 Canvas 생성
        const partCanvas = document.createElement('canvas');
        const partCtx = partCanvas.getContext('2d');
        partCanvas.width = img.width;
        partCanvas.height = partHeight;
        
        if (partCtx) {
          partCtx.fillStyle = 'white'; // 흰색 배경
          partCtx.fillRect(0, 0, partCanvas.width, partCanvas.height);
          partCtx.drawImage(
            img, 
            0, startSystem * systemHeight, img.width, partHeight, 
            0, 0, partCanvas.width, partCanvas.height
          );
        }
        
        const partBase64 = partCanvas.toDataURL('image/png');
        const partImgHeight = (partHeight * imgWidth) / img.width;
        const partY = margin + (contentHeight - partImgHeight) / 2;
        
        pages.push({
          base64: partBase64,
          width: imgWidth,
          height: partImgHeight,
          y: partY,
          pageNumber: pageNum + 1,
          totalPages,
          canvas: partCanvas
        });
      }
      
      return { isLongScore, pages };
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

  const downloadImage = async (url: string, filename: string) => {
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
      const { isLongScore, pages } = await splitImageForPDF(img, 800, 20, 600, 800, 0); // 임시 값들
      
      if (isLongScore) {
        // 긴 악보는 각 페이지별로 JPG로 변환하여 다운로드
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const pageCanvas = page.canvas;
          
          if (pageCanvas) {
            // Canvas를 JPG로 변환 (품질 0.9로 설정)
            const jpgBlob = await new Promise<Blob>((resolve) => {
              pageCanvas.toBlob((blob) => {
                resolve(blob!);
              }, 'image/jpeg', 0.9);
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
        // 짧은 악보는 1장으로 JPG 변환하여 다운로드
        const jpgBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/jpeg', 0.9);
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
      const margin = 20;
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
          const { isLongScore, pages } = await splitImageForPDF(img, contentWidth, margin, contentHeight, pageHeight, hymn.number);
          
          if (isLongScore) {
            // 긴 악보는 각 페이지별로 PDF에 추가
            for (let i = 0; i < pages.length; i++) {
              const page = pages[i];
              
              if (page.base64) {
                pdf.addImage(page.base64, 'PNG', margin, page.y, page.width, page.height);
              }
              
              // 페이지 번호 추가
              pdf.setFontSize(12);
              pdf.setTextColor(100);
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
            // 짧은 악보는 1장에 그대로 추가
            const correctedBase64 = canvas.toDataURL('image/png');
            pdf.addImage(correctedBase64, 'PNG', margin, pages[0].y, pages[0].width, pages[0].height);
            
            // 페이지 번호 추가
            pdf.setFontSize(12);
            pdf.setTextColor(100);
            pdf.text(`Hymn ${hymn.number}`, margin, pageHeight - 10);
          }
          
          // 메모리 정리
          canvas.remove();

          console.log(`Successfully added hymn ${hymn.number} to PDF`);

          // 마지막 찬미가가 아니면 새 페이지 추가
          // 긴 악보는 이미 2장으로 나누어져서 새 페이지가 추가되었으므로 추가로 페이지를 만들지 않음
          if (i < hymns.length - 1 && !isLongScore) {
            pdf.addPage();
          }
        } catch (error) {
          console.error(`PDF 생성 중 오류 (찬미가 ${hymn.number}장):`, error);
          // 오류가 발생해도 계속 진행
          pdf.setFontSize(16);
          pdf.setTextColor(200);
          pdf.text(`찬미가 ${hymn.number}장 - 이미지 로드 실패`, margin, pageHeight / 2);
          pdf.text(`오류: ${error instanceof Error ? error.message : String(error)}`, margin, pageHeight / 2 + 10);
          
          if (i < hymns.length - 1) {
            pdf.addPage();
          }
        }
      }

      // PDF 다운로드
      const filename = `hymns_${hymns.map(h => h.number).join('_')}.pdf`;
      pdf.save(filename);
      console.log(`PDF successfully created: ${filename}`);
      
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
      
      <div className="flex gap-4">
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
           <li>• <strong>이미지 다운로드</strong>: 각 찬미가를 개별 JPG 파일로 다운로드 (긴 악보는 자동으로 페이지별 분할)</li>
           <li>• <strong>PDF 다운로드</strong>: 모든 찬미가를 순서대로 하나의 PDF 파일로 생성 (긴 악보는 자동으로 페이지별 분할)</li>
           <li>• 찬미가 순서는 위 목록의 순서를 따릅니다</li>
           <li>• 8줄 악보는 4줄씩 2장, 12줄 악보는 4줄씩 3장으로 자동 분할됩니다</li>
         </ul>
       </div>
    </div>
  );
} 