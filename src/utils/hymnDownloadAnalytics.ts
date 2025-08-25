/* eslint-disable @typescript-eslint/no-explicit-any */
import { HymnItem } from './type';

export const sendHymnDownloadGAEvent = (
  hymns: HymnItem[],
  format: string,
  source: string
) => {
  if (typeof window !== "undefined" && (window as any).dataLayer) {
    const items = hymns.map((hymn) => ({
      item_id: hymn.number.toString(),
      item_name: `찬송가 ${hymn.number}장`,
      index: hymn.number,
      item_variant: format,
      quantity: 1,
    }));
  
    (window as any).dataLayer.push({
      event: "view_cart",   // gtag의 "event" 파라미터 → dataLayer에서는 필수 키
      currency: "USD",
      value: 0,
      items: items,
    });
  }
};
