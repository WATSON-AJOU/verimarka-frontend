import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import EmailLoginModal from "./components/auth/EmailLoginModal";
import LoginChoiceModal from "./components/auth/LoginChoiceModal";
import LoginSuccessToast from "./components/auth/LoginSuccessToast";
import SignupModal from "./components/auth/SignupModal";
import grapeImage from "./assets/verimarka.png";
import { useAuth } from "./hooks/useAuth";
import { apiRequest } from "./lib/api";

type TabName = "home" | "add" | "verify" | "history" | "mypage";
type ModalType = "none" | "loginChoice" | "emailLogin" | "signup";
type AnalysisResult = "allow" | "review" | "block";
type AnalysisStage = "idle" | "ready" | "running" | AnalysisResult;

interface ActivityItem {
  status: "ALLOW" | "REVIEW" | "BLOCK";
  title: string;
  description: string;
  progress?: number;
  tone: string;
}

interface UploadHistoryItem {
  id: string;
  title: string;
  date: string;
  owner: string;
  tone: string;
}

interface HistoryItem {
  id: string;
  type: "allow" | "review";
  fileName: string;
  summary: string;
  timestamp: string;
  cosine: string;
  phash: string;
  extra: string;
}

const tabs: Array<{ key: TabName; label: string; requiresAuth?: boolean; requiresVerified?: boolean }> = [
  { key: "home", label: "홈" },
  { key: "add", label: "저작물 등록", requiresAuth: true, requiresVerified: true },
  { key: "verify", label: "저작물 검증", requiresAuth: true, requiresVerified: true },
  { key: "history", label: "분석 기록", requiresAuth: true, requiresVerified: true },
];

const systemCards = [
  {
    icon: "AI",
    title: "의미 기반 유사도 분석",
    description: "문맥 특징을 임베딩으로 변환해 실질적 유사도를 판별합니다.",
  },
  {
    icon: "PX",
    title: "픽셀 정밀 비교",
    description: "미세 편집과 왜곡을 감지해 조작 징후를 정량적으로 확인합니다.",
  },
  {
    icon: "BC",
    title: "블록체인 신뢰 기록",
    description: "등록·검증 결과를 변경 불가능한 형태로 저장해 추적성을 확보합니다.",
  },
];

const homeActivities: ActivityItem[] = [
  {
    status: "ALLOW",
    title: "일러스트_final.jpg",
    description: "신규 등록 승인 완료 · 저작물 등록됨",
    tone: "allow",
  },
  {
    status: "REVIEW",
    title: "캐릭터_A.png",
    description: "투표 진행 중 · D-2",
    progress: 78,
    tone: "review",
  },
  {
    status: "BLOCK",
    title: "배경이미지_B.png",
    description: "유사도 98%로 등록 차단됨",
    tone: "block",
  },
];

const recentUploads: UploadHistoryItem[] = [
  { id: "1", title: "일러스트_A.jpg", date: "2026.03.07", owner: "ArtistUser1", tone: "sunrise" },
  { id: "2", title: "도시풍경_B.png", date: "2026.03.06", owner: "TravelFan_3", tone: "blue" },
  { id: "3", title: "UX_가이드.png", date: "2026.03.05", owner: "UX.Design", tone: "review" },
  { id: "4", title: "브랜딩_시안C.png", date: "2026.03.05", owner: "StudioMint", tone: "green" },
];

const historyItems: HistoryItem[] = [
  {
    id: "82401",
    type: "allow",
    fileName: "풍경_최종.png",
    summary: "워터마크 삽입 완료 (토큰 #82401)",
    timestamp: "2026.02.26 14:30",
    cosine: "0.1243 (12.4%)",
    phash: "Distance 5 / Threshold 8",
    extra: "Polygon · Token #82401",
  },
  {
    id: "82396",
    type: "review",
    fileName: "캐릭터_시안A.jpg",
    summary: "투표 진행 중 · D-1",
    timestamp: "2026.02.25 09:15",
    cosine: "0.7421 (74.2%)",
    phash: "Distance 8 / Threshold 8",
    extra: "찬성 14 · 반대 6",
  },
  {
    id: "82374",
    type: "allow",
    fileName: "도시풍경_B.png",
    summary: "저작물 등록 승인 완료 (토큰 #82374)",
    timestamp: "2026.02.24 11:20",
    cosine: "0.1832 (18.3%)",
    phash: "Distance 12 / Threshold 8",
    extra: "Polygon · Token #82374",
  },
];

