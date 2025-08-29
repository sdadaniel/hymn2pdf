interface FooterProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function Footer({ onClose, onConfirm }: FooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 p-2 border-t bg-gray-50">
      <button
        onClick={onClose}
        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        취소
      </button>
      <button
        onClick={onConfirm}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        확인
      </button>
    </div>
  );
}
