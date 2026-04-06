import { useMemo, useState } from "react";
import type { ActivityItem, HistoryItem } from "../../types/app";

interface SystemCard {
  icon: string;
  title: string;
  description: string;
}

interface HomePageProps {
  systemCards: SystemCard[];
  activities: ActivityItem[];
  onMoveTab: (tab: "add" | "verify") => void;
  onCastReviewVote: (item: HistoryItem, choice: "yes" | "no") => Promise<void>;
  reviewVoteSubmitting?: boolean;
}

function parseReviewMeta(extra?: string) {
  const safeExtra = extra || "";
  const deadline = safeExtra.match(/마감\s+([^·]+)/)?.[1]?.trim() ?? "-";
  const yesVotes = Number(safeExtra.match(/찬성\s+(\d+)/)?.[1] ?? 0);
  const noVotes = Number(safeExtra.match(/반대\s+(\d+)/)?.[1] ?? 0);
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

export default function HomePage({
  systemCards,
  activities,
  onMoveTab,
  onCastReviewVote,
  reviewVoteSubmitting = false,
}: HomePageProps) {
  const [selectedReviewActivityId, setSelectedReviewActivityId] = useState<string | null>(null);
  const selectedReviewActivity = useMemo(
    () => activities.find((item) => item.id === selectedReviewActivityId && item.status === "REVIEW") ?? null,
    [activities, selectedReviewActivityId],
  );
  const selectedReviewMeta = parseReviewMeta(selectedReviewActivity?.extra);
  const selectedReviewHistoryItem = selectedReviewActivity
    ? ({
        id: selectedReviewActivity.id || "",
        type: "review",
        fileName: selectedReviewActivity.title,
        summary: selectedReviewActivity.description,
        timestamp: "",
        cosine: typeof selectedReviewActivity.blockchain?.vote?.similarity_percent === "number"
          ? `${selectedReviewActivity.blockchain.vote.similarity_percent.toFixed(1)}%`
          : "-",
        phash: "-",
        extra: selectedReviewActivity.extra || "",
        previewUrl: selectedReviewActivity.previewUrl ?? null,
        blockchain: selectedReviewActivity.blockchain ?? null,
      } satisfies HistoryItem)
    : null;

  return (
    <section id="page-home" className="app-page is-active">
      <div className="home-scroll">
        <section className="home-panel home-hero-panel reveal">
          <h1>디지털 자산 신뢰의 기준을 만듭니다.</h1>
          <p>비가시 워터마크, AI 유사도 분석, 블록체인 기록을 연결해 창작물 등록부터 검증까지 제공합니다.</p>
          <div className="home-hero-actions">
            <button className="btn btn-primary" type="button" onClick={() => onMoveTab("add")}>
              저작물 등록하기
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => onMoveTab("verify")}>
              저작물 검증하기
            </button>
          </div>
        </section>

        <section className="home-panel home-system-panel reveal">
          <div className="home-panel-header">
            <h2>VeriMarka 신뢰 시스템</h2>
            <p>기록 가능한 근거를 남기는 3중 검증 구조</p>
          </div>
          <div className="home-system-grid">
            {systemCards.map((card) => (
              <article key={card.title} className="glass-feature">
                <span>{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-panel home-activity-panel reveal">
          <div className="home-panel-header">
            <h2>최근 활동</h2>
            <p>등록과 검토 상태를 빠르게 확인하세요.</p>
          </div>
          <div className="home-activity-grid">
            {activities.length === 0 ? (
              <article className="glass-activity-card">
                <h3>최근 활동이 없습니다.</h3>
                <p>활동이 생성되면 이 영역에 최신 6건이 표시됩니다.</p>
              </article>
            ) : null}
            {activities.map((activity) => {
              const isReview = activity.status === "REVIEW" && Boolean(activity.id);
              const CardTag = isReview ? "button" : "article";
              return (
              <CardTag
                key={`${activity.status}-${activity.id || activity.title}`}
                className={`glass-activity-card ${isReview ? "glass-activity-card-button" : ""}`}
                {...(isReview
                  ? {
                      type: "button" as const,
                      onClick: () => setSelectedReviewActivityId(activity.id || null),
                    }
                  : {})}
              >
                <span className={`badge badge-${activity.tone}`}>{activity.status}</span>
                <div
                  className={`thumb thumb-${activity.tone === "allow" ? "illustration" : activity.tone === "review" ? "owl" : activity.tone === "verify" ? "green" : "window"}`}
                  style={
                    activity.previewUrl
                      ? {
                          backgroundImage: `url(${activity.previewUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                {typeof activity.progress === "number" ? (
                  <div className="progress">
                    <div className="bar" style={{ width: `${activity.progress}%` }} />
                  </div>
                ) : null}
              </CardTag>
            )})}
          </div>
        </section>
      </div>

      {selectedReviewActivity && selectedReviewHistoryItem ? (
        <div className="modal-backdrop" onClick={() => setSelectedReviewActivityId(null)}>
          <div className="modal-shell review-vote-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedReviewActivityId(null)}>
              닫기
            </button>
            <span className="review-vote-modal-tag">REVIEW</span>
            <h3 className="review-vote-modal-title">커뮤니티 검증 투표</h3>
            <p className="review-vote-modal-subtitle">진행 중인 커뮤니티 검증 투표에 바로 참여할 수 있습니다.</p>

            <div className="review-vote-modal-compare-grid">
              <section className="review-vote-modal-panel">
                <h4>업로드 이미지</h4>
                <div
                  className={`review-vote-modal-image ${!selectedReviewActivity.previewUrl ? "is-placeholder" : ""}`}
                  style={
                    selectedReviewActivity.previewUrl
                      ? {
                          backgroundImage: `url(${selectedReviewActivity.previewUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <strong>{selectedReviewActivity.title}</strong>
              </section>

              <div className="review-vote-modal-bubble">
                <span>유사도</span>
                <strong>
                  {typeof selectedReviewActivity.blockchain?.vote?.similarity_percent === "number"
                    ? `${selectedReviewActivity.blockchain.vote.similarity_percent.toFixed(1)}%`
                    : "-"}
                </strong>
              </div>

              <section className="review-vote-modal-panel">
                <h4>유사 후보</h4>
                <div className="review-vote-modal-image is-candidate-placeholder">
                  <span>후보 이미지 준비 중</span>
                </div>
                <strong>유사 후보 비교 필요</strong>
              </section>
            </div>

            <div className="review-vote-modal-stat-grid">
              <article className="review-vote-modal-stat">
                <span>투표 ID</span>
                <strong>{selectedReviewActivity.blockchain?.vote?.vote_id || "VOTE-UNKNOWN"}</strong>
              </article>
              <article className="review-vote-modal-stat">
                <span>마감 예정</span>
                <strong>{selectedReviewMeta.deadline}</strong>
              </article>
              <article className="review-vote-modal-stat">
                <span>참여 인원</span>
                <strong>{selectedReviewMeta.total}명</strong>
              </article>
            </div>

            <div className="review-vote-modal-bar">
              <div className="review-vote-modal-bar-track">
                <div className="review-vote-modal-bar-fill is-yes" style={{ width: `${selectedReviewMeta.yesRate}%` }}>
                  찬성 {selectedReviewMeta.yesRate}%
                </div>
                <div className="review-vote-modal-bar-fill is-no" style={{ width: `${selectedReviewMeta.noRate}%` }}>
                  반대 {selectedReviewMeta.noRate}%
                </div>
              </div>
            </div>

            <div className="review-vote-modal-actions">
              <button
                type="button"
                className="btn review-vote-modal-action review-vote-modal-action-yes"
                disabled={reviewVoteSubmitting}
                onClick={async () => {
                  try {
                    await onCastReviewVote(selectedReviewHistoryItem, "yes");
                    setSelectedReviewActivityId(null);
                  } catch {
                    // parent handles error state
                  }
                }}
              >
                {reviewVoteSubmitting ? "처리 중..." : "찬성"}
              </button>
              <button
                type="button"
                className="btn review-vote-modal-action review-vote-modal-action-no"
                disabled={reviewVoteSubmitting}
                onClick={async () => {
                  try {
                    await onCastReviewVote(selectedReviewHistoryItem, "no");
                    setSelectedReviewActivityId(null);
                  } catch {
                    // parent handles error state
                  }
                }}
              >
                {reviewVoteSubmitting ? "처리 중..." : "반대"}
              </button>
            </div>

            <p className="review-vote-modal-note">투표 결과는 블록체인 상태에 따라 실시간으로 반영됩니다.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
