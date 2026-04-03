export type TabName = "home" | "add" | "verify" | "history" | "mypage";
export type ModalType = "none" | "loginChoice" | "emailLogin" | "signup";
export type AnalysisResult = "allow" | "review" | "block";
export type AnalysisStage =
  | "idle"
  | "ready"
  | "running"
  | "reviewStarting"
  | "reviewLive"
  | "watermarking"
  | "watermarked"
  | "minting"
  | "mintFailed"
  | "minted"
  | AnalysisResult;

export interface ActivityItem {
  id?: string;
  type?: "allow" | "review" | "block" | "verify";
  status: "ALLOW" | "REVIEW" | "BLOCK" | "VERIFY";
  title: string;
  description: string;
  extra?: string;
  progress?: number;
  tone: string;
  previewUrl?: string | null;
  blockchain?: HistoryItem["blockchain"];
}

export interface UploadHistoryItem {
  id: string;
  title: string;
  date: string;
  owner: string;
  tone: string;
  previewUrl?: string | null;
}

export interface VerifyHistoryItem {
  id: string;
  title: string;
  description: string;
  tone: string;
  previewUrl?: string | null;
}

export interface HistoryItem {
  id: string;
  type: "allow" | "review" | "block" | "verify";
  fileName: string;
  summary: string;
  timestamp: string;
  cosine: string;
  phash: string;
  extra: string;
  previewUrl?: string | null;
  downloadUrl?: string | null;
  blockchain?: {
    network_name?: string | null;
    chain_id?: number | null;
    contract_address?: string | null;
    token_id?: number | string | null;
    file_hash?: string | null;
    content_hash?: string | null;
    tx_hash?: string | null;
    transaction_hash?: string | null;
    owner_address?: string | null;
    recipient_address?: string | null;
    status?: string | null;
    minted_at?: string | null;
    minted_at_display?: string | null;
    vote?: {
      active?: boolean;
      vote_id?: string;
      status?: string;
      upvotes?: number;
      downvotes?: number;
      participant_count?: number;
      end_time?: string | null;
      end_time_display?: string | null;
      started_at?: string | null;
      started_at_display?: string | null;
      finalized_at?: string | null;
      finalized_at_display?: string | null;
      similarity_percent?: number | null;
      threshold?: number | null;
      delta?: number | null;
    } | null;
  } | null;
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
    preview_url?: string | null;
    public_id?: string | null;
    owner_name?: string | null;
    registered_at?: string | null;
  };
  candidates: Array<{
    db_key?: string | null;
    db_file?: string | null;
    cosine?: number | null;
    phash_dist?: number | null;
    preview_url?: string | null;
    public_id?: string | null;
    owner_name?: string | null;
    registered_at?: string | null;
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
    mint_kind?: "content" | "review_vote";
    network_name?: string;
    chain_id?: number | null;
    contract_address?: string;
    recipient_address?: string;
    owner_address?: string;
    author_name?: string;
    wm_id?: number | null;
    token_id?: number | string | null;
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
    vote?: {
      active?: boolean;
      vote_id?: string;
      status?: string;
      upvotes?: number;
      downvotes?: number;
      participant_count?: number;
      end_time?: string | null;
      end_time_display?: string | null;
      started_at?: string | null;
      started_at_display?: string | null;
      finalized_at?: string | null;
      finalized_at_display?: string | null;
      similarity_percent?: number | null;
      threshold?: number | null;
      delta?: number | null;
    };
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
    token_id?: number | string | null;
    owner_address?: string | null;
    author_name?: string | null;
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

export interface WalletSummaryResponse {
  connected: boolean;
  address: string | null;
  chain_id: number | null;
  wallet_type: string;
  network_name: string;
  nft_count: number | null;
  vote_minimum: number;
  vote_eligible: boolean;
  lookup_status: "not_connected" | "ok" | "failed";
  lookup_error?: string | null;
}

export interface AsyncContentJobResponse {
  job_id: string;
  status: "queued" | "running" | "success" | "failure";
  content?: RegisteredContentResponse | null;
}

export interface AsyncVerifyJobResponse {
  job_id: string;
  status: "queued" | "running" | "success" | "failure";
}

export interface AnalysisJobStatusResponse {
  job_id: string;
  job_type: "register" | "verify" | "watermark";
  status: "queued" | "running" | "success" | "failure";
  content?: RegisteredContentResponse | null;
  result?: VerifyResultResponse | null;
  error_code?: string | null;
  error_message?: string | null;
  retryable: boolean;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface ReviewVoteSigningResponse {
  token_id: number;
  vote_id: string;
  voter: string;
  nonce: number;
  deadline: number;
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: {
    Vote: Array<{
      name: string;
      type: string;
    }>;
  };
  primaryType: "Vote";
}

export interface ReviewVoteCastResponse {
  tx_hash?: string | null;
  block_number?: number | null;
  gas_used?: number | null;
  content: RegisteredContentResponse;
}
