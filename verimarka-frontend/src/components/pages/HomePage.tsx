import type { ActivityItem } from "../../types/app";

interface SystemCard {
  icon: string;
  title: string;
  description: string;
}

interface HomePageProps {
  systemCards: SystemCard[];
  activities: ActivityItem[];
  onMoveTab: (tab: "add" | "verify") => void;
}

export default function HomePage({ systemCards, activities, onMoveTab }: HomePageProps) {
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
            {activities.map((activity) => (
              <article key={activity.title} className="glass-activity-card">
                <span className={`badge badge-${activity.tone}`}>{activity.status}</span>
                <div className={`thumb thumb-${activity.tone === "allow" ? "illustration" : activity.tone === "review" ? "owl" : "window"}`} />
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                {typeof activity.progress === "number" ? (
                  <div className="progress">
                    <div className="bar" style={{ width: `${activity.progress}%` }} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
