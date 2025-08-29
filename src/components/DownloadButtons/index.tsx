'use client';

import { HymnItem, HymnPageBreakInfo } from '@/utils/type';
import DownloadInfo from './DownloadInfo';
import ImageDownloadButton from './ImageDownloadButton';
import PDFDownloadButton from './PDFDownloadButton';

interface DownloadButtonsProps {
  hymns: HymnItem[];
  hymnPageBreakInfos: Map<string, HymnPageBreakInfo>;
}

export default function DownloadButtons({ hymns, hymnPageBreakInfos }: DownloadButtonsProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        다운로드
      </h2>

      <div className="flex gap-4 mb-4">
        <ImageDownloadButton 
          hymns={hymns} 
          hymnPageBreakInfos={hymnPageBreakInfos} 
        />
        <PDFDownloadButton 
          hymns={hymns} 
          hymnPageBreakInfos={hymnPageBreakInfos} 
        />
      </div>

      <DownloadInfo />
    </div>
  );
}
