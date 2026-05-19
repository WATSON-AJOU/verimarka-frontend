import { useMemo, useState } from "react";
import type { ActivityItem, HistoryItem } from "../../types/app";
import { useTranslation } from "react-i18next";

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
  const hasVotes = total > 0;
  const yesRate = hasVotes ? Math.round((yesVotes / total) * 100) : 0;
  return {
    deadline,
    yesVotes,
    noVotes,
    total,
    hasVotes,
    yesRate,
    noRate: hasVotes ? 100 - yesRate : 0,
  };
}

export default function HomePage({
  systemCards,
  activities,
  onMoveTab,
  onCastReviewVote,
  reviewVoteSubmitting = false,
}: HomePageProps) {
  const { t } = useTranslation();
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
          <h1>{t("home.heroTitle")}</h1>
          <p>{t("home.heroBody")}</p>
          <div className="home-hero-actions">
            <button className="btn btn-primary" type="button" onClick={() => onMoveTab("add")}>
              {t("home.register")}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => onMoveTab("verify")}>
              {t("home.verify")}
            </button>
          </div>
        </section>

        <section className="home-panel home-system-panel reveal">
          <div className="home-panel-header">
            <h2>{t("home.systemTitle")}</h2>
            <p>{t("home.systemBody")}</p>
          </div>
          <div className="home-system-grid">
            {systemCards.map((card) => (
              <article key={card.title} className="glass-feature">
                <span>{card.icon}</span>
                <h3>{t(`systemCards.${card.icon}.title`)}</h3>
                <p>{t(`systemCards.${card.icon}.description`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-panel home-activity-panel reveal">
          <div className="home-panel-header">
            <h2>{t("home.activityTitle")}</h2>
            <p>{t("home.activityBody")}</p>
          </div>
          <div className="home-activity-grid">
            {activities.length === 0 ? (
              <article className="glass-activity-card">
                <h3>{t("home.noActivityTitle")}</h3>
                <p>{t("home.noActivityBody")}</p>
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
              {t("home.close")}
            </button>
            <span className="review-vote-modal-tag">REVIEW</span>
            <h3 className="review-vote-modal-title">{t("home.reviewTitle")}</h3>
            <p className="review-vote-modal-subtitle">{t("home.reviewSubtitle")}</p>

            <div className="review-vote-modal-compare-grid">
              <section className="review-vote-modal-panel">
                <h4>{t("home.uploadedImage")}</h4>
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
                <span>{t("home.similarity")}</span>
                <strong>
                  {typeof selectedReviewActivity.blockchain?.vote?.similarity_percent === "number"
                    ? `${selectedReviewActivity.blockchain.vote.similarity_percent.toFixed(1)}%`
                    : "-"}
                </strong>
              </div>

              <section className="review-vote-modal-panel">
                <h4>{t("home.candidate")}</h4>
                <div className="review-vote-modal-image is-candidate-placeholder">
                  <span>{t("home.candidatePending")}</span>
                </div>
                <strong>{t("home.candidateNeedReview")}</strong>
              </section>
            </div>

            <div className="review-vote-modal-stat-grid">
              <article className="review-vote-modal-stat">
                <span>{t("home.voteId")}</span>
                <strong>{selectedReviewActivity.blockchain?.vote?.vote_id || t("home.unknownVoteId")}</strong>
              </article>
              <article className="review-vote-modal-stat">
                <span>{t("home.voteDeadline")}</span>
                <strong>{selectedReviewMeta.deadline}</strong>
              </article>
              <article className="review-vote-modal-stat">
                <span>{t("home.participants")}</span>
                <strong>{t("home.participantsCount", { count: selectedReviewMeta.total })}</strong>
              </article>
            </div>

            <div className="review-vote-modal-bar">
              <div className={`review-vote-modal-bar-track ${selectedReviewMeta.hasVotes ? "" : "is-empty"}`}>
                {selectedReviewMeta.hasVotes ? (
                  <>
                    <div className="review-vote-modal-bar-fill is-yes" style={{ width: `${selectedReviewMeta.yesRate}%` }}>
                      {t("home.approveRate", { rate: selectedReviewMeta.yesRate })}
                    </div>
                    <div className="review-vote-modal-bar-fill is-no" style={{ width: `${selectedReviewMeta.noRate}%` }}>
                      {t("home.rejectRate", { rate: selectedReviewMeta.noRate })}
                    </div>
                  </>
                ) : (
                  <span className="review-vote-empty-label">아직 집계된 투표가 없습니다.</span>
                )}
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
