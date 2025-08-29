export default function DownloadInfo() {
  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-medium text-blue-800 mb-2">다운로드 안내</h3>
      <ul className="text-sm text-blue-700 space-y-1">
        <li>• <strong>이미지 다운로드</strong>: 각 찬미가를 개별 JPG 파일로 다운로드</li>
        <li>• <strong>PDF 다운로드</strong>: 모든 찬미가를 순서대로 하나의 PDF 파일로 생성</li>
        <li>• 찬미가 순서는 위 목록의 순서를 따릅니다</li>
        <li>• <strong>페이지 미리보기</strong>: 썸네일을 클릭하여 자르기 포인트를 설정할 수 있습니다</li>
        <li>• <strong>높이 1800px 이상</strong>: 검토필요 뱃지가 표시되며, 수동으로 자르기 포인트를 설정하는 것을 권장합니다</li>
        <li>• <strong>수동 설정</strong>: 자르기 포인트를 설정하지 않으면 원본 이미지 그대로 사용됩니다</li>
        <li>• <strong>검토필요</strong>: 긴 악보의 경우 적절한 페이지 분할을 위해 수동 설정을 권장합니다</li>
      </ul>
    </div>
  );
}
