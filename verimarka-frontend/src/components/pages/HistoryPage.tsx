import { useEffect, useState } from "react";
import { authenticatedFetch } from "../../lib/api";
import type { HistoryItem } from "../../types/app";

interface HistoryPageProps {
  items: HistoryItem[];
  historyFilter: "all" | "allow" | "block" | "review" | "verify";
  onFilterChange: (filter: "all" | "allow" | "block" | "review" | "verify") => void;
  onOpenToast: (message: string, duration?: number) => void;
  onCastReviewVote: (item: HistoryItem, choice: "yes" | "no") => Promise<void>;
  reviewVoteSubmitting?: boolean;
  initialExpandedId?: string | null;
  initialDetailType?: "allow" | "review" | "block" | null;
}

export default function HistoryPage({
  items,
  historyFilter,
  onFilterChange,
  onOpenToast,
  onCastReviewVote,
  reviewVoteSubmitting = false,
  initialExpandedId,
  initialDetailType,
}: HistoryPageProps) {
  function buildWatermarkedFileName(fileName: string) {
    const trimmed = fileName.trim();
    if (!trimmed) return "watermarked_VM";

    const dotIndex = trimmed.lastIndexOf(".");
    if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
      return `${trimmed}_VM`;
    }

    const baseName = trimmed.slice(0, dotIndex);
    const extension = trimmed.slice(dotIndex);
    return `${baseName}_VM${extension}`;
  }

  async function downloadFile(url: string, fileName: string) {
    const response = await authenticatedFetch(url);
    if (!response.ok) {
      throw new Error("다운로드 파일을 불러오지 못했습니다.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function handleDownloadWatermarkedImage(item: HistoryItem) {
    if (!item.downloadUrl) return;
    await downloadFile(item.downloadUrl, buildWatermarkedFileName(item.fileName));
  }

  function parseCosinePercent(value: string) {
    const matched = value.match(/\(([\d.]+)%\)/);
    if (matched) return `${matched[1]}%`;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return `${(numeric * 100).toFixed(1)}%`;
    return "99.6%";
  }

  function truncateHash(value: string) {
    if (!value || value === "-") return "-";
    if (value.length <= 14) return value;
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  function extractTokenId(summary: string) {
    const matched = summary.match(/#(\d+)/);
    return matched ? `#${matched[1]}` : "-";
  }

  function extractRawTxHash(extra: string) {
    const matched = extra.match(/0x[a-fA-F0-9]{10,}/);
    return matched ? matched[0] : "";
  }

  function extractNetwork(extra: string) {
    const matched = extra.match(/^([^·]+)(?:·|$)/);
    return matched?.[1]?.trim() || "Sepolia";
  }

  function getHistoryNetwork(item: HistoryItem) {
    return item.blockchain?.network_name || extractNetwork(item.extra);
  }

  function getHistoryTokenId(item: HistoryItem) {
    const tokenId = item.blockchain?.token_id;
    if (typeof tokenId === "number" || typeof tokenId === "string") return `#${tokenId}`;
    return extractTokenId(item.summary);
  }

  function getHistoryContentHash(item: HistoryItem) {
    return item.blockchain?.file_hash || item.blockchain?.content_hash || "-";
  }

  function getHistoryTxHash(item: HistoryItem) {
    return item.blockchain?.tx_hash || item.blockchain?.transaction_hash || extractRawTxHash(item.extra) || "-";
  }

  function getHistoryTxHashShort(item: HistoryItem) {
    return truncateHash(getHistoryTxHash(item));
  }

  function getHistoryMintedAt(item: HistoryItem) {
    return item.blockchain?.minted_at_display || item.blockchain?.minted_at || `${item.timestamp} UTC`;
  }

  function buildAllowDecisionText(item: HistoryItem) {
    if (item.extra && item.extra !== "-") return item.extra;
    return "중복 후보 없음";
  }

  function parseReviewMeta(extra: string) {
    const deadline = extra.match(/마감\s+([^·]+)/)?.[1]?.trim() ?? "-";
    const yesVotes = Number(extra.match(/찬성\s+(\d+)/)?.[1] ?? 0);
    const noVotes = Number(extra.match(/반대\s+(\d+)/)?.[1] ?? 0);
    const total = yesVotes + noVotes;
    const yesRate = total > 0 ? Math.round((yesVotes / total) * 100) : 50;
    return {
      deadline,
      yesVotes,
      noVotes,
      total,
      yesRate,
      noRate: 100 - yesRate,
    };
  }

  function isVoteClosed(item: HistoryItem) {
    const vote = item.blockchain?.vote;
    const status = (vote?.status || "").trim();
    if (status && status !== "Pending") return true;

    const endTimeRaw = vote?.end_time;
    if (!endTimeRaw) return false;

    const endTime = new Date(endTimeRaw);
    if (Number.isNaN(endTime.getTime())) return false;
    return endTime.getTime() <= Date.now();
  }

  function getVoteSimilarity(item: HistoryItem) {
    const similarity = item.blockchain?.vote?.similarity_percent;
    if (typeof similarity === "number") {
      return `${similarity.toFixed(1)}%`;
    }
    return parseCosinePercent(item.cosine);
  }

  function buildPreviewStyle(url?: string | null) {
    if (!url) return undefined;
    return {
      backgroundImage: `url(${url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as const;
  }

  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId ?? null);
  const [allowDetailId, setAllowDetailId] = useState<string | null>(null);
  const [reviewDetailId, setReviewDetailId] = useState<string | null>(null);
  const [blockDetailId, setBlockDetailId] = useState<string | null>(null);
  const [reviewVoteModalOpen, setReviewVoteModalOpen] = useState(false);

  useEffect(() => {
    if (initialExpandedId && items.some((item) => item.id === initialExpandedId)) {
      setExpandedId(initialExpandedId);
    }
  }, [initialExpandedId, items]);

  useEffect(() => {
    if (!initialExpandedId || !initialDetailType) return;
    if (!items.some((item) => item.id === initialExpandedId && item.type === initialDetailType)) return;

    if (initialDetailType === "allow") setAllowDetailId(initialExpandedId);
    if (initialDetailType === "review") setReviewDetailId(initialExpandedId);
    if (initialDetailType === "block") setBlockDetailId(initialExpandedId);
  }, [initialExpandedId, initialDetailType, items]);

  const allowDetailItem = allowDetailId
    ? (items.find((item) => item.id === allowDetailId && item.type === "allow") ?? null)
    : null;
  const reviewDetailItem = reviewDetailId
    ? (items.find((item) => item.id === reviewDetailId && item.type === "review") ?? null)
    : null;
  const blockDetailItem = blockDetailId
    ? (items.find((item) => item.id === blockDetailId && item.type === "block") ?? null)
    : null;

  useEffect(() => {
    if (!reviewDetailItem) {
      setReviewVoteModalOpen(false);
    }
  }, [reviewDetailItem]);

  async function handleCopyBlockchainUrl(item: HistoryItem) {
    const rawTxHash = getHistoryTxHash(item);
    const networkName = getHistoryNetwork(item).toLowerCase();
    const baseUrl =
      networkName.includes("polygon")
        ? "https://polygonscan.com/tx/"
        : networkName.includes("sepolia")
          ? "https://sepolia.etherscan.io/tx/"
          : "https://sepolia.etherscan.io/tx/";
    const targetUrl = rawTxHash && rawTxHash !== "-" ? `${baseUrl}${rawTxHash}` : `${window.location.origin}/history?entry=${item.id}`;
    await navigator.clipboard.writeText(targetUrl);
    onOpenToast("URL 복사가 완료되었습니다.");
  }

  if (allowDetailItem) {
    return (
      <section className="history-shell">
        <div className="history-allow-detail-view">
          <div className="history-allow-detail-card">
            <span className="history-allow-detail-badge">ALLOW</span>
            <h2>토큰 발행 상세 정보</h2>
            <p>블록체인에 안전하게 저장된 자산 보호 기록입니다.</p>

            <div className="history-allow-detail-grid">
              <section className="history-allow-panel">
                <h3>저작물 정보</h3>
                <div className="history-allow-artwork-frame">
                  <div className="history-compare-caption">원본 이미지</div>
                  <div
                    className={`history-allow-artwork-image ${!allowDetailItem.originalPreviewUrl ? "is-placeholder" : ""}`}
                    style={buildPreviewStyle(allowDetailItem.originalPreviewUrl)}
                  />
                </div>
                <dl className="history-allow-meta">
                  <div>
                    <dt>파일명</dt>
                    <dd>{allowDetailItem.fileName}</dd>
                  </div>
                  <div>
                    <dt>등록 일시</dt>
                    <dd>{allowDetailItem.timestamp}</dd>
                  </div>
                  <div>
                    <dt>워터마크 모델</dt>
                    <dd>WAM (Watson AI Model)</dd>
                  </div>
                  <div>
                    <dt>워터마크 버전</dt>
                    <dd>v2.1.0</dd>
                  </div>
                  <div>
                    <dt>검증 상태</dt>
                    <dd>성공 ({parseCosinePercent(allowDetailItem.cosine)} 일치)</dd>
                  </div>
                </dl>
              </section>

              <section className="history-allow-panel">
                <h3>블록체인 기록 데이터</h3>
                <div className="history-block-candidate-frame">
                  <div className="history-compare-caption">워터마크 삽입본</div>
                  {allowDetailItem.comparisonPreviewUrl ? (
                    <div
                      className="history-allow-artwork-image"
                      style={buildPreviewStyle(allowDetailItem.comparisonPreviewUrl)}
                    />
                  ) : (
                    <div className="history-allow-artwork-image history-allow-artwork-image--message">
                      워터마크 이미지가 없습니다.
                    </div>
                  )}
                </div>
                <dl className="history-allow-chain-meta">
                  <div>
                    <dt>네트워크</dt>
                    <dd>{getHistoryNetwork(allowDetailItem)}</dd>
                  </div>
                  <div>
                    <dt>Token ID</dt>
                    <dd>{getHistoryTokenId(allowDetailItem)}</dd>
                  </div>
                  <div>
                    <dt>Content Hash</dt>
                    <dd>{getHistoryContentHash(allowDetailItem)}</dd>
                  </div>
                  <div>
                    <dt>Tx Hash</dt>
                    <dd>{getHistoryTxHashShort(allowDetailItem)}</dd>
                  </div>
                  <div>
                    <dt>발행 시각</dt>
                    <dd>{getHistoryMintedAt(allowDetailItem)}</dd>
                  </div>
                </dl>
              </section>
            </div>

            <div className="history-allow-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleDownloadWatermarkedImage(allowDetailItem)}
                disabled={!allowDetailItem.downloadUrl}
              >
                워터마크 이미지 다운로드
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleCopyBlockchainUrl(allowDetailItem)}
              >
                 URL 복사
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAllowDetailId(null)}
              >
                기록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reviewDetailItem) {
    const reviewMeta = parseReviewMeta(reviewDetailItem.extra);
    const reviewVoteClosed = isVoteClosed(reviewDetailItem);
    const yesRate = reviewMeta.total > 0 ? reviewMeta.yesRate : 50;
    const noRate = 100 - yesRate;
    const similarityLabel = getVoteSimilarity(reviewDetailItem);

    return (
      <section className="history-shell">
        <div className="history-allow-detail-view">
          <div className="history-allow-detail-card">
            <span className="history-review-detail-badge">REVIEW</span>
            <h2>보류 검토 상세 정보</h2>
            <p>경계 유사도 케이스로 수동 검토 및 투표가 진행 중입니다.</p>

            <div className="history-allow-detail-grid">
              <section className="history-allow-panel">
                <h3>검토 대상 정보</h3>
                <div className="history-allow-artwork-frame">
                  <div className="history-compare-caption">원본 이미지</div>
                  <div
                    className={`history-allow-artwork-image ${!reviewDetailItem.originalPreviewUrl ? "is-placeholder review-placeholder" : ""}`}
                    style={buildPreviewStyle(reviewDetailItem.originalPreviewUrl)}
                  />
                </div>
                <dl className="history-allow-meta">
                  <div>
                    <dt>파일명</dt>
                    <dd>{reviewDetailItem.fileName}</dd>
                  </div>
                  <div>
                    <dt>접수 일시</dt>
                    <dd>{reviewDetailItem.timestamp}:00</dd>
                  </div>
                  <div>
                    <dt>의미 유사도</dt>
                    <dd>{reviewDetailItem.cosine}</dd>
                  </div>
                  <div>
                    <dt>pHash 비교</dt>
                    <dd>{reviewDetailItem.phash}</dd>
                  </div>
                </dl>
              </section>

              <section className="history-allow-panel">
                <h3>투표/검토 진행 현황</h3>
                <div className="history-block-candidate-frame">
                  <div className="history-compare-caption">{reviewDetailItem.comparisonLabel || "유사 후보"}</div>
                  <div
                    className={`history-allow-artwork-image ${!reviewDetailItem.comparisonPreviewUrl ? "is-placeholder review-placeholder" : ""}`}
                    style={buildPreviewStyle(reviewDetailItem.comparisonPreviewUrl)}
                  />
                  {reviewDetailItem.comparisonFileName ? (
                    <strong className="history-compare-file-name history-compare-file-name--block">
                      {reviewDetailItem.comparisonFileName}
                    </strong>
                  ) : null}
                </div>
                <dl className="history-allow-chain-meta">
                  <div>
                    <dt>현재 상태</dt>
                    <dd>{reviewDetailItem.summary}</dd>
                  </div>
                  <div>
                    <dt>마감 예정</dt>
                    <dd>{reviewMeta.deadline}</dd>
                  </div>
                  <div>
                    <dt>투표 현황</dt>
                    <dd>
                      찬성 {reviewMeta.yesVotes} · 반대 {reviewMeta.noVotes}
                    </dd>
                  </div>
                  <div>
                    <dt>참여 인원</dt>
                    <dd>참여자 {reviewMeta.total}명</dd>
                  </div>
                  <div>
                    <dt>진행률</dt>
                    <dd>{reviewMeta.yesRate}%</dd>
                  </div>
                </dl>
                <div className="history-vote-progress history-vote-progress--detail">
                  <div className="history-vote-bar">
                    <div
                      className="history-vote-fill"
                      style={{ width: `${reviewMeta.yesRate}%` }}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="history-allow-actions">
              {!reviewVoteClosed ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setReviewVoteModalOpen(true)}
                >
                  투표 참여하기
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled
                >
                  투표가 종료되었습니다
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setReviewDetailId(null)}
              >
                기록으로 돌아가기
              </button>
            </div>
          </div>
        </div>

        {reviewVoteModalOpen ? (
          <div className="modal-backdrop" onClick={() => setReviewVoteModalOpen(false)}>
            <div className="modal-shell review-vote-modal" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="modal-close" onClick={() => setReviewVoteModalOpen(false)}>
                닫기
              </button>
              <span className="review-vote-modal-tag">REVIEW</span>
              <h3 className="review-vote-modal-title">커뮤니티 검증 투표</h3>
              <p className="review-vote-modal-subtitle">진행 중인 커뮤니티 검증 투표에 바로 참여할 수 있습니다.</p>

              <div className="review-vote-modal-compare-grid">
                <section className="review-vote-modal-panel">
                  <h4>업로드 이미지</h4>
                  <div
                    className={`review-vote-modal-image ${!reviewDetailItem.previewUrl ? "is-placeholder" : ""}`}
                    style={buildPreviewStyle(reviewDetailItem.originalPreviewUrl)}
                  />
                  <strong>{reviewDetailItem.fileName}</strong>
                </section>

                <div className="review-vote-modal-bubble" aria-label={`유사도 ${similarityLabel}`}>
                  <span>유사도</span>
                  <strong>{similarityLabel}</strong>
                </div>

                <section className="review-vote-modal-panel">
                  <h4>{reviewDetailItem.comparisonLabel || "유사 후보"}</h4>
                  <div
                    className={`review-vote-modal-image ${!reviewDetailItem.comparisonPreviewUrl ? "is-candidate-placeholder" : ""}`}
                    style={buildPreviewStyle(reviewDetailItem.comparisonPreviewUrl)}
                  >
                    {!reviewDetailItem.comparisonPreviewUrl ? <span>후보 이미지 준비 중</span> : null}
                  </div>
                  <strong>{reviewDetailItem.comparisonFileName || "유사 후보 비교 필요"}</strong>
                </section>
              </div>

              <div className="review-vote-modal-stat-grid">
                <article className="review-vote-modal-stat">
                  <span>투표 ID</span>
                  <strong>{reviewDetailItem.blockchain?.vote?.vote_id || "VOTE-UNKNOWN"}</strong>
                </article>
                <article className="review-vote-modal-stat">
                  <span>마감 예정</span>
                  <strong>{reviewMeta.deadline}</strong>
                </article>
                <article className="review-vote-modal-stat">
                  <span>참여 인원</span>
                  <strong>{reviewMeta.total}명</strong>
                </article>
              </div>

              <div className="review-vote-modal-bar">
                <div className="review-vote-modal-bar-track">
                  <div className="review-vote-modal-bar-fill is-yes" style={{ width: `${yesRate}%` }}>
                    찬성 {yesRate}%
                  </div>
                  <div className="review-vote-modal-bar-fill is-no" style={{ width: `${noRate}%` }}>
                    반대 {noRate}%
                  </div>
                </div>
              </div>

              <div className="review-vote-modal-actions">
                <button
                  type="button"
                  className="btn review-vote-modal-action review-vote-modal-action-yes"
                  disabled={reviewVoteSubmitting || reviewVoteClosed}
                  onClick={async () => {
                    try {
                      await onCastReviewVote(reviewDetailItem, "yes");
                      setReviewVoteModalOpen(false);
                    } catch {
                      // parent handles toast/error state
                    }
                  }}
                >
                  {reviewVoteSubmitting ? "처리 중..." : "찬성"}
                </button>
                <button
                  type="button"
                  className="btn review-vote-modal-action review-vote-modal-action-no"
                  disabled={reviewVoteSubmitting || reviewVoteClosed}
                  onClick={async () => {
                    try {
                      await onCastReviewVote(reviewDetailItem, "no");
                      setReviewVoteModalOpen(false);
                    } catch {
                      // parent handles toast/error state
                    }
                  }}
                >
                  {reviewVoteSubmitting ? "처리 중..." : "반대"}
                </button>
              </div>

              <p className="review-vote-modal-note">
                {reviewVoteClosed
                  ? "투표가 종료되어 더 이상 참여할 수 없습니다."
                  : "투표 결과는 블록체인 상태에 따라 실시간으로 반영됩니다."}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  if (blockDetailItem) {
    return (
      <section className="history-shell">
        <div className="history-allow-detail-view">
          <div className="history-allow-detail-card">
            <span className="history-block-detail-badge">BLOCK</span>
            <h2>차단 상세 정보</h2>
            <p>중복 가능성이 높아 등록이 차단된 기록입니다.</p>

            <div className="history-allow-detail-grid">
              <section className="history-allow-panel">
                <h3>차단 대상 정보</h3>
                <div className="history-allow-artwork-frame">
                  <div className="history-compare-caption">원본 이미지</div>
                  <div
                    className={`history-allow-artwork-image ${!blockDetailItem.originalPreviewUrl ? "is-placeholder block-placeholder" : ""}`}
                    style={buildPreviewStyle(blockDetailItem.originalPreviewUrl)}
                  />
                </div>
                <dl className="history-allow-meta">
                  <div>
                    <dt>파일명</dt>
                    <dd>{blockDetailItem.fileName}</dd>
                  </div>
                  <div>
                    <dt>접수 일시</dt>
                    <dd>{blockDetailItem.timestamp}:00</dd>
                  </div>
                  <div>
                    <dt>의미 유사도</dt>
                    <dd>{blockDetailItem.cosine}</dd>
                  </div>
                  <div>
                    <dt>pHash 비교</dt>
                    <dd>{blockDetailItem.phash}</dd>
                  </div>
                </dl>
              </section>

              <section className="history-allow-panel">
                <h3>차단 상태</h3>
                <div className="history-block-candidate-frame">
                  <div className="history-compare-caption">{blockDetailItem.comparisonLabel || "유사 후보"}</div>
                  <div
                    className={`history-allow-artwork-image ${!blockDetailItem.comparisonPreviewUrl ? "is-placeholder block-placeholder" : ""}`}
                    style={buildPreviewStyle(blockDetailItem.comparisonPreviewUrl)}
                  />
                  {blockDetailItem.comparisonFileName ? (
                    <strong className="history-compare-file-name history-compare-file-name--block">
                      {blockDetailItem.comparisonFileName}
                    </strong>
                  ) : null}
                </div>
                <dl className="history-allow-chain-meta">
                  <div>
                    <dt>판정 결과</dt>
                    <dd>{blockDetailItem.summary}</dd>
                  </div>
                  <div>
                    <dt>차단 사유</dt>
                    <dd>{blockDetailItem.extra}</dd>
                  </div>
                  <div>
                    <dt>등록 상태</dt>
                    <dd>{blockDetailItem.summary}</dd>
                  </div>
                  <div>
                    <dt>기록 시각</dt>
                    <dd>{blockDetailItem.timestamp}</dd>
                  </div>
                </dl>
              </section>
            </div>

            <div className="history-allow-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setBlockDetailId(null)}
              >
                기록으로 돌아가기
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setBlockDetailId(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="history-shell">
      <div className="history-list-view">
        <div className="history-header">
          <h2>분석 기록</h2>
          <p>ALLOW, BLOCK, REVIEW, 저작물 검증 기록을 한 번에 확인하세요.</p>
          <div className="history-filters">
            {(["all", "allow", "block", "review", "verify"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`history-filter-btn ${historyFilter === filter ? "is-active" : ""}`}
                onClick={() => onFilterChange(filter)}
              >
                {filter === "all"
                  ? "전체"
                  : filter === "allow"
                    ? "ALLOW"
                    : filter === "block"
                      ? "BLOCK"
                      : filter === "review"
                        ? "REVIEW"
                        : "저작물 검증"}
              </button>
            ))}
          </div>
        </div>

        <div className="history-list">
          {items.map((item) => (
            <article
              key={item.id}
              className={`history-log-item ${expandedId === item.id ? "is-expanded" : ""}`}
            >
              <button
                type="button"
                className="history-log-main"
                aria-expanded={expandedId === item.id}
                onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
              >
                <div className="history-log-left">
                  <div
                    className={`history-log-thumb ${
                      item.type === "allow"
                        ? "history-thumb-landscape"
                        : item.type === "block"
                          ? "history-thumb-review"
                          : item.type === "verify"
                            ? "history-thumb-city"
                            : "history-thumb-character"
                    }`}
                    style={item.previewUrl ? { backgroundImage: `url(${item.previewUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  />
                  <div>
                    <div className="history-log-title">
                      <strong>{item.fileName}</strong>
                      <span
                        className={`history-state-badge ${
                          item.type === "allow"
                            ? "is-allow"
                            : item.type === "block"
                              ? "is-block"
                              : item.type === "verify"
                                ? "is-verify"
                                : "is-review"
                        }`}
                      >
                        {item.type === "verify" ? "저작물 검증" : item.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="history-log-desc">{item.summary}</p>
                  </div>
                </div>
                <span className="history-log-time">{item.timestamp}</span>
              </button>
              {expandedId === item.id ? (
                <div className="history-log-expand">
                  <div className="history-expand-card history-expand-card--result">
                    <h4>{item.type === "verify" ? "검증 결과" : "AI 분석 결과"}</h4>
                    {item.type === "allow" ? (
                      <div className="history-detail-line-list">
                        <p>
                          <strong>의미 기반 유사도:</strong> {item.cosine}
                        </p>
                        <p>
                          <strong>pHash 비교:</strong> {item.phash}
                        </p>
                        <p>
                          <strong>판정:</strong> {buildAllowDecisionText(item)}
                        </p>
                      </div>
                    ) : (
                      <div className="history-detail-stat-list">
                        <div className="history-detail-stat">
                          <span>의미 기반 유사도</span>
                          <strong>{item.cosine}</strong>
                        </div>
                        <div className="history-detail-stat">
                          <span>pHash 비교</span>
                          <strong>{item.phash}</strong>
                        </div>
                        <div className="history-detail-stat">
                          <span>{item.type === "verify" ? "검증 메모" : "판정 메모"}</span>
                          <strong>{item.extra}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="history-expand-card history-expand-card--status">
                    {item.type === "allow" ? (
                      <>
                        <h4>블록체인 기록</h4>
                        <div className="history-detail-line-list history-detail-line-list--blockchain">
                          <p>
                            <strong>Token ID:</strong> {getHistoryTokenId(item)}
                          </p>
                          <p>
                            <strong>Content Hash:</strong> {getHistoryContentHash(item)}
                          </p>
                          <p>
                            <strong>Transaction:</strong> {getHistoryTxHashShort(item)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary history-detail-btn"
                          onClick={() => setAllowDetailId(item.id)}
                        >
                          토큰 발행 상세 보기
                        </button>
                      </>
                    ) : null}

                    {item.type === "review" ? (
                      <>
                        <h4>검토 진행 현황</h4>
                        <div className="history-detail-stat-list">
                          <div className="history-detail-stat">
                            <span>현재 상태</span>
                            <strong>{item.summary}</strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>마감 예정</span>
                            <strong>{parseReviewMeta(item.extra).deadline}</strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>투표 현황</span>
                            <strong>
                              찬성 {parseReviewMeta(item.extra).yesVotes} · 반대 {parseReviewMeta(item.extra).noVotes}
                            </strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>참여 인원</span>
                            <strong>{parseReviewMeta(item.extra).total}명</strong>
                          </div>
                        </div>
                        <div className="history-vote-progress">
                          <span>진행률 {parseReviewMeta(item.extra).yesRate}%</span>
                          <div className="history-vote-bar">
                            <div
                              className="history-vote-fill"
                              style={{ width: `${parseReviewMeta(item.extra).yesRate}%` }}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary history-detail-btn"
                          onClick={() => setReviewDetailId(item.id)}
                        >
                          투표 상세 보기
                        </button>
                      </>
                    ) : null}

                    {item.type === "block" ? (
                      <>
                        <h4>차단 상태</h4>
                        <div className="history-detail-line-list">
                          <p>
                            <strong>판정 결과:</strong> {item.summary}
                          </p>
                          <p>
                            <strong>차단 사유:</strong> {item.extra}
                          </p>
                          <p>
                            <strong>기록 시각:</strong> {item.timestamp}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary history-detail-btn"
                          onClick={() => setBlockDetailId(item.id)}
                        >
                          차단 상세 보기
                        </button>
                      </>
                    ) : null}

                    {item.type === "verify" ? (
                      <>
                        <h4>검증 상태</h4>
                        <div className="history-detail-line-list">
                          <p>
                            <strong>검증 결과:</strong> {item.summary}
                          </p>
                          <p>
                            <strong>참고 정보:</strong> {item.extra}
                          </p>
                          <p>
                            <strong>검증 시각:</strong> {item.timestamp}
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
