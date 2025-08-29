import { HymnPageBreakInfo } from '@/utils/type';

interface ControlPanelProps {
  hymnInfo: HymnPageBreakInfo;
  onRemoveAll: () => void;
}

export default function ControlPanel({ 
  hymnInfo, 
  onRemoveAll 
}: ControlPanelProps) {
  return (
    <div className="p-4 bg-white border-b border-gray-200 pb-2 mb-2 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-md font-semibold text-gray-800">
            현재 자르기 포인트: <span className="text-blue-600">{hymnInfo.breakPoints.length}</span>개
          </div>
          <div className="text-sm text-gray-600">
            총 {hymnInfo.totalPages}페이지
          </div>
        </div>
        
        <button
            onClick={onRemoveAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            모두 제거
          </button>
      </div>
      
      
      
    </div>
  );
}
