'use client';

import { useState } from 'react';

interface HymnInputProps {
  onAddHymn: (hymnNumber: number) => void;
}

export default function HymnInput({ onAddHymn }: HymnInputProps) {
  const [hymnNumber, setHymnNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const number = parseInt(hymnNumber);
    if (number > 0 && number <= 999) {
      onAddHymn(number);
      setHymnNumber('');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        찬미가 번호 입력
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="number"
          value={hymnNumber}
          onChange={(e) => setHymnNumber(e.target.value)}
          placeholder="찬미가 번호 (1-999)"
          min="1"
          max="999"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!hymnNumber || parseInt(hymnNumber) <= 0 || parseInt(hymnNumber) > 999}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          추가
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-2">
        찬미가 번호를 입력하고 추가 버튼을 클릭하세요
      </p>
    </div>
  );
} 