const resultConfig: Record<AnalysisResult, {
  badge: string;
  title: string;
  subtitle: string;
  similarity: string;
  note: string;
  tone: string;
  threshold: string;
  phashDistance: string;
  delta: string;
  primaryAction: string;
  metricLabel: string;
}> = {
  allow: {
    badge: "ALLOW",
    title: "등록 가능한 콘텐츠입니다.",
    subtitle: "유사한 콘텐츠가 발견되지 않았습니다.",
    similarity: "12.4%",
    note: "다음 단계에서 워터마크 삽입 및 토큰 발행 준비를 진행할 수 있습니다.",
    tone: "allow",
    threshold: "0.7500",
    phashDistance: "8",
    delta: "-0.6257",
    primaryAction: "워터마크 삽입 진행하기",
    metricLabel: "Cosine Similarity",
  },
  review: {
    badge: "REVIEW",
    title: "보류 판정입니다.",
    subtitle: "유사 후보가 감지되어 추가 검토가 필요합니다.",
    similarity: "74.2%",
    note: "검토 큐로 전달되며 블록체인 투표 결과에 따라 최종 상태가 확정됩니다.",
    tone: "review",
    threshold: "0.7500",
    phashDistance: "8",
    delta: "-0.0079",
    primaryAction: "수동 검토 요청하기",
    metricLabel: "Cosine Similarity",
  },
  block: {
    badge: "BLOCK",
    title: "등록이 제한된 콘텐츠입니다.",
    subtitle: "유사도가 임계치를 초과했습니다.",
    similarity: "96.3%",
    note: "중복 가능성이 높아 현재 파일은 등록이 차단되었습니다.",
    tone: "block",
    threshold: "0.8500",
    phashDistance: "4",
    delta: "+0.1128",
    primaryAction: "다른 이미지 업로드",
    metricLabel: "Cosine Similarity",
  },
};

function getResultFromFileName(fileName: string): AnalysisResult {
  const seed = Array.from(fileName).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const remainder = seed % 3;
  if (remainder === 0) return "allow";
  if (remainder === 1) return "review";
  return "block";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

function getInitial(value: string) {
  const safeValue = value.trim();
  return safeValue ? safeValue.slice(0, 1).toUpperCase() : "V";
}

function IdentityModal({
  open,
  phone,
  code,
  timer,
  sending,
  verifying,
  onPhoneChange,
  onCodeChange,
  onClose,
  onSendCode,
  onVerify,
}: {
  open: boolean;
  phone: string;
  code: string;
  timer: number;
  sending: boolean;
  verifying: boolean;
  onPhoneChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onSendCode: () => void;
  onVerify: () => void;
}) {
  if (!open) return null;

  const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
  const seconds = String(timer % 60).padStart(2, "0");

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard authCard identityCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>
          닫기
        </button>
        <h2 className="authTitle authTitle--tight">휴대폰 본인 인증</h2>
        <p className="identityDescription">
          인증 완료 전에는 저작물 등록, 검증, 분석 기록 기능을 사용할 수 없습니다.
        </p>

        <label className="fieldLabel">
          휴대폰 번호
          <input
            className="fieldInput"
            type="tel"
            placeholder="01012345678"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
          />
        </label>

        <div className="identityRow">
          <label className="fieldLabel identityCodeField">
            인증번호
            <input
              className="fieldInput"
              type="text"
              inputMode="numeric"
              placeholder="6자리 입력"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
            />
          </label>
          <button className="secondaryButton" type="button" onClick={onSendCode} disabled={sending}>
            {sending ? "발송 중..." : "인증번호 전송"}
          </button>
        </div>

        <div className="identityTimer">남은 시간 {minutes}:{seconds}</div>

        <button className="primaryButton" type="button" onClick={onVerify} disabled={verifying}>
          {verifying ? "확인 중..." : "본인 인증 완료"}
        </button>
      </div>
    </div>
  );
}

