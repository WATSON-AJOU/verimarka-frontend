import grapeImage from "../../assets/verimarka.png";
import type { AnalysisStage, RegisterResultConfig, RegisteredContentResponse, UploadHistoryItem } from "../../types/app";

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

interface RegisterPageProps {
  isLoggedIn: boolean;
  selectedFile: File | null;
  previewUrl: string;
  analysisStage: AnalysisStage;
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
  onDownloadWatermarked: () => void;
  onMoveToHistory: () => void;
  onCopyVerificationUrl: () => void;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
  formatFileSize: (bytes: number) => string;
  reviewVoteProgress: number;
  emailVerified: boolean;
  emailAddress: string;
  reviewConsentModalOpen: boolean;
  reviewConsentNotifyByEmail: boolean;
  reviewConsentEndAtLabel: string;
  reviewVoteDraft: {
    contentId: string;
    upvotes: number;
    downvotes: number;
    participantCount: number;
    votedChoice: "yes" | "no" | null;
  } | null;
  reviewVoteModalOpen: boolean;
  watermarkProgress: number;
  mintProgress: number;
  onCloseReviewConsentModal: () => void;
  onToggleReviewConsentNotify: () => void;
  onOpenReviewGuide: () => void;
  onConfirmReviewConsent: () => void;
  onOpenReviewVoteModal: () => void;
  onCloseReviewVoteModal: () => void;
  onCastReviewDemoVote: (choice: "yes" | "no") => void;
  onRefreshReviewVote: () => void;
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
  onDownloadWatermarked,
  onMoveToHistory,
  onCopyVerificationUrl,
  uploadInputRef,
  formatFileSize,
  reviewVoteProgress,
  emailVerified,
  emailAddress,
  reviewConsentModalOpen,
  reviewConsentNotifyByEmail,
  reviewConsentEndAtLabel,
  reviewVoteDraft,
  reviewVoteModalOpen,
  watermarkProgress,
  mintProgress,
  onCloseReviewConsentModal,
  onToggleReviewConsentNotify,
  onOpenReviewGuide,
  onConfirmReviewConsent,
  onOpenReviewVoteModal,
  onCloseReviewVoteModal,
  onCastReviewDemoVote,
  onRefreshReviewVote,
}: RegisterPageProps) {
  const candidatePreviewUrl = contentResult?.top_match?.preview_url || grapeImage;
  const watermarkedPreviewUrl = contentResult?.watermark_file_url || previewUrl || grapeImage;
  const mintedFileName = buildWatermarkedFileName(selectedFile?.name || contentResult?.original_filename || "apple.jpg");
  const mintedNetwork = contentResult?.blockchain?.network_name || "Sepolia";
  const mintedTokenId = contentResult?.blockchain?.token_id ? `#${contentResult.blockchain.token_id}` : "#82525";
  const mintedContentHash = contentResult?.blockchain?.file_hash || "0xbda0f453...5479";
  const mintedTxHash = contentResult?.blockchain?.tx_hash || "0x0a2536...60e7";
  const mintedWalletAddress =
    contentResult?.blockchain?.owner_address || contentResult?.blockchain?.recipient_address || "0x4f5b...7bf0";
  const mintedAtLabel = contentResult?.blockchain?.minted_at_display || "2026.03.24 10:14 UTC";
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
  const reviewVote = contentResult?.blockchain?.vote;
  const reviewThresholdLabel =
    typeof reviewVote?.threshold === "number" ? reviewVote.threshold.toFixed(4) : registerResult?.threshold ?? "0.7500";
  const reviewDeltaLabel =
    typeof reviewVote?.delta === "number"
      ? `${reviewVote.delta >= 0 ? "+" : ""}${reviewVote.delta.toFixed(4)}`
      : registerResult?.delta ?? "-0.0079";
  const reviewSimilarityPercent =
    typeof reviewVote?.similarity_percent === "number"
      ? `${reviewVote.similarity_percent.toFixed(1)}%`
      : registerResult?.similarity ?? "74.2%";
  const reviewYesVotes = reviewVoteDraft?.upvotes ?? reviewVote?.upvotes ?? 0;
  const reviewNoVotes = reviewVoteDraft?.downvotes ?? reviewVote?.downvotes ?? 0;
  const reviewParticipants = reviewVoteDraft?.participantCount ?? reviewVote?.participant_count ?? reviewYesVotes + reviewNoVotes;
  const reviewVoteTotal = Math.max(1, reviewYesVotes + reviewNoVotes);
  const reviewYesRate = Math.round((reviewYesVotes / reviewVoteTotal) * 100);
  const reviewNoRate = 100 - reviewYesRate;

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
                  <p className="analysis-running-subtitle">최종 판정 생성을 진행 중입니다.</p>

                  <div className="analysis-running-layout">
                    <div className="analysis-preview-card">
                      <img src={previewUrl} alt={selectedFile.name} />
                      <div className="analysis-progress-overlay">
                        <div className="analysis-progress-ring" style={{ ["--progress" as string]: String(Math.round(analysisProgress)) }}>
                          <span>{Math.round(analysisProgress)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="analysis-timeline-card">
                      <ul className="analysis-step-list">
                        <li className={getStepClass(analysisProgress, 0, 4)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(analysisProgress, 0, 4)}]</span> 의미 기반 임베딩 분석</p>
                        </li>
                        <li className={getStepClass(analysisProgress, 1, 4)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(analysisProgress, 1, 4)}]</span> 픽셀 정밀 비교</p>
                        </li>
                        <li className={getStepClass(analysisProgress, 2, 4)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(analysisProgress, 2, 4)}]</span> 기존 등록 콘텐츠 탐색</p>
                        </li>
                        <li className={getStepClass(analysisProgress, 3, 4)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(analysisProgress, 3, 4)}]</span> 최종 판정 생성</p>
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

              {analysisStage === "reviewStarting" ? (
                <div className="analysis-running-view review-starting-view">
                  <span className="result-badge review-badge-chip">REVIEW</span>
                  <h3 className="analysis-running-title">커뮤니티 검증을 준비하고 있습니다.</h3>
                  <p className="analysis-running-subtitle">커뮤니티 검증 시작을(를) 진행 중입니다.</p>

                  <div className="analysis-running-layout">
                    <div className="analysis-preview-card review-starting-preview">
                      <div className="review-starting-compare">
                        <div className="review-starting-frame">
                          <img src={previewUrl} alt={selectedFile.name} />
                        </div>
                        <div className="review-starting-frame">
                          <img src={candidatePreviewUrl} alt={candidateLabel} />
                        </div>
                      </div>
                      <div className="analysis-progress-overlay">
                        <div className="analysis-progress-ring" style={{ ["--progress" as string]: String(Math.round(reviewVoteProgress)) }}>
                          <span>{Math.round(reviewVoteProgress)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="analysis-timeline-card">
                      <ul className="analysis-step-list">
                        <li className={getStepClass(reviewVoteProgress, 0, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(reviewVoteProgress, 0, 3)}]</span> AI 유사도 분석 완료</p>
                        </li>
                        <li className={getStepClass(reviewVoteProgress, 1, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(reviewVoteProgress, 1, 3)}]</span> 블록체인 투표 생성</p>
                        </li>
                        <li className={getStepClass(reviewVoteProgress, 2, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(reviewVoteProgress, 2, 3)}]</span> 커뮤니티 검증 시작</p>
                        </li>
                      </ul>
                      <p className="analysis-running-note">완료되면 투표 현황 화면으로 자동 전환됩니다.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {analysisStage === "watermarking" ? (
                <div className="analysis-running-view">
                  <h3 className="analysis-running-title">워터마크를 삽입하고 있습니다.</h3>
                  <p className="analysis-running-subtitle">토큰 발행 준비를 진행 중입니다.</p>

                  <div className="analysis-running-layout">
                    <div className="analysis-preview-card">
                      <img src={previewUrl} alt={selectedFile.name} />
                      <div className="analysis-progress-overlay">
                        <div className="analysis-progress-ring" style={{ ["--progress" as string]: String(Math.round(watermarkProgress)) }}>
                          <span>{Math.round(watermarkProgress)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="analysis-timeline-card">
                      <ul className="analysis-step-list">
                        <li className={getStepClass(watermarkProgress, 0, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(watermarkProgress, 0, 3)}]</span> 워터마크 삽입 완료</p>
                        </li>
                        <li className={getStepClass(watermarkProgress, 1, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(watermarkProgress, 1, 3)}]</span> 해시 생성</p>
                        </li>
                        <li className={getStepClass(watermarkProgress, 2, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(watermarkProgress, 2, 3)}]</span> 토큰 발행 준비</p>
                        </li>
                      </ul>
                      <p className="analysis-running-note">처리가 완료되면 결과 화면으로 자동 전환됩니다.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {analysisStage === "minting" ? (
                <div className="analysis-running-view">
                  <h3 className="analysis-running-title">NFT 토큰 발행을 진행하고 있습니다.</h3>
                  <p className="analysis-running-subtitle">트랜잭션 확정 대기을(를) 진행 중입니다.</p>

                  <div className="analysis-running-layout">
                    <div className="analysis-preview-card">
                      <img src={watermarkedPreviewUrl} alt={`${selectedFile.name} 워터마크 결과`} />
                      <div className="analysis-progress-overlay">
                        <div className="analysis-progress-ring" style={{ ["--progress" as string]: String(Math.round(mintProgress)) }}>
                          <span>{Math.round(mintProgress)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="analysis-timeline-card">
                      <ul className="analysis-step-list">
                        <li className={getStepClass(mintProgress, 0, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(mintProgress, 0, 3)}]</span> 메타데이터 구성</p>
                        </li>
                        <li className={getStepClass(mintProgress, 1, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(mintProgress, 1, 3)}]</span> 스마트컨트랙트 호출</p>
                        </li>
                        <li className={getStepClass(mintProgress, 2, 3)}>
                          <span className="analysis-step-dot" />
                          <p className="analysis-step-title"><span className="analysis-step-state">[{getStepState(mintProgress, 2, 3)}]</span> 트랜잭션 확정 대기</p>
                        </li>
                      </ul>
                      <p className="analysis-running-note">네트워크 상태에 따라 소요 시간이 달라질 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {registerResult && analysisStage !== "watermarking" && analysisStage !== "minting" && analysisStage !== "reviewStarting" ? (
                <div className="analysis-result-view" data-result={registerResult.tone === "review" ? "pending" : registerResult.tone === "block" ? "reject" : "allow"}>
                  <div className="analysis-result-body">
                    <span className="result-badge">{registerResult.badge}</span>
                    <h3 className="result-title">{registerResult.title}</h3>
                    <p className="result-subtitle">{registerResult.subtitle}</p>

                    {registerResult.tone === "allow" && analysisStage !== "watermarked" ? (
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
                    ) : registerResult.tone === "allow" && analysisStage === "watermarked" ? (
                      <div className="watermark-complete-layout">
                        <div className="watermark-compare-grid">
                          <div className="watermark-compare-card">
                            <div className="watermark-compare-head">
                              <h4>원본 이미지</h4>
                              <span className="watermark-compare-chip">Original</span>
                            </div>
                            <div className="watermark-compare-frame">
                              <img src={previewUrl} alt={`${selectedFile.name} 원본`} />
                            </div>
                          </div>

                          <div className="watermark-compare-card">
                            <div className="watermark-compare-head">
                              <h4>워터마크 삽입 결과</h4>
                              <span className="watermark-compare-chip">Watermarked</span>
                            </div>
                            <div className="watermark-compare-frame">
                              <img src={watermarkedPreviewUrl} alt={`${selectedFile.name} 워터마크`} />
                            </div>
                          </div>
                        </div>

                        <div className="watermark-file-summary">
                          <strong>{selectedFile.name}</strong>
                          <span>{formatFileSize(selectedFile.size)} · 2026.03.23 01:21</span>
                        </div>

                        <div className="watermark-complete-actions">
                          <button className="btn btn-primary" type="button" onClick={onPrimaryAction}>
                            NFT 토큰 발행하기
                          </button>
                          <button className="btn btn-primary" type="button" onClick={onDownloadWatermarked}>
                            워터마크 이미지 다운로드
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={onMoveToHistory}>
                            분석 기록 보기
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={onSelectAnother}>
                            다른 이미지 업로드
                          </button>
                        </div>
                      </div>
                    ) : registerResult.tone === "allow" && analysisStage === "minted" ? (
                      <div className="mint-complete-layout">
                        <span className="result-badge">MINTED</span>
                        <h3 className="result-title">토큰 발행이 완료되었습니다</h3>
                        <p className="result-subtitle">콘텐츠가 블록체인에 안전하게 기록되었습니다.</p>

                        <div className="mint-complete-grid">
                          <div className="mint-complete-card">
                            <h4>저작물 정보</h4>
                            <div className="mint-complete-frame">
                              <img src={watermarkedPreviewUrl} alt={`${selectedFile.name} 민팅 결과`} />
                            </div>
                            <div className="mint-file-meta">
                              <div className="mint-file-row">
                                <span>파일명</span>
                                <strong>{mintedFileName}</strong>
                              </div>
                              <div className="mint-file-row">
                                <span>등록 일시</span>
                                <strong>{mintedAtLabel}</strong>
                              </div>
                              <div className="mint-file-row">
                                <span>워터마크 모델</span>
                                <strong>{contentResult?.blockchain?.model_name || "WAM (Watson AI Model)"}</strong>
                              </div>
                              <div className="mint-file-row">
                                <span>워터마크 버전</span>
                                <strong>{contentResult?.blockchain?.model_version || "v2.1.0"}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="mint-complete-card">
                            <h4>블록체인 기록 데이터</h4>
                            <div className="mint-chain-meta">
                              <div className="mint-file-row">
                                <span>네트워크명</span>
                                <strong>{mintedNetwork}</strong>
                              </div>
                              <div className="mint-file-row">
                                <span>Token ID</span>
                                <strong>{mintedTokenId}</strong>
                              </div>
                              <div className="mint-file-row">
                                <span>Content Hash</span>
                                <strong>{mintedContentHash}</strong>
                              </div>
                              <div className="mint-file-row">
                                <span>Transaction Hash</span>
                                <strong>{mintedTxHash}</strong>
                              </div>
                              <div className="mint-file-row">
                                <span>지갑 주소</span>
                                <strong>{mintedWalletAddress}</strong>
                              </div>
                              <div className="mint-file-row">
                                <span>발행 일시</span>
                                <strong>{mintedAtLabel}</strong>
                              </div>
                            </div>

                            <div className="mint-complete-actions">
                              <button className="btn btn-primary" type="button" onClick={onCopyVerificationUrl}>
                                URL 복사
                              </button>
                              <button className="btn btn-secondary" type="button" onClick={onMoveToHistory}>
                                기록으로 돌아가기
                              </button>
                              <button className="btn btn-secondary" type="button" onClick={onSelectAnother}>
                                다른 이미지 업로드
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : registerResult.tone === "review" && analysisStage === "reviewLive" ? (
                      <div className="review-live-layout">
                        <div className="review-live-compare-grid">
                          <div className="review-live-card">
                            <h4>업로드 이미지</h4>
                            <div className="review-live-image-frame">
                              <img src={previewUrl} alt={selectedFile.name} />
                            </div>
                            <strong>{selectedFile.name}</strong>
                          </div>

                          <div className="review-live-similarity-bubble">
                            <span>유사도</span>
                            <strong>{reviewSimilarityPercent}</strong>
                          </div>

                          <div className="review-live-card">
                            <h4>유사 콘텐츠</h4>
                            <div className="review-live-image-frame">
                              <img src={candidatePreviewUrl} alt={candidateLabel} />
                            </div>
                            <strong>{candidateLabel}</strong>
                          </div>
                        </div>

                        <div className="review-live-vote-bar">
                          <div className="review-live-vote-fill is-yes" style={{ width: `${reviewYesRate}%` }}>
                            찬성 {reviewYesRate}%
                          </div>
                          <div className="review-live-vote-fill is-no" style={{ width: `${reviewNoRate}%` }}>
                            반대 {reviewNoRate}%
                          </div>
                        </div>

                        <div className="review-live-stat-grid">
                          <div className="review-live-stat-card">
                            <span>투표 ID</span>
                            <strong>{reviewVote?.vote_id || "VOTE-82926"}</strong>
                          </div>
                          <div className="review-live-stat-card">
                            <span>마감 예정</span>
                            <strong>{reviewVote?.end_time_display || "2026.03.26 02:35"}</strong>
                          </div>
                          <div className="review-live-stat-card">
                            <span>참여 인원</span>
                            <strong>{reviewParticipants}명</strong>
                          </div>
                        </div>

                        <div className="review-live-actions">
                          <button className="btn btn-primary" type="button" onClick={onOpenReviewVoteModal}>
                            투표 참여하기
                          </button>
                          <button className="btn btn-primary" type="button" onClick={onRefreshReviewVote}>
                            투표 현황 보기
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={onResetToReady}>
                            업로드 화면으로 돌아가기
                          </button>
                        </div>
                      </div>
                    ) : registerResult.tone === "review" ? (
                      <div className="review-vote-layout">
                        <div className="review-vote-headline">
                          <h4>유사 후보가 감지되어 커뮤니티 투표 생성이 필요합니다.</h4>
                        </div>

                        <div className="review-vote-compare-grid">
                          <div className="review-vote-card">
                            <div className="review-vote-caption">업로드 원본 · {selectedFile.name}</div>
                            <div className="review-vote-frame">
                              <img src={previewUrl} alt={selectedFile.name} />
                            </div>
                          </div>

                          <div className="review-vote-card">
                            <div className="review-vote-caption">유사 후보 · {candidateLabel}</div>
                            <div className="review-vote-frame">
                              <img src={candidatePreviewUrl} alt={candidateLabel} />
                            </div>
                          </div>
                        </div>

                        <div className="review-vote-metrics">
                          <div className="review-vote-metric">
                            <span>Cosine Similarity</span>
                            <strong>{topCosineLabel}</strong>
                          </div>
                          <div className="review-vote-metric">
                            <span>pHash Distance</span>
                            <strong>{topPhashLabel}</strong>
                            <p>기준 ≤ 8</p>
                          </div>
                          <div className="review-vote-metric">
                            <span>임계값</span>
                            <strong>{reviewThresholdLabel}</strong>
                          </div>
                          <div className="review-vote-metric is-alert">
                            <span>임계값 차이</span>
                            <strong>{reviewDeltaLabel}</strong>
                          </div>
                        </div>

                        <div className="result-summary-actions">
                          <button className="btn btn-primary result-primary-btn review-primary-btn" type="button" onClick={onPrimaryAction}>
                            {registerResult.primaryAction}
                          </button>
                          <button className="btn btn-secondary result-secondary-btn" type="button" onClick={onResetToReady}>
                            등록 취소하기
                          </button>
                        </div>
                        <p className="result-note">{registerResult.note}</p>
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

      {reviewVoteModalOpen && registerResult?.tone === "review" && analysisStage === "reviewLive" ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-shell review-vote-modal" role="dialog" aria-modal="true" aria-labelledby="review-vote-modal-title">
            <button className="modal-close" type="button" onClick={onCloseReviewVoteModal}>
              닫기
            </button>

            <div className="review-vote-modal-tag">REVIEW</div>
            <h3 id="review-vote-modal-title" className="review-vote-modal-title">
              커뮤니티 검증 투표
            </h3>
            <p className="review-vote-modal-subtitle">진행 중인 커뮤니티 검증 투표에 바로 참여할 수 있습니다.</p>

            <div className="review-live-compare-grid review-vote-modal-compare-grid">
              <div className="review-live-card review-vote-modal-card">
                <h4>업로드 이미지</h4>
                <div className="review-live-image-frame">
                  <img src={previewUrl} alt={selectedFile?.name || "업로드 이미지"} />
                </div>
                <strong>{selectedFile?.name || "업로드 이미지"}</strong>
              </div>

              <div className="review-live-similarity-bubble review-vote-modal-bubble">
                <span>유사도</span>
                <strong>{reviewSimilarityPercent}</strong>
              </div>

              <div className="review-live-card review-vote-modal-card">
                <h4>유사 후보</h4>
                <div className="review-live-image-frame">
                  <img src={candidatePreviewUrl} alt={candidateLabel} />
                </div>
                <strong>{candidateLabel}</strong>
              </div>
            </div>

            <div className="review-live-stat-grid review-vote-modal-stat-grid">
              <div className="review-live-stat-card">
                <span>투표 ID</span>
                <strong>{reviewVote?.vote_id || "VOTE-82926"}</strong>
              </div>
              <div className="review-live-stat-card">
                <span>마감 예정</span>
                <strong>{reviewVote?.end_time_display || "2026.03.26 02:35"}</strong>
              </div>
              <div className="review-live-stat-card">
                <span>참여 인원</span>
                <strong>{reviewParticipants}명</strong>
              </div>
            </div>

            <div className="review-live-vote-bar review-vote-modal-bar">
              <div className="review-live-vote-fill is-yes" style={{ width: `${reviewYesRate}%` }}>
                찬성 {reviewYesRate}%
              </div>
              <div className="review-live-vote-fill is-no" style={{ width: `${reviewNoRate}%` }}>
                반대 {reviewNoRate}%
              </div>
            </div>

            <div className="review-vote-modal-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => onCastReviewDemoVote("yes")}
                disabled={Boolean(reviewVoteDraft?.votedChoice)}
              >
                찬성
              </button>
              <button
                className="btn btn-secondary review-vote-modal-negative"
                type="button"
                onClick={() => onCastReviewDemoVote("no")}
                disabled={Boolean(reviewVoteDraft?.votedChoice)}
              >
                반대
              </button>
            </div>

            <p className="review-vote-modal-note">
              투표 결과는 데모 상태이며 실제 서비스에서는 블록체인에 기록됩니다.
            </p>
          </div>
        </div>
      ) : null}

      {reviewConsentModalOpen && registerResult?.tone === "review" && analysisStage === "review" ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-shell review-consent-modal" role="dialog" aria-modal="true" aria-labelledby="review-consent-modal-title">
            <button className="modal-close" type="button" onClick={onCloseReviewConsentModal}>
              닫기
            </button>

            <div className="review-vote-modal-tag">REVIEW</div>
            <h3 id="review-consent-modal-title" className="review-vote-modal-title">
              투표 생성 확인
            </h3>
            <p className="review-consent-message">투표는 72시간 동안 진행됩니다.</p>

            <div className="review-consent-fields">
              <label className={`review-consent-checkbox ${!emailVerified ? "is-disabled" : ""}`}>
                <input
                  type="checkbox"
                  checked={reviewConsentNotifyByEmail}
                  onChange={onToggleReviewConsentNotify}
                  disabled={!emailVerified}
                />
                <span>72시간 후 투표가 종료되면 메일을 받으시겠습니까</span>
              </label>

              {!emailVerified ? (
                <p className="review-consent-help">이메일 인증을 진행하지 않으면 선택할 수 없습니다.</p>
              ) : null}

              <div className="review-consent-info">
                <div className="review-consent-row">
                  <span>이메일</span>
                  <strong>{emailAddress}</strong>
                </div>
                <div className="review-consent-row">
                  <span>종료시간</span>
                  <strong>{reviewConsentEndAtLabel}</strong>
                </div>
              </div>

              <button className="btn ghost review-consent-guide" type="button" onClick={onOpenReviewGuide}>
                절차 자세히 보기
              </button>
            </div>

            <div className="review-consent-actions">
              <button className="btn btn-primary" type="button" onClick={onConfirmReviewConsent}>
                투표 생성하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
