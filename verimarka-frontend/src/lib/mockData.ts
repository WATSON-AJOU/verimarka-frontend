import type {
  ActivityItem,
  HistoryItem,
  RegisterResultConfig,
  TabName,
  UploadHistoryItem,
} from "../types/app";

export const tabs: Array<{
  key: TabName;
  label: string;
  requiresAuth?: boolean;
  requiresVerified?: boolean;
}> = [
  { key: "home", label: "홈" },
  { key: "add", label: "저작물 등록", requiresAuth: true, requiresVerified: true },
  { key: "verify", label: "저작물 검증", requiresAuth: true, requiresVerified: true },
  { key: "history", label: "분석 기록", requiresAuth: true, requiresVerified: true },
];

export const systemCards = [
  {
    icon: "AI",
    title: "의미 기반 유사도 분석",
    description: "문맥 특징을 임베딩으로 변환해 실질적 유사도를 판별합니다.",
  },
  {
    icon: "PX",
    title: "픽셀 정밀 비교",
    description: "미세 편집과 왜곡을 감지해 조작 징후를 정량적으로 확인합니다.",
  },
  {
    icon: "BC",
    title: "블록체인 신뢰 기록",
    description: "등록·검증 결과를 변경 불가능한 형태로 저장해 추적성을 확보합니다.",
  },
];

export const homeActivities: ActivityItem[] = [
  {
    status: "ALLOW",
    title: "일러스트_final.jpg",
    description: "신규 등록 승인 완료 · 저작물 등록됨",
    tone: "allow",
  },
  {
    status: "REVIEW",
    title: "캐릭터_A.png",
    description: "투표 진행 중 · D-2",
    progress: 78,
    tone: "review",
  },
  {
    status: "BLOCK",
    title: "배경이미지_B.png",
    description: "유사도 98%로 등록 차단됨",
    tone: "block",
  },
];

export const recentUploads: UploadHistoryItem[] = [
  { id: "1", title: "일러스트_A.jpg", date: "2026.03.07", owner: "ArtistUser1", tone: "sunrise" },
  { id: "2", title: "도시풍경_B.png", date: "2026.03.06", owner: "TravelFan_3", tone: "blue" },
  { id: "3", title: "UX_가이드.png", date: "2026.03.05", owner: "UX.Design", tone: "review" },
  { id: "4", title: "브랜딩_시안C.png", date: "2026.03.05", owner: "StudioMint", tone: "green" },
];

export const historyItems: HistoryItem[] = [
  {
    id: "82401",
    type: "allow",
    fileName: "풍경_최종.png",
    summary: "워터마크 삽입 완료 (토큰 #82401)",
    timestamp: "2026.02.26 14:30",
    cosine: "0.1243 (12.4%)",
    phash: "Distance 5 / Threshold 8",
    extra: "Polygon · Token #82401",
  },
  {
    id: "82396",
    type: "review",
    fileName: "캐릭터_시안A.jpg",
    summary: "투표 진행 중 · D-1",
    timestamp: "2026.02.25 09:15",
    cosine: "0.7421 (74.2%)",
    phash: "Distance 8 / Threshold 8",
    extra: "찬성 14 · 반대 6",
  },
  {
    id: "82374",
    type: "allow",
    fileName: "도시풍경_B.png",
    summary: "저작물 등록 승인 완료 (토큰 #82374)",
    timestamp: "2026.02.24 11:20",
    cosine: "0.1832 (18.3%)",
    phash: "Distance 12 / Threshold 8",
    extra: "Polygon · Token #82374",
  },
];

export const resultConfig: Record<"allow" | "review" | "block", RegisterResultConfig> = {
  allow: {
    badge: "ALLOW",
    title: "등록 가능한 콘텐츠입니다.",
    subtitle: "유사한 콘텐츠가 발견되지 않았습니다.",
    similarity: "12.4%",
    note: "다음 단계에서 워터마크 삽입 및 토큰 발행 준비를 진행할 수 있습니다.",
    tone: "allow",
    threshold: "0.7500",
    phashDistance: "8",
    delta: "-0.6257",
    primaryAction: "워터마크 삽입 진행하기",
    metricLabel: "Cosine Similarity",
  },
  review: {
    badge: "REVIEW",
    title: "보류 판정입니다.",
    subtitle: "유사 후보가 감지되어 추가 검토가 필요합니다.",
    similarity: "74.2%",
    note: "검토 큐로 전달되며 블록체인 투표 결과에 따라 최종 상태가 확정됩니다.",
    tone: "review",
    threshold: "0.7500",
    phashDistance: "8",
    delta: "-0.0079",
    primaryAction: "수동 검토 요청하기",
    metricLabel: "Cosine Similarity",
  },
  block: {
    badge: "BLOCK",
    title: "등록이 제한된 콘텐츠입니다.",
    subtitle: "유사도가 임계치를 초과했습니다.",
    similarity: "96.3%",
    note: "중복 가능성이 높아 현재 파일은 등록이 차단되었습니다.",
    tone: "block",
    threshold: "0.8500",
    phashDistance: "4",
    delta: "+0.1128",
    primaryAction: "다른 이미지 업로드",
    metricLabel: "Cosine Similarity",
  },
};
