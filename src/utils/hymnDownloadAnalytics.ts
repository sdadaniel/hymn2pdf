import { HymnItem } from './type';

export const sendHymnDownloadGAEvent = (
  hymns: HymnItem[],
  format: string,
  source: string
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const items = hymns.map(hymn => ({
      // GA4가 인식하는 예약 키 (최소 하나 필수)
      item_id: hymn.number.toString(),
      item_name: `찬송가 ${hymn.number}장`,

      // 커스텀 키(보고에 쓰려면 Item-scoped 맞춤 측정기준 등록)
      hymn_id: hymn.number.toString(),
      hymn_title: `찬송가 ${hymn.number}장`,
      format,
      source
    }));

    (window as any).gtag('event', 'download_hymn', {
      items
    });

    console.log('GA Event sent:', { event: 'download_hymn', items });
  }
};
