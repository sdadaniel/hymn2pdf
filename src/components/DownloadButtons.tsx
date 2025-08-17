'use client';

import { HymnItem } from '@/types/hymn';
import jsPDF from 'jspdf';
import { useState } from 'react';

interface DownloadButtonsProps {
  hymns: HymnItem[];
}

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

  const downloadImage = async (url: string, filename: string) => {
    try {
      console.log('Downloading image:', url);
      
      const response = await fetch(url, {
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
      
      console.log(`Successfully downloaded ${filename}, size: ${blob.size} bytes`);
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
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
          
          const response = await fetch(hymn.imageUrl, {
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
          
          // blob을 base64로 변환
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          // 이미지 크기 계산
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = base64;
          });

          // PDF에 맞게 이미지 크기 조정
          let imgWidth = contentWidth;
          let imgHeight = (img.height * imgWidth) / img.width;
          
          if (imgHeight > contentHeight) {
            const scale = contentHeight / imgHeight;
            imgWidth = imgWidth * scale;
            imgHeight = contentHeight;
          }

          // 이미지 중앙 정렬
          const x = margin + (contentWidth - imgWidth) / 2;
          const y = margin + (contentHeight - imgHeight) / 2;

          // PDF에 이미지 추가
          pdf.addImage(base64, 'GIF', x, y, imgWidth, imgHeight);

          // 페이지 번호 추가
          pdf.setFontSize(12);
          pdf.setTextColor(100);
          pdf.text(`찬미가 ${hymn.number}장`, margin, pageHeight - 10);

          console.log(`Successfully added hymn ${hymn.number} to PDF`);

          // 마지막 페이지가 아니면 새 페이지 추가
          if (i < hymns.length - 1) {
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
          <li>• <strong>이미지 다운로드</strong>: 각 찬미가를 개별 GIF 파일로 다운로드</li>
          <li>• <strong>PDF 다운로드</strong>: 모든 찬미가를 순서대로 하나의 PDF 파일로 생성</li>
          <li>• 찬미가 순서는 위 목록의 순서를 따릅니다</li>
          <li>• 이제 직접 이미지 파일을 가져와서 더 안정적으로 작동합니다</li>
        </ul>
      </div>
    </div>
  );
} 