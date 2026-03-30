import { useEffect, useState } from "react";
import type { HistoryItem } from "../../types/app";

interface HistoryPageProps {
  items: HistoryItem[];
  historyFilter: "all" | "allow" | "block" | "review" | "verify";
  onFilterChange: (filter: "all" | "allow" | "block" | "review" | "verify") => void;
  initialExpandedId?: string | null;
}

export default function HistoryPage({
  items,
  historyFilter,
  onFilterChange,
  initialExpandedId,
}: HistoryPageProps) {
  function extractTokenId(summary: string) {
    const matched = summary.match(/#(\d+)/);
    return matched ? `#${matched[1]}` : "-";
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

  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId ?? null);

  useEffect(() => {
    if (initialExpandedId && items.some((item) => item.id === initialExpandedId)) {
      setExpandedId(initialExpandedId);
    }
  }, [initialExpandedId, items]);

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
                  </div>
                  <div className="history-expand-card history-expand-card--status">
                    {item.type === "allow" ? (
                      <>
                        <h4>블록체인 기록</h4>
                        <div className="history-detail-stat-list">
                          <div className="history-detail-stat">
                            <span>등록 상태</span>
                            <strong>{item.summary}</strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>Token ID</span>
                            <strong>{extractTokenId(item.summary)}</strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>기록 시각</span>
                            <strong>{item.timestamp}</strong>
                          </div>
                        </div>
                        <button type="button" className="btn btn-primary history-detail-btn">
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
                        <button type="button" className="btn btn-primary history-detail-btn">
                          투표 상세 보기
                        </button>
                      </>
                    ) : null}

                    {item.type === "block" ? (
                      <>
                        <h4>차단 상태</h4>
                        <div className="history-detail-stat-list">
                          <div className="history-detail-stat">
                            <span>판정 결과</span>
                            <strong>{item.summary}</strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>차단 사유</span>
                            <strong>{item.extra}</strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>기록 시각</span>
                            <strong>{item.timestamp}</strong>
                          </div>
                        </div>
                      </>
                    ) : null}

                    {item.type === "verify" ? (
                      <>
                        <h4>검증 상태</h4>
                        <div className="history-detail-stat-list">
                          <div className="history-detail-stat">
                            <span>검증 결과</span>
                            <strong>{item.summary}</strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>참고 정보</span>
                            <strong>{item.extra}</strong>
                          </div>
                          <div className="history-detail-stat">
                            <span>검증 시각</span>
                            <strong>{item.timestamp}</strong>
                          </div>
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
