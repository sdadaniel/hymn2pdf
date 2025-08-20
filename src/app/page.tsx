'use client';

import DownloadButtons from '@/components/DownloadButtons';
import HymnInput from '@/components/HymnInput';
import HymnList from '@/components/HymnList';
import { useInAppDetection } from '@/hooks/useInAppDetection';
import { HymnItem } from '@/types/hymn';
import { useState } from 'react';

export default function Home() {
  const [hymns, setHymns] = useState<HymnItem[]>([]);
  const { isInApp } = useInAppDetection();

  const addHymn = (hymnNumber: number) => {
    // 이미 존재하는 번호인지 확인
    if (hymns.some(hymn => hymn.number === hymnNumber)) {
      alert(`찬미가 ${hymnNumber}장은 이미 추가되어 있습니다.`);
      return;
    }
    
    const newHymn: HymnItem = {
      id: Date.now().toString(),
      number: hymnNumber,
      imageUrl: `https://www.adventist.or.kr/data/hymnal/NOTE_2016/${hymnNumber.toString().padStart(3, '0')}.gif`,
    };
    setHymns([...hymns, newHymn]);
  };

  const removeHymn = (id: string) => {
    setHymns(hymns.filter(hymn => hymn.id !== id));
  };

  const reorderHymns = (newOrder: HymnItem[]) => {
    setHymns(newOrder);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 인앱 브라우저 안내 메시지 */}
        {isInApp && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>인앱 브라우저 감지됨</strong> - 더 나은 사용 경험을 위해 기본 브라우저에서 열어주세요.
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    새 창에서 열기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            찬미가 PDF 변환기
          </h1>
          <p className="text-lg text-gray-600">
            찬미가 번호를 입력하고 순서를 조정하여 이미지나 PDF로 다운로드하세요
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <HymnInput onAddHymn={addHymn} />
        </div>

        {hymns.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <HymnList 
                hymns={hymns} 
                onRemoveHymn={removeHymn}
                onReorderHymns={reorderHymns}
              />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <DownloadButtons hymns={hymns} />
            </div>
          </>
        )}

        {hymns.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🎵</div>
            <p className="text-gray-500 text-lg">
              찬미가 번호를 입력하여 시작하세요
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
