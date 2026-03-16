export type TabName = "home" | "add" | "verify" | "history" | "mypage";
export type ModalType = "none" | "loginChoice" | "emailLogin" | "signup";
export type AnalysisResult = "allow" | "review" | "block";
export type AnalysisStage = "idle" | "ready" | "running" | AnalysisResult;

export interface ActivityItem {
  status: "ALLOW" | "REVIEW" | "BLOCK";
  title: string;
  description: string;
  progress?: number;
  tone: string;
}

export interface UploadHistoryItem {
  id: string;
  title: string;
  date: string;
  owner: string;
  tone: string;
}

export interface HistoryItem {
  id: string;
  type: "allow" | "review";
  fileName: string;
  summary: string;
  timestamp: string;
  cosine: string;
  phash: string;
  extra: string;
}

export interface RegisteredContentResponse {
  id: number;
  public_id: string;
  status: "pending" | "allow" | "review" | "block" | "failed";
  original_filename: string;
  original_storage_key: string;
  mime_type: string;
  file_size: number;
  file_url: string | null;
  decision: "allow" | "review" | "block" | "";
  reason: string;
  next_action: "none" | "start_vote" | "";
  top_cosine: number | null;
  top_phash_dist: number | null;
  top_match: {
    db_key?: string | null;
    db_file?: string | null;
    cosine?: number | null;
    phash_dist?: number | null;
  };
  candidates: Array<{
    db_key?: string | null;
    db_file?: string | null;
    cosine?: number | null;
    phash_dist?: number | null;
  }>;
  watermark: {
    requested?: boolean;
    model?: string | null;
    nbits?: number | null;
    scaling_w?: number | null;
    proportion_masked?: number | null;
  };
  timing_ms: {
    download?: number;
    embed?: number;
    ann_search?: number;
    phash?: number;
    total?: number;
  };
}

export interface RegisterResultConfig {
  badge: string;
  title: string;
  subtitle: string;
  similarity: string;
  note: string;
  tone: string;
  threshold: string;
  phashDistance: string;
  delta: string;
  primaryAction: string;
  metricLabel: string;
}
