import { useState } from "react";
import type { HistoryItem } from "../../types/app";

interface HistoryPageProps {
  items: HistoryItem[];
  historyFilter: "all" | "allow" | "block" | "review" | "verify";
  onFilterChange: (filter: "all" | "allow" | "block" | "review" | "verify") => void;
}

export default function HistoryPage({
  items,
  historyFilter,
  onFilterChange,
}: HistoryPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
                  <div className="history-expand-card">
                    <h4>{item.type === "verify" ? "검증 결과" : "AI 분석 결과"}</h4>
                    <ul className="history-expand-list">
                      <li>의미 기반 유사도: {item.cosine}</li>
                      <li>pHash 비교: {item.phash}</li>
                      <li>상세: {item.extra}</li>
                    </ul>
                  </div>
                  <div className="history-expand-card">
                    <h4>
                      {item.type === "allow"
                        ? "등록 상태"
                        : item.type === "review"
                          ? "검토 진행 현황"
                          : item.type === "block"
                            ? "차단 상태"
                            : "검증 상태"}
                    </h4>
                    <ul className="history-expand-list">
                      <li>{item.summary}</li>
                      <li>기록 시각: {item.timestamp}</li>
                    </ul>
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
