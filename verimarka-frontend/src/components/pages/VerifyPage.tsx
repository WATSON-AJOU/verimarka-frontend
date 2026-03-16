export default function VerifyPage() {
  return (
    <section className="register-layout">
      <article className="register-card">
        <div className="register-header">
          <h2>저작물 검증</h2>
          <p>워터마크 검출과 블록체인 조회가 연결될 영역입니다.</p>
        </div>

        <div className="analysis-running-view">
          <h3 className="analysis-running-title">워터마크 검출 기반 진위 확인</h3>
          <p className="analysis-running-subtitle">
            업로드된 이미지의 워터마크를 검출하고, 필요 시 AI 재분석으로 이어지는 화면입니다.
          </p>

          <div className="analysis-running-layout">
            <div className="analysis-timeline-card">
              <ul className="analysis-step-list">
                <li className="analysis-step is-done">
                  <span className="analysis-step-dot" />
                  <p className="analysis-step-title">[예정] 워터마크 검출 결과 표시</p>
                </li>
                <li className="analysis-step is-pending">
                  <span className="analysis-step-dot" />
                  <p className="analysis-step-title">[예정] NFT 정보 조회</p>
                </li>
                <li className="analysis-step is-pending">
                  <span className="analysis-step-dot" />
                  <p className="analysis-step-title">[예정] 미검출 시 AI 재분석</p>
                </li>
              </ul>
            </div>

            <div className="analysis-card">
              <h4>검증 흐름 안내</h4>
              <ul className="analysis-list">
                <li>워터마크 검출 결과와 신뢰 점수 표시</li>
                <li>블록체인 자산 정보 조회</li>
                <li>미검출 시 유사도 분석으로 재확인</li>
              </ul>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
