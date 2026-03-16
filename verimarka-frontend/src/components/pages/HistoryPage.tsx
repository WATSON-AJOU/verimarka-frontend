import type { HistoryItem } from "../../types/app";

interface HistoryPageProps {
  items: HistoryItem[];
  historyFilter: "all" | "allow" | "review";
  onFilterChange: (filter: "all" | "allow" | "review") => void;
}

export default function HistoryPage({
  items,
  historyFilter,
  onFilterChange,
}: HistoryPageProps) {
  return (
    <section className="history-shell">
      <div className="history-list-view">
        <div className="history-header">
          <h2>분석 기록</h2>
          <p>ALLOW, REVIEW 상태와 판정 근거를 한 번에 확인하세요.</p>
          <div className="history-filters">
            {(["all", "allow", "review"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`history-filter-btn ${historyFilter === filter ? "is-active" : ""}`}
                onClick={() => onFilterChange(filter)}
              >
                {filter === "all" ? "전체" : filter === "allow" ? "ALLOW" : "REVIEW"}
              </button>
            ))}
          </div>
        </div>

        <div className="history-list">
          {items.map((item) => (
            <article key={item.id} className="history-log-item">
              <div className="history-log-main">
                <div className="history-log-left">
                  <div className={`history-log-thumb ${item.type === "allow" ? "history-thumb-landscape" : "history-thumb-character"}`} />
                  <div>
                    <div className="history-log-title">
                      <strong>{item.fileName}</strong>
                      <span className={`history-state-badge ${item.type === "allow" ? "is-allow" : "is-review"}`}>
                        {item.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="history-log-desc">{item.summary}</p>
                  </div>
                </div>
                <span className="history-log-time">{item.timestamp}</span>
              </div>
              <div className="history-log-expand">
                <div className="history-expand-card">
                  <h4>AI 분석 결과</h4>
                  <ul className="history-expand-list">
                    <li>의미 기반 유사도: {item.cosine}</li>
                    <li>pHash 비교: {item.phash}</li>
                    <li>상세: {item.extra}</li>
                  </ul>
                </div>
                <div className="history-expand-card">
                  <h4>{item.type === "allow" ? "등록 상태" : "검토 진행 현황"}</h4>
                  <ul className="history-expand-list">
                    <li>{item.summary}</li>
                    <li>기록 시각: {item.timestamp}</li>
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
