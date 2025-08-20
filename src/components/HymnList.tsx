'use client';

import { HymnItem } from '@/types/hymn';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';

interface HymnListProps {
  hymns: HymnItem[];
  onRemoveHymn: (id: string) => void;
  onReorderHymns: (hymns: HymnItem[]) => void;
}

interface SortableHymnItemProps {
  hymn: HymnItem;
  onRemove: (id: string) => void;
}

function SortableHymnItem({ hymn, onRemove }: SortableHymnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hymn.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg transition-all ${
        isDragging 
          ? 'bg-blue-50 border-blue-300 shadow-lg scale-105' 
          : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
          {hymn.number}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800">찬미가 {hymn.number}장</p>
          <p className="text-sm text-gray-500">드래그하여 순서 조정</p>
        </div>
      </div>
      
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className="p-2 cursor-move hover:bg-gray-200 rounded-lg transition-colors touch-none"
        style={{ touchAction: 'none' }}
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(hymn.id);
        }}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-2"
        title="제거"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

export default function HymnList({ hymns, onRemoveHymn, onReorderHymns }: HymnListProps) {
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 움직여야 드래그 시작
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 터치 후 250ms 대기
        tolerance: 5, // 5px 허용 오차
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 드래그 중일 때 스크롤 방지
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging]);

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = hymns.findIndex(hymn => hymn.id === active.id);
      const newIndex = hymns.findIndex(hymn => hymn.id === over?.id);
      
      const newOrder = arrayMove(hymns, oldIndex, newIndex);
      onReorderHymns(newOrder);
    }
  };

  return (
    <div className="relative">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        찬미가 목록 ({hymns.length}개)
      </h2>
      
      {hymns.length === 0 ? (
        <p className="text-gray-500 text-center py-8">추가된 찬미가가 없습니다.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={hymns} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {hymns.map((hymn) => (
                <SortableHymnItem
                  key={hymn.id}
                  hymn={hymn}
                  onRemove={onRemoveHymn}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      <p className="text-sm text-gray-500 mt-4">
        드래그 앤 드롭으로 찬미가 순서를 조정할 수 있습니다
      </p>
    </div>
  );
} 