# 찬미가 PDF 변환기 PRD (Product Requirements Document)

## 1. 프로젝트 개요

이 프로젝트는 찬미가 번호를 입력하면 순서대로 찬미가 이미지 또는 PDF로 다운로드할 수 있도록 만드는 웹 애플리케이션입니다.

## 2. 주요 기능

### 2.1 입력 기능
- 찬미가 번호를 입력할 수 있는 input 창 제공
- Drag & Drop으로 찬미가 순서 수정 가능

### 2.2 출력 기능
- **이미지 다운로드**: 여러 개의 이미지가 순서대로 다운로드
- **PDF 다운로드**: 순서대로 정렬된 이미지들을 PDF 형태로 변환하여 다운로드

## 3. 기술적 요구사항

### 3.1 이미지 소스
- **기본 URL**: `https://www.adventist.or.kr/data/hymnal/NOTE_2016/{번호}.gif`
- **동적 파라미터**: `{번호}` 부분만 입력된 숫자로 변경
- **파일 형식**: GIF 이미지 파일 (직접 다운로드 가능)

### 3.2 예시 URL
```
https://www.adventist.or.kr/data/hymnal/NOTE_2016/123.gif
https://www.adventist.or.kr/data/hymnal/NOTE_2016/150.gif
```

## 4. 사용자 경험 (UX) 요구사항

- 직관적인 인터페이스로 찬미가 번호 입력
- Drag & Drop을 통한 간편한 순서 조정
- 명확한 다운로드 옵션 제공 (이미지/PDF)
- 순서대로 정렬된 결과물 제공

## 5. 기술 스택

- **프론트엔드**: Next.js (TypeScript)
- **스타일링**: Tailwind CSS
- **코드 품질**: ESLint
- **아키텍처**: App Router
