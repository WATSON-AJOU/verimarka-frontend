import grapeImage from "../../assets/verimarka.png";
import type { RegisterResultConfig, RegisteredContentResponse, UploadHistoryItem } from "../../types/app";

interface RegisterPageProps {
  isLoggedIn: boolean;
  selectedFile: File | null;
  previewUrl: string;
  analysisStage: "idle" | "ready" | "running" | "allow" | "review" | "block";
  analysisProgress: number;
  registerResult: RegisterResultConfig | null;
  contentResult: RegisteredContentResponse | null;
  recentUploads: UploadHistoryItem[];
  onPickFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerPicker: () => void;
  onStartAnalysis: () => void;
  onResetToHome: () => void;
  onResetToReady: () => void;
  onSelectAnother: () => void;
  onPrimaryAction: () => void;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
  formatFileSize: (bytes: number) => string;
}

export default function RegisterPage({
  selectedFile,
  previewUrl,
  analysisStage,
  analysisProgress,
  registerResult,
  contentResult,
  recentUploads,
  onPickFile,
  onTriggerPicker,
  onStartAnalysis,
  onResetToHome,
  onResetToReady,
  onSelectAnother,
  onPrimaryAction,
  uploadInputRef,
  formatFileSize,
}: RegisterPageProps) {
  const candidatePreviewUrl = previewUrl || grapeImage;
  const topCosineValue = contentResult?.top_cosine;
  const topCosineLabel =
    typeof topCosineValue === "number"
      ? topCosineValue.toFixed(4)
      : analysisStage === "review"
        ? "0.7421"
        : "0.9628";
  const topCosinePercent =
    typeof topCosineValue === "number" ? `${(topCosineValue * 100).toFixed(1)}%` : registerResult?.similarity;
  const topPhashLabel =
    typeof contentResult?.top_phash_dist === "number"
      ? String(contentResult.top_phash_dist)
      : registerResult?.phashDistance ?? "8";
  const candidateLabel = contentResult?.top_match?.db_file || "concept_scene.jpg";

  return (
    <section className="register-layout">
      <article className="register-card">
        <div className="register-header">
          <h2>원본 이미지를 등록하세요.</h2>
          <p>이미지를 업로드하면 등록 절차가 시작됩니다.</p>
        </div>

        <input
          ref={uploadInputRef}
          className="upload-input"
          type="file"
          accept="image/png,image/jpeg"
          onChange={onPickFile}
        />

        {!selectedFile ? (
          <button className="upload-dropzone" type="button" onClick={onTriggerPicker}>
            <div className="upload-empty">
              <div>
                <div className="upload-icon">↑</div>
                <p className="upload-title">이미지를 드래그하거나 클릭하여 업로드하세요.</p>
                <p className="upload-desc">지원 포맷: JPG, PNG / 최대 20MB</p>
              </div>
            </div>
          </button>
        ) : (
          <div className="upload-dropzone has-file">
            <div className="upload-preview">
              {analysisStage === "ready" ? (
                <>
                  <span className="upload-success-chip">Success</span>
                  <h3 className="upload-success-title">이미지가 정상적으로 업로드되었습니다.</h3>
                  <p className="upload-success-subtitle">등록 가능 여부를 확인하세요.</p>

                  <div className="upload-result-layout">
                    <div className="upload-preview-card">
                      <button className="change-file-inline" type="button" onClick={onSelectAnother}>
                        다시 선택
                      </button>
                      <div className="upload-image-frame">
                        <img src={previewUrl} alt={selectedFile.name} />
                      </div>
                      <div className="upload-file-info">
                        <strong>{selectedFile.name}</strong>
                        <span>{formatFileSize(selectedFile.size)} · 2026.03.15 23:29</span>
                      </div>
                    </div>

                    <div className="analysis-card">
                      <h4>AI 유사도 분석을 시작하시겠습니까?</h4>
                      <ul className="analysis-list">
                        <li>의미 기반 임베딩 비교</li>
                        <li>픽셀 수준 정밀 비교</li>
                        <li>기존 등록된 유사 콘텐츠 탐색</li>
                      </ul>
                      <button className="btn btn-primary analysis-cta" type="button" onClick={onStartAnalysis}>
                        등록 가능 여부 확인하기
                      </button>
                      <p className="analysis-tip">분석에는 수 초가 소요될 수 있습니다.</p>
                    </div>
                  </div>

                  <div className="upload-bottom-actions">
                    <button className="btn btn-secondary" type="button" onClick={onSelectAnother}>
                      다른 이미지 선택
                    </button>
                    <button className="btn ghost" type="button" onClick={onResetToHome}>
                      홈으로 이동
                    </button>
                  </div>
                </>
              ) : null}

              {analysisStage === "running" ? (
                <div className="analysis-running-view">
                  <h3 className="analysis-running-title">등록 가능 여부를 분석하고 있습니다.</h3>
                  <p className="analysis-running-subtitle">픽셀 정밀 비교를 진행 중입니다.</p>

                  <div className="analysis-running-layout">
                    <div className="analysis-preview-card">
                      <img src={candidatePreviewUrl} alt={selectedFile.name} />
                      <div className="analysis-progress-overlay">
                        <div className="analysis-progress-ring" style={{ ["--progress" as string]: String(Math.round(analysisProgress)) }}>
                          <span>{Math.round(analysisProgress)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="analysis-timeline-card">
                      <ul className="analysis-step-list">
                        <li className="analysis-step is-done">
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[완료]</span> 의미 기반 임베딩 분석</p>
                        </li>
                        <li className="analysis-step is-running">
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[진행 중]</span> 픽셀 정밀 비교</p>
                        </li>
                        <li className="analysis-step is-pending">
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[대기]</span> 기존 등록 콘텐츠 탐색</p>
                        </li>
                        <li className="analysis-step is-pending">
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[대기]</span> 최종 판정 생성</p>
                        </li>
                      </ul>
                      <p className="analysis-running-note">분석에는 수 초가 소요될 수 있습니다.</p>
                    </div>
                  </div>

                  <div className="analysis-running-actions">
                    <button className="btn btn-secondary" type="button" onClick={onSelectAnother}>
                      다른 이미지 선택
                    </button>
                  </div>
                </div>
              ) : null}

              {registerResult ? (
                <div className="analysis-result-view" data-result={registerResult.tone === "review" ? "pending" : registerResult.tone === "block" ? "reject" : "allow"}>
                  <div className="analysis-result-body">
                    <span className="result-badge">{registerResult.badge}</span>
                    <h3 className="result-title">{registerResult.title}</h3>
                    <p className="result-subtitle">{registerResult.subtitle}</p>

                    {registerResult.tone === "allow" ? (
                      <div className="analysis-result-layout">
                        <div className="result-preview-card">
                          <div className="result-image-frame">
                            <img src={previewUrl} alt={selectedFile.name} />
                          </div>
                          <div className="result-file-row">
                            <div>
                              <strong>{selectedFile.name}</strong>
                              <p>{formatFileSize(selectedFile.size)} · 2026.03.15 23:29</p>
                            </div>
                            <div className="result-similarity-box">
                              <span className="similarity-label">{registerResult.metricLabel}</span>
                              <strong>{typeof topCosineValue === "number" ? topCosineValue.toFixed(4) : "0.1243"}</strong>
                              <p>{topCosinePercent || registerResult.similarity}</p>
                            </div>
                          </div>
                        </div>

                        <div className="result-summary-card">
                          <h4>AI 분석 결과</h4>
                          <ul className="result-check-list">
                            <li>의미 기반 임베딩 비교 완료</li>
                            <li>픽셀 정밀 비교 완료</li>
                            <li>DB 후보 탐색 결과 없음</li>
                          </ul>
                          <div className="result-summary-actions">
                            <button className="btn btn-primary result-primary-btn" type="button" onClick={onPrimaryAction}>
                              {registerResult.primaryAction}
                            </button>
                            <button className="btn btn-secondary result-secondary-btn" type="button" onClick={onResetToReady}>
                              업로드 화면으로 돌아가기
                            </button>
                          </div>
                          <p className="result-note">{registerResult.note}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="result-reject-spotlight">
                          <figure className="reject-image-panel">
                            <figcaption>업로드 원본 · {selectedFile.name}</figcaption>
                            <div className="reject-image-frame">
                              <img src={previewUrl} alt={selectedFile.name} />
                            </div>
                          </figure>
                          <figure className="reject-image-panel">
                            <figcaption>유사 후보 · {candidateLabel}</figcaption>
                            <div className="reject-image-frame">
                              <img src={candidatePreviewUrl} alt={candidateLabel} />
                            </div>
                          </figure>
                        </div>

                        <div className="result-reject-metrics">
                          <div className="reject-metric">
                            <span>Cosine Similarity</span>
                            <strong>{topCosineLabel}</strong>
                          </div>
                          <div className="reject-metric">
                            <span>pHash Distance</span>
                            <strong>{topPhashLabel}</strong>
                            <p>기준 ≤ 8</p>
                          </div>
                          <div className="reject-metric">
                            <span>임계값</span>
                            <strong>{registerResult.threshold}</strong>
                          </div>
                          <div className="reject-metric is-alert">
                            <span>{registerResult.tone === "review" ? "임계값 차이" : "초과값"}</span>
                            <strong>{registerResult.delta}</strong>
                          </div>
                        </div>

                        <div className="result-summary-actions">
                          <button className="btn btn-primary result-primary-btn" type="button" onClick={onPrimaryAction}>
                            {registerResult.primaryAction}
                          </button>
                          <button className="btn btn-secondary result-secondary-btn" type="button" onClick={onResetToReady}>
                            업로드 화면으로 돌아가기
                          </button>
                        </div>
                        <p className="result-note">{registerResult.note}</p>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </article>

      <aside className="register-history">
        <h3>최근 등록된 사진</h3>
        <div className="history-scroll">
          {recentUploads.map((item, index) => (
            <article key={item.id} className="history-item">
              <div className={`history-thumb ${index % 3 === 0 ? "history-thumb-landscape" : index % 3 === 1 ? "history-thumb-city" : "history-thumb-character"}`} />
              <div className="history-meta">
                <p>{item.title}</p>
                <span>등록일자: {item.date} · 등록자: {item.owner}</span>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}
