// GA 이벤트 타입 정의
export interface GAEventData {
  event: string;
  items: Array<{
    hymn_id: string;
    hymn_title: string;
    format: string;
    source: string;
  }>;
}

export interface HymnItem {
  id: string;
  number: number;
  imageUrl: string;
} 

// GA 이벤트 상수
export const GA_EVENTS = {
  DOWNLOAD_HYMN: 'download_hymn'
} as const;

// GA 이벤트 소스 상수
export const GA_SOURCES = {
  HYMNAL_LIST: 'hymnal_list',
  SEARCH_RESULT: 'search_result',
  FAVORITE: 'favorite'
} as const;

// GA 이벤트 포맷 상수
export const GA_FORMATS = {
  JPG: 'jpg',
  PDF: 'pdf',
  PNG: 'png'
} as const;
