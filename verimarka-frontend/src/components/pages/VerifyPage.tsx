import { SUPPORTED_UPLOAD_ACCEPT, SUPPORTED_UPLOAD_DESCRIPTION } from "../../lib/app-utils";
import type { VerifyHistoryItem, VerifyResultResponse } from "../../types/app";

function isImageMimeType(mimeType: string | null | undefined) {
  return (mimeType || "").startsWith("image/");
}

function getFileKindLabel(mimeType: string | null | undefined) {
  const normalized = (mimeType || "").toLowerCase();
  if (normalized === "application/pdf") return "PDF 문서";
  if (normalized === "application/msword") return "DOC 문서";
  if (normalized === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "DOCX 문서";
  if (normalized.startsWith("image/")) return "이미지";
  return "파일";
}

function getStepClass(progress: number, index: number, total: number) {
  const normalized = Math.max(0, Math.min(progress, 100));
  const segment = 100 / total;
  const completedCount = Math.min(Math.floor(normalized / segment), total);

  if (index < completedCount) return "analysis-step is-done";
  if (index === completedCount && completedCount < total) return "analysis-step is-running";
  return "analysis-step";
}

function getStepState(progress: number, index: number, total: number) {
  const normalized = Math.max(0, Math.min(progress, 100));
  const segment = 100 / total;
  const completedCount = Math.min(Math.floor(normalized / segment), total);

  if (index < completedCount) return "완료";
  if (index === completedCount && completedCount < total) return "진행 중";
  return "대기";
}

function formatDisplayDateTime(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

interface VerifyPageProps {
  selectedFile: File | null;
  previewUrl: string;
  verifyProgress: number;
  verifyRunning: boolean;
  verifyResult: VerifyResultResponse | null;
  verifierName: string;
  verifyRequestedAt: number | null;
  recentItems: VerifyHistoryItem[];
  onOpenOngoingVote: (id: string) => void;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
  formatFileSize: (bytes: number) => string;
  onPickFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerPicker: () => void;
  onStartVerify: () => void;
  onResetVerify: () => void;
}

export default function VerifyPage({
  selectedFile,
  previewUrl,
  verifyProgress,
  verifyRunning,
  verifyResult,
  verifierName,
  verifyRequestedAt,
  recentItems,
  onOpenOngoingVote,
  uploadInputRef,
  formatFileSize,
  onPickFile,
  onTriggerPicker,
  onStartVerify,
  onResetVerify,
}: VerifyPageProps) {
  const uploadedPreview = previewUrl || verifyResult?.uploaded.preview_url || null;
  const verifyRequestedAtLabel = formatDisplayDateTime(verifyRequestedAt);
  const selectedMimeType = selectedFile?.type || "";
  const renderFilePreview = (src: string | null, alt: string, mimeType: string) => {
    if (src && isImageMimeType(mimeType)) {
      return <img src={src} alt={alt} />;
    }
    return <div className="verify-placeholder-frame">{getFileKindLabel(mimeType)}</div>;
  };

  return (
    <section className="verify-layout">
      <article className="register-card">
        <div className="register-header">
          <h2>저작물 검증</h2>
          <p>워터마크 검출을 우선 수행하고, 필요 시 추가 확인 단계로 검증을 이어갑니다.</p>
        </div>

        <input
          ref={uploadInputRef}
          className="upload-input"
          type="file"
          accept={SUPPORTED_UPLOAD_ACCEPT}
          onChange={onPickFile}
        />

        {!selectedFile ? (
          <button className="verify-dropzone" type="button" onClick={onTriggerPicker}>
            <div className="upload-empty">
              <div>
                <div className="verify-dropzone-icon">✓</div>
                <p className="upload-title">검증할 파일을 드래그하거나 클릭하여 업로드하세요.</p>
                <p className="upload-desc">{SUPPORTED_UPLOAD_DESCRIPTION}</p>
              </div>
            </div>
          </button>
        ) : verifyRunning ? (
          <div className="verify-shell">
              <div className="analysis-running-layout">
                <div className="analysis-preview-card">
                  {renderFilePreview(uploadedPreview, selectedFile.name, selectedMimeType)}
                <div className="analysis-progress-overlay">
                  <div className="analysis-progress-ring" style={{ ["--progress" as string]: String(Math.round(verifyProgress)) }}>
                    <span>{Math.round(verifyProgress)}%</span>
                  </div>
                </div>
              </div>

              <div className="analysis-timeline-card">
                <h3 className="analysis-running-title">검증을 진행하고 있습니다.</h3>
                <p className="analysis-running-subtitle">검증 결과를 정리하고 있습니다.</p>
                <ul className="analysis-step-list">
                  <li className={getStepClass(verifyProgress, 0, 4)}>
                    <span className="analysis-step-dot" />
                    <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(verifyProgress, 0, 4)}]</span> 워터마크 검출 시도</p>
                  </li>
                  <li className={getStepClass(verifyProgress, 1, 4)}>
                    <span className="analysis-step-dot" />
                    <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(verifyProgress, 1, 4)}]</span> 토큰 연계 정보 확인 (검출 성공 시)</p>
                  </li>
                  <li className={getStepClass(verifyProgress, 2, 4)}>
                    <span className="analysis-step-dot" />
                    <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(verifyProgress, 2, 4)}]</span> 유사 이미지 탐색 (검출 실패 시)</p>
                  </li>
                  <li className={getStepClass(verifyProgress, 3, 4)}>
                    <span className="analysis-step-dot" />
                    <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(verifyProgress, 3, 4)}]</span> 최종 검증 결과 생성</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : verifyResult ? (
          <div className="verify-shell">
            <div className="analysis-result-view" data-result={verifyResult.outcome === "candidate" ? "reject" : "allow"}>
              <div className="analysis-result-body verify-result-body">
                <span className={`result-badge ${verifyResult.outcome === "candidate" ? "is-failed" : ""}`}>{verifyResult.headline_badge}</span>
                <h3 className="result-title">{verifyResult.headline_title}</h3>
                <p className="result-subtitle">{verifyResult.headline_subtitle}</p>

                {verifyResult.outcome === "verified" ? (
                  <div className="analysis-result-layout verify-result-layout verify-result-layout-success">
                    <div className="result-preview-card verify-preview-card">
                      <h4>검증 파일</h4>
                      <div className="verify-result-frame">
                        {renderFilePreview(uploadedPreview, selectedFile.name, selectedMimeType)}
                      </div>
                    </div>
                    <div className="result-summary-card verify-summary-card">
                      <h4>연결된 토큰 정보</h4>
                      <div className="verify-token-meta">
                        <div className="verify-token-row">
                          <span>검증자</span>
                          <strong>{verifyResult.uploaded.verifier_name}</strong>
                        </div>
                        <div className="verify-token-row">
                          <span>검증 시각</span>
                          <strong>{verifyResult.uploaded.verified_at}</strong>
                        </div>
                        <div className="verify-token-row">
                          <span>Token ID</span>
                          <strong>{verifyResult.blockchain?.token_id ? `#${verifyResult.blockchain.token_id}` : "-"}</strong>
                        </div>
                        <div className="verify-token-row">
                          <span>네트워크</span>
                          <strong>{verifyResult.blockchain?.network_name || "-"}</strong>
                        </div>
                        <div className="verify-token-row">
                          <span>Content Hash</span>
                          <strong>{verifyResult.blockchain?.content_hash || "-"}</strong>
                        </div>
                        <div className="verify-token-row">
                          <span>Transaction Hash</span>
                          <strong>{verifyResult.blockchain?.transaction_hash || "-"}</strong>
                        </div>
                        <div className="verify-token-row">
                          <span>체인 기록 시각</span>
                          <strong>{verifyResult.blockchain?.minted_at || "-"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="analysis-result-layout verify-result-layout">
                      <div className="result-preview-card verify-preview-card">
                        <h4>업로드 이미지</h4>
                      <div className="verify-result-frame">
                        {renderFilePreview(uploadedPreview, selectedFile.name, selectedMimeType)}
                      </div>
                      </div>
                      <div className="result-summary-card verify-summary-card">
                        <h4>확인 대상 정보</h4>
                        <div className="verify-result-frame">
                          {verifyResult.candidate?.preview_url ? (
                            <img src={verifyResult.candidate.preview_url} alt={verifyResult.candidate.file_name || "유사 이미지 후보"} />
                          ) : (
                            <div className="verify-placeholder-frame">후보 이미지 없음</div>
                          )}
                        </div>
                        <div className="verify-candidate-meta">
                          <div className="verify-token-row">
                            <span>파일명</span>
                            <strong>{verifyResult.candidate?.file_name || "-"}</strong>
                          </div>
                          <div className="verify-token-row">
                            <span>등록자</span>
                            <strong>{verifyResult.candidate?.owner_name || "-"}</strong>
                          </div>
                          <div className="verify-token-row">
                            <span>등록일</span>
                            <strong>{verifyResult.candidate?.registered_at || "-"}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="verify-metric-grid">
                      <div className="verify-metric-card">
                        <h4>워터마크 검출</h4>
                        <div className="verify-metric-value">{verifyResult.detect.status_label || "실패"}</div>
                      </div>
                      <div className="verify-metric-card">
                        <h4>검출 신뢰도</h4>
                        <div className="verify-metric-value">
                          {typeof verifyResult.detect.confidence === "number"
                            ? `${(verifyResult.detect.confidence * 100).toFixed(1)}%`
                            : typeof verifyResult.candidate?.cosine === "number"
                              ? `${verifyResult.candidate.cosine.toFixed(4)} (${(verifyResult.candidate.cosine * 100).toFixed(1)}%)`
                              : "-"}
                        </div>
                      </div>
                      <div className="verify-metric-card">
                        <h4>검출 페이지</h4>
                        <div className="verify-metric-value">
                          {verifyResult.detect.best_page ? `${verifyResult.detect.best_page}페이지` : "-"}
                        </div>
                      </div>
                      <div className="verify-metric-card">
                        <h4>최종 판단</h4>
                        <div className="verify-metric-value">{verifyResult.candidate?.summary || "-"}</div>
                      </div>
                    </div>
                  </>
                )}

                <div className="verify-reset-actions">
                  <button className="btn btn-primary" type="button" onClick={onResetVerify}>
                    다른 이미지 검증
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="verify-shell">
            <div className="verify-ready-grid">
              <div className="mint-complete-card">
                <div className="mint-complete-frame">
                  {uploadedPreview ? <img src={uploadedPreview} alt={selectedFile.name} /> : null}
                </div>
                <div className="verify-ready-meta">
                  <strong>{selectedFile.name}</strong>
                  <span>{formatFileSize(selectedFile.size)} · 준비 완료</span>
                  <div className="verify-ready-table">
                    <div><span>검증자</span><strong>{verifierName}</strong></div>
                    <div><span>검증 시각</span><strong>{verifyRequestedAtLabel}</strong></div>
                  </div>
                </div>
              </div>

              <div className="analysis-card">
                <h4>검증 시나리오</h4>
                <p className="verify-scenario-copy">워터마크 검출과 블록체인 연계 조회, 유사 이미지 탐색을 순차적으로 수행합니다.</p>
                <div className="verify-scenario-panel">
                  <h5>검증 안내</h5>
                  <ul className="analysis-list">
                    <li>워터마크 검출을 우선 시도합니다.</li>
                    <li>검출 성공 시 토큰 연계 정보를 조회합니다.</li>
                    <li>검출 실패 시 서비스 DB 유사 이미지를 탐색합니다.</li>
                  </ul>
                </div>
                <button className="btn btn-primary analysis-cta" type="button" onClick={onStartVerify}>
                  검증 시작
                </button>
                <button className="btn btn-secondary analysis-cta" type="button" onClick={onTriggerPicker}>
                  파일 변경
                </button>
              </div>
            </div>
          </div>
        )}
      </article>

      <aside className="register-history verify-history-panel">
        <h3>진행 중인 투표</h3>
        <div className="history-scroll">
          {recentItems.length === 0 ? (
            <div className="history-item">
              <div className="history-meta">
                <p>진행 중인 투표가 없습니다.</p>
                <span>새 투표가 시작되면 이 영역에 표시됩니다.</span>
              </div>
            </div>
          ) : (
            recentItems.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="history-item history-item-button verify-history-item"
                onClick={() => onOpenOngoingVote(item.id)}
              >
                <div
                  className={`history-thumb ${item.previewUrl ? "" : index % 3 === 0 ? "history-thumb-city" : index % 3 === 1 ? "history-thumb-review" : "history-thumb-green"}`}
                  style={item.previewUrl ? { backgroundImage: `url(${item.previewUrl})` } : undefined}
                />
                <div className="history-meta">
                  <p>{item.title}</p>
                  <span>{item.description}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
