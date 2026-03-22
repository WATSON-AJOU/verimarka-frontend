export type TabName = "home" | "add" | "verify" | "history" | "mypage";
export type ModalType = "none" | "loginChoice" | "emailLogin" | "signup";
export type AnalysisResult = "allow" | "review" | "block";
export type AnalysisStage = "idle" | "ready" | "running" | "watermarking" | "watermarked" | "minting" | "minted" | AnalysisResult;

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

export interface VerifyHistoryItem {
  id: string;
  title: string;
  description: string;
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
  watermark_file_url: string | null;
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
    applied?: boolean;
    output_url?: string | null;
    output_key?: string | null;
    payload_id?: string | null;
    model?: string | null;
    model_version?: string | null;
    nbits?: number | null;
    scaling_w?: number | null;
    proportion_masked?: number | null;
    details?: Record<string, unknown>;
  };
  blockchain: {
    minted?: boolean;
    network_name?: string;
    chain_id?: number | null;
    contract_address?: string;
    recipient_address?: string;
    owner_address?: string;
    wm_id?: number | null;
    token_id?: number | null;
    status?: string;
    verification_link?: string;
    token_uri?: string;
    file_hash?: string;
    tx_hash?: string;
    block_number?: number | null;
    gas_used?: number | null;
    minted_at?: string;
    minted_at_display?: string;
    model_name?: string;
    model_version?: string;
    document?: Record<string, unknown>;
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

export interface VerifyResultResponse {
  outcome: "verified" | "candidate";
  headline_badge: string;
  headline_title: string;
  headline_subtitle: string;
  uploaded: {
    file_name: string;
    file_size: number;
    preview_url: string | null;
    verified_at: string;
    verifier_name: string;
  };
  detect: {
    detected: boolean;
    confidence?: number | null;
    bit_accuracy?: number | null;
    payload_id?: string | null;
    model?: string | null;
    model_version?: string | null;
    status_label?: string;
  };
  blockchain?: {
    token_id?: number | null;
    owner_address?: string | null;
    status?: string | null;
    verification_link?: string | null;
    network_name?: string | null;
    content_hash?: string | null;
    transaction_hash?: string | null;
    minted_at?: string | null;
  };
  candidate?: {
    preview_url?: string | null;
    file_name?: string | null;
    owner_name?: string | null;
    registered_at?: string | null;
    cosine?: number | null;
    phash_dist?: number | null;
    threshold?: number | null;
    summary?: string | null;
  };
}
