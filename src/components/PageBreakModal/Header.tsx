interface HeaderProps {
  hymnNumber: number;
  onClose: () => void;
}

export default function Header({ hymnNumber, onClose }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <Icon />
        <h2 className="text-xl font-bold text-gray-800">
          찬미가 {hymnNumber}장 - 페이지 자르기 설정
        </h2>
      </div>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 text-2xl hover:bg-gray-100 rounded-full p-1 transition-colors"
      >
        ×
      </button>
    </div>
  );
}

const Icon = () => {
  return (
    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
