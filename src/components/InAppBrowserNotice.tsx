interface InAppBrowserNoticeProps {
  isInApp: boolean;
}

export default function InAppBrowserNotice({ isInApp }: InAppBrowserNoticeProps) {
  if (!isInApp) return null;

  return (
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
  );
}
