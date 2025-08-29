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
} from '@/constants';
import { sendHymnDownloadGAEvent } from '@/utils/hymnDownloadAnalytics';
import { calculateOptimalImageSizeForPDF, processImage, splitImageForPDF } from '@/utils/imageProcessor';
import { GA_FORMATS, HymnItem, HymnPageBreakInfo } from '@/utils/type';
import jsPDF from 'jspdf';

export const downloadImages = async (hymns: HymnItem[], hymnPageBreakInfos: Map<string, HymnPageBreakInfo>) => {
  if (hymns.length === 0) return;
  
  try {
    // 오늘 날짜 가져오기 (YYYY-MM-DD 형식)
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < hymns.length; i++) {
      const hymn = hymns[i];
      await downloadImage(hymn.imageUrl, `${today}.gif`, hymn.id, hymnPageBreakInfos);
      
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
    throw error;
  }
};

export const downloadPDF = async (hymns: HymnItem[], hymnPageBreakInfos: Map<string, HymnPageBreakInfo>) => {
  if (hymns.length === 0) return;
  
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
        
        console.log(`Hymn ${hymn.number}: isLongScore=${isLongScore}, pages.length=${pages.length}`);
        if (pages.length > 1) {
          console.log('Pages info:', pages.map(p => ({ pageNumber: p.pageNumber, totalPages: p.totalPages })));
        }
        
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
            img.width,
            img.height,
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
    throw error;
  }
};

const downloadImage = async (
  url: string, 
  filename: string, 
  hymnId?: string, 
  hymnPageBreakInfos?: Map<string, HymnPageBreakInfo>
) => {
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