function App() {
  const { user, loading, isLoggedIn, login, signup, logout, refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [modal, setModal] = useState<ModalType>("none");
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "로그인 완료했습니다.",
  });
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [identityTimer, setIdentityTimer] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("idle");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<"all" | "allow" | "review">("all");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const phoneVerified = Boolean(user?.phone_verified);
  const displayName = useMemo(() => {
    if (!user) return "";
    return user.nickname || user.display_name || user.username || user.email.split("@")[0] || "회원";
  }, [user]);

  const profileEmail = user?.email || "user@verimarka.com";
  const profilePhone = user?.phone ? formatPhoneNumber(user.phone) : "미인증";
  const avatarInitial = getInitial(displayName);

  useEffect(() => {
    if (!identityTimer) return;
    const timerId = window.setTimeout(() => {
      setIdentityTimer((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [identityTimer]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      setAnalysisStage("idle");
      setAnalysisProgress(0);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setAnalysisStage("ready");
    setAnalysisProgress(0);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (analysisStage !== "running" || !selectedFile) return;

    const finalResult = getResultFromFileName(selectedFile.name);
    const intervalId = window.setInterval(() => {
      setAnalysisProgress((current) => {
        const next = Math.min(100, current + 4 + Math.random() * 8);
        if (next >= 100) {
          window.clearInterval(intervalId);
          setAnalysisStage(finalResult);
          setToast({
            open: true,
            message:
              finalResult === "allow"
                ? "분석이 완료되었습니다."
                : finalResult === "review"
                  ? "보류 판정이 생성되었습니다."
                  : "등록 제한 결과가 생성되었습니다.",
          });
          return 100;
        }
        return next;
      });
    }, 180);

    return () => window.clearInterval(intervalId);
  }, [analysisStage, selectedFile]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return historyItems;
    return historyItems.filter((item) => item.type === historyFilter);
  }, [historyFilter]);

  function openToast(message: string) {
    setToast({ open: true, message });
  }

  function closeToast() {
    setToast((current) => ({ ...current, open: false }));
  }

  async function handleLogin(email: string, password: string) {
    await login(email, password);
    setModal("none");
    openToast("로그인 완료했습니다.");
  }

  async function handleSignup(email: string, username: string, password: string) {
    await signup(email, username, password);
    setModal("none");
    openToast("회원가입과 로그인이 완료되었습니다.");
  }

  function handleLogout() {
    logout();
    setActiveTab("home");
    setSelectedFile(null);
    setIdentityModalOpen(false);
    openToast("로그아웃 되었습니다.");
  }

  function moveToTab(nextTab: TabName) {
    const tabConfig = tabs.find((tab) => tab.key === nextTab);
    if (tabConfig?.requiresAuth && !isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 이용 가능합니다.");
      return;
    }

    if (tabConfig?.requiresVerified && !phoneVerified) {
      setActiveTab("mypage");
      setIdentityModalOpen(true);
      openToast("휴대폰 인증 후 이용 가능합니다.");
      return;
    }

    if (nextTab === "mypage" && !isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 마이페이지를 이용할 수 있습니다.");
      return;
    }

    setActiveTab(nextTab);
  }

  function handlePickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;

    if (!/^image\/(jpeg|png)$/.test(nextFile.type)) {
      window.alert("JPG 또는 PNG 파일만 업로드할 수 있습니다.");
      return;
    }

    if (nextFile.size > 20 * 1024 * 1024) {
      window.alert("파일 크기는 20MB 이하만 가능합니다.");
      return;
    }

    setSelectedFile(nextFile);
    openToast("이미지 업로드가 완료되었습니다.");
  }

  function triggerFilePicker() {
    if (!isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 업로드할 수 있습니다.");
      return;
    }
    if (!phoneVerified) {
      setActiveTab("mypage");
      setIdentityModalOpen(true);
      openToast("휴대폰 인증 후 업로드할 수 있습니다.");
      return;
    }
    uploadInputRef.current?.click();
  }

  function startAnalysis() {
    if (!selectedFile) {
      window.alert("먼저 업로드할 이미지를 선택해주세요.");
      return;
    }

    if (!phoneVerified) {
      setActiveTab("mypage");
      setIdentityModalOpen(true);
      openToast("휴대폰 인증 후 분석을 시작할 수 있습니다.");
      return;
    }

    setAnalysisProgress(0);
    setAnalysisStage("running");
  }

  async function sendVerificationCode() {
    const normalizedPhone = phoneInput.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(normalizedPhone)) {
      window.alert("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }

    setSendingCode(true);
    try {
      await apiRequest("/accounts/phone/send-code/", {
        method: "POST",
        auth: true,
        body: { phone: normalizedPhone },
      });
      setPhoneInput(formatPhoneNumber(normalizedPhone));
      setIdentityTimer(180);
      openToast("인증번호를 발송했습니다.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setSendingCode(false);
    }
  }

  async function verifyPhone() {
    const normalizedPhone = phoneInput.replace(/\D/g, "");
    if (!/^\d{6}$/.test(codeInput)) {
      window.alert("인증번호 6자리를 입력해주세요.");
      return;
    }

    setVerifyingCode(true);
    try {
      await apiRequest("/accounts/phone/verify-code/", {
        method: "POST",
        auth: true,
        body: {
          phone: normalizedPhone,
          code: codeInput,
        },
      });
      await refreshMe();
      setIdentityModalOpen(false);
      setCodeInput("");
      setIdentityTimer(0);
      openToast("본인 인증이 완료되었습니다.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "본인 인증에 실패했습니다.");
    } finally {
      setVerifyingCode(false);
    }
  }

  const registerResult =
    analysisStage === "allow" || analysisStage === "review" || analysisStage === "block"
      ? resultConfig[analysisStage]
      : null;

  const candidatePreviewUrl = previewUrl || grapeImage;

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="headerInner">
          <button className="brandMark" type="button" onClick={() => moveToTab("home")}>
            VeriMarka
          </button>

          <nav className="mainNav" aria-label="주요 메뉴">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`navTab ${activeTab === tab.key ? "is-active" : ""}`}
                onClick={() => moveToTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="headerActions">
            {!loading && !isLoggedIn ? (
              <>
                <button className="headerLink" type="button" onClick={() => setModal("loginChoice")}>
                  로그인
                </button>
                <button className="headerLink is-accent" type="button" onClick={() => setModal("signup")}>
                  회원가입
                </button>
              </>
            ) : null}

            {!loading && isLoggedIn && user ? (
              <>
                <button className="sessionButton" type="button" onClick={() => moveToTab("mypage")}>
                  <span className="sessionName">{displayName}님</span>
                  <span className="sessionAvatar">{avatarInitial}</span>
                </button>
                <button className="headerLink" type="button" onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : null}

            <button className="languageButton" type="button">
              Languages
            </button>
          </div>
        </div>
      </header>

      <main className="appMain">
        {activeTab === "home" ? (
          <div className="pageColumn">
            <section className="heroPanel">
              <div className="heroCopy">
                <p className="heroEyebrow">비가시 워터마크, AI 유사도 분석, 블록체인 기록</p>
                <h1>디지털 자산 신뢰의 기준을 만듭니다.</h1>
                <p className="heroDescription">
                  창작물 등록부터 검증까지 하나의 흐름으로 제공하는 신뢰 인프라입니다.
                </p>
                <div className="heroActions">
                  <button className="primaryButton heroButton" type="button" onClick={() => moveToTab("add")}>
                    저작물 등록하기
                  </button>
                  <button className="secondaryButton heroButton" type="button" onClick={() => moveToTab("verify")}>
                    저작물 검증하기
                  </button>
                </div>
              </div>

              <div className="heroArtwork">
                <div className="heroArtworkHalo" />
                <img src={grapeImage} alt="VeriMarka" className="heroImage" />
              </div>
            </section>

            <section className="sectionBlock">
              <div className="sectionHeading">
                <h2>VeriMarka 신뢰 시스템</h2>
                <p>기록 가능한 근거를 남기는 3중 검증 구조</p>
              </div>

              <div className="cardGrid threeColumns">
                {systemCards.map((card) => (
                  <article key={card.title} className="infoCard">
                    <span className="systemChip">{card.icon}</span>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="sectionBlock">
              <div className="sectionHeading">
                <h2>최근 활동</h2>
                <p>등록과 검토 상태를 빠르게 확인하세요.</p>
              </div>

              <div className="cardGrid threeColumns">
                {homeActivities.map((activity) => (
                  <article key={activity.title} className="activityCard">
                    <span className={`statusBadge ${activity.tone}`}>{activity.status}</span>
                    <div className={`activityPreview ${activity.tone}`} />
                    <strong>{activity.title}</strong>
                    <p>{activity.description}</p>
                    {typeof activity.progress === "number" ? (
                      <div className="progressTrack">
                        <div className="progressFill" style={{ width: `${activity.progress}%` }} />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "add" ? (
          <div className="workspaceLayout">
            <section className="workspacePanel">
              <div className="panelHeading">
                <h2>원본 이미지를 등록하세요.</h2>
                <p>이미지를 업로드하면 등록 절차가 시작됩니다.</p>
              </div>

              <input
                ref={uploadInputRef}
                className="hiddenInput"
                type="file"
                accept="image/png,image/jpeg"
                onChange={handlePickFile}
              />

              {!selectedFile ? (
                <button className="uploadZone" type="button" onClick={triggerFilePicker}>
                  <span className="uploadIcon">↑</span>
                  <strong>이미지를 드래그하거나 클릭하여 업로드하세요.</strong>
                  <span>지원 포맷: JPG, PNG / 최대 20MB</span>
                </button>
              ) : (
                <div className="uploadReadyCard">
                  {analysisStage === "ready" ? (
                    <>
                      <div className="uploadStateBadge">Success</div>
                      <div className="uploadReadyHeader compact">
                        <div>
                          <h3>이미지가 정상적으로 업로드되었습니다.</h3>
                          <p>등록 가능 여부를 확인하세요.</p>
                        </div>
                      </div>

                      <div className="uploadReadyLayout compactLayout">
                        <div className="readyPreviewPanel">
                          <div className="readyPreviewGrid">
                            <div className="previewFrame compact">
                              <img src={previewUrl} alt={selectedFile.name} className="previewImage contain" />
                            </div>
                            <div className="previewFrame compact">
                              <img src={candidatePreviewUrl} alt="유사 후보 미리보기" className="previewImage contain" />
                            </div>
                          </div>
                          <div className="readyMetaRow">
                            <div>
                              <strong>{selectedFile.name}</strong>
                              <span>{formatFileSize(selectedFile.size)} · 2026.03.15 23:29</span>
                            </div>
                            <button className="secondaryButton smallButton" type="button" onClick={triggerFilePicker}>
                              다른 이미지 선택
                            </button>
                          </div>
                        </div>

                        <div className="analysisCard compactCard">
                          <h3>AI 유사도 분석을 시작하시겠습니까?</h3>
                          <ul>
                            <li>의미 기반 임베딩 비교</li>
                            <li>픽셀 수준 정밀 비교</li>
                            <li>기존 등록된 유사 콘텐츠 탐색</li>
                          </ul>

                          <div className="analysisActions stackActions">
                            <button className="primaryButton" type="button" onClick={startAnalysis}>
                              등록 가능 여부 확인하기
                            </button>
                            <button
                              className="textButton"
                              type="button"
                              onClick={() => {
                                setSelectedFile(null);
                                setActiveTab("home");
                              }}
                            >
                              홈으로 이동
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {analysisStage === "running" ? (
                    <div className="resultScreen running">
                      <div className="resultHero">
                        <span className="statusBadge running">ANALYZING</span>
                        <h3>등록 가능 여부를 분석하고 있습니다.</h3>
                        <p>픽셀 정밀 비교를 진행 중입니다.</p>
                      </div>

                      <div className="resultGrid">
                        <div className="comparisonPanel dimmed">
                          <div className="comparisonImages twoUp">
                            <div className="comparisonCell">
                              <img src={previewUrl} alt={selectedFile.name} className="previewImage contain" />
                            </div>
                            <div className="comparisonCell">
                              <img src={candidatePreviewUrl} alt="후보 이미지" className="previewImage contain" />
                            </div>
                            <div
                              className="progressDonut"
                              style={{ ["--progress" as string]: String(Math.round(analysisProgress)) }}
                            >
                              <div className="progressDonutInner">{Math.round(analysisProgress)}%</div>
                            </div>
                          </div>
                        </div>

                        <div className="analysisStatusPanel">
                          <ul className="analysisStageList">
                            <li className="done">[완료] 의미 기반 임베딩 분석</li>
                            <li className="active">[진행 중] 픽셀 정밀 비교</li>
                            <li>[대기] 기존 등록 콘텐츠 탐색</li>
                            <li>[대기] 최종 판정 생성</li>
                          </ul>
                          <p>분석에는 수 초가 소요될 수 있습니다.</p>
                        </div>
                      </div>

                      <div className="resultFooterActions center">
                        <button className="secondaryButton smallButton" type="button" onClick={triggerFilePicker}>
                          다른 이미지 선택
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {registerResult ? (
                    <div className={`resultScreen ${registerResult.tone}`}>
                      <div className="resultHero">
                        <span className={`statusBadge large ${registerResult.tone}`}>{registerResult.badge}</span>
                        <h3>{registerResult.title}</h3>
                        <p>{registerResult.subtitle}</p>
                      </div>

                      {registerResult.tone === "allow" ? (
                        <div className="resultGrid">
                          <div className="allowPreviewCard">
                            <div className="comparisonCell tall">
                              <img src={previewUrl} alt={selectedFile.name} className="previewImage contain" />
                            </div>
                            <div className="allowPreviewMeta">
                              <div>
                                <strong>{selectedFile.name}</strong>
                                <span>{formatFileSize(selectedFile.size)} · 2026.03.15 23:29</span>
                              </div>
                              <div className="metricCard floating">
                                <label>{registerResult.metricLabel}</label>
                                <strong>0.1243</strong>
                                <span>{registerResult.similarity}</span>
                              </div>
                            </div>
                          </div>

                          <div className="allowAnalysisCard">
                            <h4>AI 분석 결과</h4>
                            <ul className="allowChecklist">
                              <li>의미 기반 임베딩 비교 완료</li>
                              <li>픽셀 정밀 비교 완료</li>
                              <li>DB 후보 탐색 결과 없음</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="comparisonTitleRow">
                            <strong>업로드 원본 · {selectedFile.name}</strong>
                            <strong>유사 후보 · concept_scene.jpg</strong>
                          </div>

                          <div className="comparisonImages twoColumn">
                            <div className="comparisonCell">
                              <img src={previewUrl} alt={selectedFile.name} className="previewImage contain" />
                            </div>
                            <div className="comparisonCell">
                              <img src={candidatePreviewUrl} alt="concept_scene.jpg" className="previewImage contain" />
                            </div>
                          </div>

                          <div className="metricsGrid">
                            <div className="metricCard">
                              <label>Cosine Similarity</label>
                              <strong>{registerResult.tone === "review" ? "0.7421" : "0.9628"}</strong>
                            </div>
                            <div className="metricCard">
                              <label>pHash Distance</label>
                              <strong>{registerResult.phashDistance}</strong>
                              <span>기준 ≤ 8</span>
                            </div>
                            <div className="metricCard">
                              <label>임계값</label>
                              <strong>{registerResult.threshold}</strong>
                            </div>
                            <div className={`metricCard emphasis ${registerResult.tone}`}>
                              <label>{registerResult.tone === "review" ? "임계값 차이" : "초과값"}</label>
                              <strong>{registerResult.delta}</strong>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="resultFooterActions">
                        <button
                          className={`primaryButton tone-${registerResult.tone}`}
                          type="button"
                          onClick={() => {
                            if (registerResult.tone === "block") {
                              triggerFilePicker();
                              return;
                            }
                            openToast(registerResult.primaryAction);
                          }}
                        >
                          {registerResult.primaryAction}
                        </button>
                        <button
                          className="secondaryButton"
                          type="button"
                          onClick={() => {
                            setAnalysisStage("ready");
                            setAnalysisProgress(0);
                          }}
                        >
                          업로드 화면으로 돌아가기
                        </button>
                      </div>
                      <p className="resultNote">{registerResult.note}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <aside className="sidePanel">
              <div className="sideHeading">
                <h3>최근 등록된 사진</h3>
              </div>

              <div className="recentList">
                {recentUploads.map((item) => (
                  <article key={item.id} className="recentCard">
                    <div className={`recentThumb ${item.tone}`} />
                    <strong>{item.title}</strong>
                    <p>등록일자: {item.date} · 등록자: {item.owner}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        ) : null}

        {activeTab === "verify" ? (
          <section className="placeholderPanel">
            <div className="panelHeading">
              <h2>저작물 검증</h2>
              <p>서버 연동 단계에서는 업로드된 워터마크 검출과 NFT 정보 조회 화면이 여기에 연결됩니다.</p>
            </div>
            <div className="verificationMock">
              <div className="verificationHero">
                <span className="systemChip">WM</span>
                <h3>워터마크 검출 기반 진위 확인</h3>
                <p>이미지 업로드 후 워터마크 검출 결과와 블록체인 기록을 함께 보여주는 영역입니다.</p>
              </div>
              <div className="verificationGrid">
                <article className="infoCard">
                  <h3>1차 검출</h3>
                  <p>워터마크 식별 결과와 신뢰 점수를 표시합니다.</p>
                </article>
                <article className="infoCard">
                  <h3>2차 재분석</h3>
                  <p>미검출 시 AI 유사도 분석으로 재검증하는 흐름을 연결합니다.</p>
                </article>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "history" ? (
          <section className="pageColumn">
            <div className="sectionHeading historyHeading">
              <div>
                <h2>분석 기록</h2>
                <p>ALLOW, REVIEW 상태와 판정 근거를 한 번에 확인하세요.</p>
              </div>
              <div className="filterGroup">
                {(["all", "allow", "review"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`filterButton ${historyFilter === filter ? "is-active" : ""}`}
                    onClick={() => setHistoryFilter(filter)}
                  >
                    {filter === "all" ? "전체" : filter === "allow" ? "ALLOW" : "REVIEW"}
                  </button>
                ))}
              </div>
            </div>

            <div className="historyList">
              {filteredHistory.map((item) => (
                <article key={item.id} className="historyCard">
                  <div className="historyCardTop">
                    <div>
                      <strong>{item.fileName}</strong>
                      <p>{item.summary}</p>
                    </div>
                    <span className={`statusBadge ${item.type}`}>{item.type.toUpperCase()}</span>
                  </div>
                  <dl className="historyMeta">
                    <div>
                      <dt>등록 시각</dt>
                      <dd>{item.timestamp}</dd>
                    </div>
                    <div>
                      <dt>의미 유사도</dt>
                      <dd>{item.cosine}</dd>
                    </div>
                    <div>
                      <dt>pHash</dt>
                      <dd>{item.phash}</dd>
                    </div>
                    <div>
                      <dt>상세</dt>
                      <dd>{item.extra}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "mypage" ? (
          <div className="workspaceLayout mypageLayout">
            <aside className="profileSidebar">
              <div className="profileAvatarLarge">{avatarInitial}</div>
              <h2>{displayName || "VeriMarka 사용자"}</h2>
              <p>{profileEmail}</p>
              <p>{profilePhone}</p>
              <button className="secondaryButton fullWidth" type="button">
                프로필 수정
              </button>
              <div className="profileLinks">
                <button type="button" onClick={handleLogout}>로그아웃</button>
                <button type="button">이용약관</button>
                <button type="button">개인정보처리방침</button>
                <button type="button">고객센터</button>
              </div>
            </aside>

            <section className="mypageContent">
              <article className="mypageCard">
                <div className="mypageHeader">
                  <h3>본인 인증</h3>
                  <span className={`pill ${phoneVerified ? "verified" : "pending"}`}>
                    {phoneVerified ? "인증 완료" : "인증 필요"}
                  </span>
                </div>
                <p>
                  {phoneVerified
                    ? "휴대폰 본인 인증이 완료되었습니다."
                    : "서비스 이용을 위해 휴대폰 인증을 진행해주세요."}
                </p>
                <button
                  className="primaryButton fitButton"
                  type="button"
                  onClick={() => setIdentityModalOpen(true)}
                  disabled={phoneVerified}
                >
                  {phoneVerified ? "인증 완료" : "인증하기"}
                </button>
              </article>

              <article className="mypageCard">
                <div className="mypageHeader">
                  <h3>보유 토큰</h3>
                  <span className="pill pending">대기</span>
                </div>
                <p>NFT 보유 수량을 기준으로 블록체인 투표 참여 권한이 결정됩니다.</p>
                <div className="tokenGrid">
                  <div className="tokenMetric">
                    <span>현재 보유 수량</span>
                    <strong>0 NFT</strong>
                  </div>
                  <div className="tokenMetric">
                    <span>투표 최소 조건</span>
                    <strong>3 NFT</strong>
                  </div>
                </div>
                <p className="helperText">현재 3 NFT 부족하여 투표 권한이 활성화되지 않았습니다.</p>
              </article>

              <article className="mypageCard">
                <div className="mypageHeader">
                  <h3>지갑 연결</h3>
                  <span className="pill neutral">선택</span>
                </div>
                <p>검증 기록 토큰 확인을 위해 지갑을 연결할 수 있습니다.</p>
                <div className="walletActions">
                  <button className="secondaryButton fullWidth" type="button">Web3Auth 연결</button>
                  <button className="secondaryButton fullWidth" type="button">Privy 연결</button>
                </div>
              </article>
            </section>
          </div>
        ) : null}
      </main>

      <footer className="appFooter">
        <div className="footerInner">
          <div>
            <div className="footerBrand">VeriMarka</div>
            <div className="footerLinks">
              <button type="button">서비스 이용약관</button>
              <button type="button">개인정보처리방침</button>
              <button type="button">인재채용</button>
              <button type="button">제휴 문의</button>
            </div>
            <p>사업자등록번호: 123-45-67890 | 통신판매업신고번호: 제2026-서울성동-0001</p>
            <p>주소: 서울특별시 성동구 예시로 100, VeriMarka 그린팩토리, 12345</p>
            <p>© VeriMarka Corp. All Rights Reserved.</p>
          </div>
          <button className="languageButton footerLanguage" type="button">
            한국어
          </button>
        </div>
      </footer>

      <LoginChoiceModal
        open={modal === "loginChoice"}
        onClose={() => setModal("none")}
        onEmailLogin={() => setModal("emailLogin")}
        onSignup={() => setModal("signup")}
      />

      <EmailLoginModal
        open={modal === "emailLogin"}
        onClose={() => setModal("none")}
        onSubmit={handleLogin}
        onSignup={() => setModal("signup")}
      />

      <SignupModal
        open={modal === "signup"}
        onClose={() => setModal("none")}
        onSubmit={handleSignup}
        onLogin={() => setModal("emailLogin")}
      />

      <IdentityModal
        open={identityModalOpen}
        phone={phoneInput}
        code={codeInput}
        timer={identityTimer}
        sending={sendingCode}
        verifying={verifyingCode}
        onPhoneChange={(value) => setPhoneInput(value)}
        onCodeChange={(value) => setCodeInput(value)}
        onClose={() => setIdentityModalOpen(false)}
        onSendCode={sendVerificationCode}
        onVerify={verifyPhone}
      />

      <LoginSuccessToast
        open={toast.open}
        message={toast.message}
        duration={2200}
        onClose={closeToast}
      />
    </div>
  );
}

export default App;
