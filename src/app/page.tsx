'use client';

import { useState } from 'react';
import HymnInput from '@/components/HymnInput';
import HymnList from '@/components/HymnList';
import DownloadButtons from '@/components/DownloadButtons';
import { HymnItem } from '@/types/hymn';

export default function Home() {
  const [hymns, setHymns] = useState<HymnItem[]>([]);

  const addHymn = (hymnNumber: number) => {
    const newHymn: HymnItem = {
      id: Date.now().toString(),
      number: hymnNumber,
      imageUrl: `https://www.adventist.or.kr/data/hymnal/NOTE_2016/${hymnNumber}.gif`,
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
