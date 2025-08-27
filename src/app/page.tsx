'use client';

import DownloadButtons from '@/components/DownloadButtons';
import HymnInput from '@/components/HymnInput';
import HymnList from '@/components/HymnList';
import HymnPreview from '@/components/HymnPreview';
import InAppBrowserNotice from '@/components/InAppBrowserNotice';
import { useInAppDetection } from '@/hooks/useInAppDetection';
import { createPageBreakInfo } from '@/utils/imageProcessor';
import { HymnItem, HymnPageBreakInfo } from '@/utils/type';
import { useState } from 'react';

export default function Home() {
  const [hymns, setHymns] = useState<HymnItem[]>([]);
  const [hymnPageBreakInfos, setHymnPageBreakInfos] = useState<Map<string, HymnPageBreakInfo>>(new Map());
  const { isInApp } = useInAppDetection();

  const addHymn = async (hymnNumber: number) => {
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
    
    // 찬미가 추가 시 기본 페이지 자르기 정보를 미리 생성하여 높이 정보 저장
    try {
      const hymnInfo = await createPageBreakInfo(newHymn);
      setHymnPageBreakInfos(prev => new Map(prev.set(hymnInfo.hymnId, hymnInfo)));
    } catch (error) {
      console.error('페이지 자르기 정보 생성 실패:', error);
      // 실패해도 찬미가는 추가됨
    }
  };

  const removeHymn = (id: string) => {
    setHymns(hymns.filter(hymn => hymn.id !== id));
    // 찬미가가 제거되면 해당 페이지 자르기 정보도 제거
    setHymnPageBreakInfos(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const reorderHymns = (newOrder: HymnItem[]) => {
    setHymns(newOrder);
  };

  // 페이지 자르기 설정 확인
  const handlePageBreakConfirm = (hymnInfo: HymnPageBreakInfo) => {
    setHymnPageBreakInfos(prev => new Map(prev.set(hymnInfo.hymnId, hymnInfo)));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <InAppBrowserNotice isInApp={isInApp} />

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

            {/* 페이지 미리보기 영역 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <HymnPreview
                hymns={hymns}
                hymnPageBreakInfos={hymnPageBreakInfos}
                onPageBreakConfirm={handlePageBreakConfirm}
              />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <DownloadButtons 
                hymns={hymns} 
                hymnPageBreakInfos={hymnPageBreakInfos}
              />
            </div>
          </>
        )}

        {hymns.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🎵</div>
            <p className="text-lg text-gray-500">
              찬미가 번호를 입력하여 시작하세요
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
