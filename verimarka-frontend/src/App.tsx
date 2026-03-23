import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import EmailLoginModal from "./components/auth/EmailLoginModal";
import EmailVerificationModal from "./components/auth/EmailVerificationModal";
import LoginChoiceModal from "./components/auth/LoginChoiceModal";
import LoginSuccessToast from "./components/auth/LoginSuccessToast";
import PhoneVerificationModal from "./components/auth/PhoneVerificationModal";
import PhoneRequiredModal from "./components/auth/PhoneRequiredModal";
import ProfileEditModal from "./components/auth/ProfileEditModal";
import SignupModal from "./components/auth/SignupModal";
import WithdrawConfirmModal from "./components/auth/WithdrawConfirmModal";
import HistoryPage from "./components/pages/HistoryPage";
import HomePage from "./components/pages/HomePage";
import MyPage from "./components/pages/MyPage";
import RegisterPage from "./components/pages/RegisterPage";
import VerifyPage from "./components/pages/VerifyPage";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { useAuth } from "./hooks/useAuth";
import { historyItems, homeActivities, recentUploads, resultConfig, systemCards, tabs, verifyHistoryItems } from "./lib/mockData";
import { AUTH_REFRESH_FAILED_EVENT, AUTH_REFRESH_SUCCESS_EVENT, apiRequest } from "./lib/api";
import type { AnalysisStage, ModalType, RegisteredContentResponse, TabName, VerifyResultResponse } from "./types/app";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

function getInitial(value: string) {
  const safeValue = value.trim();
  return safeValue ? safeValue.slice(0, 1).toUpperCase() : "V";
}

const LOADING_RING_DURATION_MS = 5000;

export default function App() {
  const { user, loading, isLoggedIn, login, signup, logout, withdraw, refreshMe, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [modal, setModal] = useState<ModalType>("none");
  const [toast, setToast] = useState({
    open: false,
    message: "로그인 완료했습니다.",
    duration: 3000,
  });
  const [phoneVerificationModalOpen, setPhoneVerificationModalOpen] = useState(false);
  const [emailVerificationModalOpen, setEmailVerificationModalOpen] = useState(false);
  const [phoneRequiredModalOpen, setPhoneRequiredModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneCodeInput, setPhoneCodeInput] = useState("");
  const [phoneTimer, setPhoneTimer] = useState(0);
  const [sendingPhoneCode, setSendingPhoneCode] = useState(false);
  const [verifyingPhoneCode, setVerifyingPhoneCode] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailCodeInput, setEmailCodeInput] = useState("");
  const [emailTimer, setEmailTimer] = useState(0);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("idle");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisRequestPending, setAnalysisRequestPending] = useState(false);
  const [reviewVoteProgress, setReviewVoteProgress] = useState(0);
  const [reviewVoteRequestPending, setReviewVoteRequestPending] = useState(false);
  const [reviewVoteModalOpen, setReviewVoteModalOpen] = useState(false);
  const [reviewVoteDraft, setReviewVoteDraft] = useState<{
    contentId: string;
    upvotes: number;
    downvotes: number;
    participantCount: number;
    votedChoice: "yes" | "no" | null;
  } | null>(null);
  const [watermarkProgress, setWatermarkProgress] = useState(0);
  const [watermarkRequestPending, setWatermarkRequestPending] = useState(false);
  const [mintProgress, setMintProgress] = useState(0);
  const [mintRequestPending, setMintRequestPending] = useState(false);
  const [contentResult, setContentResult] = useState<RegisteredContentResponse | null>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyPreviewUrl, setVerifyPreviewUrl] = useState("");
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyRunning, setVerifyRunning] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResultResponse | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "allow" | "review">("all");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const verifyInputRef = useRef<HTMLInputElement | null>(null);

  const phoneVerified = Boolean(user?.phone_verified);
  const emailVerified = Boolean(user?.email_verified);
  const displayName = useMemo(() => {
    if (!user) return "";
    return user.display_name || user.nickname || user.username || user.email.split("@")[0] || "회원";
  }, [user]);
  const profileEmail = user?.email || "user@verimarka.com";
  const profilePhone = user?.phone ? formatPhoneNumber(user.phone) : "미인증";
  const avatarInitial = getInitial(displayName);

  useEffect(() => {
    if (!phoneTimer) return;
    const timerId = window.setTimeout(() => setPhoneTimer((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timerId);
  }, [phoneTimer]);

  useEffect(() => {
    if (!emailTimer) return;
    const timerId = window.setTimeout(() => setEmailTimer((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timerId);
  }, [emailTimer]);

  useEffect(() => {
    if (!phoneVerificationModalOpen && !emailVerificationModalOpen) return;
    setPhoneInput(user?.phone ?? "");
    setEmailInput(user?.email ?? "");
  }, [phoneVerificationModalOpen, emailVerificationModalOpen, user?.phone, user?.email]);

  useEffect(() => {
    function handleRefreshSuccess() {
      openToast("세션이 갱신되었습니다.");
    }

    function handleRefreshFailure() {
      setActiveTab("home");
      openToast("세션이 만료되었습니다. 다시 로그인해주세요.");
    }

    window.addEventListener(AUTH_REFRESH_SUCCESS_EVENT, handleRefreshSuccess);
    window.addEventListener(AUTH_REFRESH_FAILED_EVENT, handleRefreshFailure);

    return () => {
      window.removeEventListener(AUTH_REFRESH_SUCCESS_EVENT, handleRefreshSuccess);
      window.removeEventListener(AUTH_REFRESH_FAILED_EVENT, handleRefreshFailure);
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      setAnalysisStage("idle");
      setAnalysisProgress(0);
      setReviewVoteProgress(0);
      setReviewVoteModalOpen(false);
      setReviewVoteDraft(null);
      setWatermarkProgress(0);
      setMintProgress(0);
      setContentResult(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setAnalysisStage("ready");
    setAnalysisProgress(0);
    setReviewVoteProgress(0);
    setWatermarkProgress(0);
    setMintProgress(0);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!contentResult?.public_id || contentResult.decision !== "review") {
      setReviewVoteModalOpen(false);
      return;
    }

    setReviewVoteDraft((current) => {
      if (current && current.contentId === contentResult.public_id) {
        return current;
      }

      return {
        contentId: contentResult.public_id,
        upvotes: contentResult.blockchain?.vote?.upvotes ?? 0,
        downvotes: contentResult.blockchain?.vote?.downvotes ?? 0,
        participantCount: contentResult.blockchain?.vote?.participant_count ?? 0,
        votedChoice: null,
      };
    });
  }, [
    contentResult?.public_id,
    contentResult?.decision,
    contentResult?.blockchain?.vote?.upvotes,
    contentResult?.blockchain?.vote?.downvotes,
    contentResult?.blockchain?.vote?.participant_count,
  ]);

  useEffect(() => {
    if (!verifyFile) {
      setVerifyPreviewUrl("");
      setVerifyProgress(0);
      setVerifyRunning(false);
      setVerifyResult(null);
      return;
    }

    const objectUrl = URL.createObjectURL(verifyFile);
    setVerifyPreviewUrl(objectUrl);
    setVerifyProgress(0);
    setVerifyRunning(false);
    setVerifyResult(null);

    return () => URL.revokeObjectURL(objectUrl);
  }, [verifyFile]);

  useEffect(() => {
    if (analysisStage !== "running" || !analysisRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(100, (elapsed / LOADING_RING_DURATION_MS) * 100);
      setAnalysisProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, analysisRequestPending]);

  useEffect(() => {
    if (analysisStage !== "reviewStarting" || !reviewVoteRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(100, (elapsed / LOADING_RING_DURATION_MS) * 100);
      setReviewVoteProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, reviewVoteRequestPending]);

  useEffect(() => {
    if (analysisStage !== "watermarking" || !watermarkRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(100, (elapsed / LOADING_RING_DURATION_MS) * 100);
      setWatermarkProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, watermarkRequestPending]);

  useEffect(() => {
    if (analysisStage !== "minting" || !mintRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(100, (elapsed / LOADING_RING_DURATION_MS) * 100);
      setMintProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, mintRequestPending]);

  useEffect(() => {
    if (analysisStage !== "reviewLive" || !contentResult?.public_id) return;
    const voteStatus = contentResult.blockchain?.vote?.status;
    if (voteStatus && voteStatus !== "Pending") return;
    const intervalId = window.setInterval(() => {
      void refreshReviewVote(contentResult.public_id, { silent: true });
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, contentResult?.public_id, contentResult?.blockchain?.vote?.status]);

  useEffect(() => {
    if (!verifyRunning) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(100, (elapsed / LOADING_RING_DURATION_MS) * 100);
      setVerifyProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [verifyRunning]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return historyItems;
    return historyItems.filter((item) => item.type === historyFilter);
  }, [historyFilter]);

  const registerDecision =
    analysisStage === "allow" || analysisStage === "review" || analysisStage === "block"
      ? analysisStage
      : contentResult?.decision === "allow" || contentResult?.decision === "review" || contentResult?.decision === "block"
        ? contentResult.decision
        : null;

  const registerResult = registerDecision ? resultConfig[registerDecision] : null;

  function openToast(message: string, duration = 3000) {
    setToast({ open: true, message, duration });
  }

  function closeToast() {
    setToast((current) => ({ ...current, open: false }));
  }

  function promptPhoneRequired(message = "서비스 이용을 위해 마이페이지에서 휴대폰 인증을 완료해주세요.") {
    setPhoneRequiredModalOpen(true);
    openToast(message);
  }

  async function handleLogin(email: string, password: string) {
    await login(email, password);
    setModal("none");
    openToast("로그인되었습니다. 반갑습니다.");
  }

  async function handleSignup(
    email: string,
    username: string,
    password: string,
    termsAgreed: boolean,
    privacyAgreed: boolean,
  ) {
    await signup({
      email,
      username,
      password,
      terms_agreed: termsAgreed,
      privacy_agreed: privacyAgreed,
    });
    setModal("none");
    openToast("회원가입과 로그인이 완료되었습니다.");
  }

  function handleLogout() {
    logout();
    setActiveTab("home");
    setSelectedFile(null);
    setPhoneVerificationModalOpen(false);
    setEmailVerificationModalOpen(false);
    setPhoneRequiredModalOpen(false);
    setProfileEditOpen(false);
    openToast("로그아웃되었습니다.");
    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  }

  async function handleProfileUpdate(payload: { display_name: string }) {
    setProfileSaving(true);
    try {
      await updateProfile(payload);
      setProfileEditOpen(false);
      openToast("프로필이 변경되었습니다.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      await withdraw();
      setWithdrawOpen(false);
      setActiveTab("home");
      setSelectedFile(null);
      setPhoneVerificationModalOpen(false);
      setEmailVerificationModalOpen(false);
      setPhoneRequiredModalOpen(false);
      setPhoneCodeInput("");
      setEmailCodeInput("");
      setPhoneTimer(0);
      setEmailTimer(0);
      setProfileEditOpen(false);
      openToast("회원 탈퇴가 완료되었습니다.");
      window.setTimeout(() => {
        window.location.reload();
      }, 350);
    } finally {
      setWithdrawing(false);
    }
  }

  function moveToTab(nextTab: TabName) {
    const tabConfig = tabs.find((tab) => tab.key === nextTab);
    if (tabConfig?.requiresAuth && !isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 이용 가능합니다.");
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
    setContentResult(null);
    openToast("이미지 업로드가 완료되었습니다.");
  }

  function triggerFilePicker() {
    if (!isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 업로드할 수 있습니다.");
      return;
    }
    uploadInputRef.current?.click();
  }

  function triggerVerifyPicker() {
    if (!isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 이용 가능합니다.");
      return;
    }
    if (!phoneVerified) {
      promptPhoneRequired("휴대폰 인증이 필요합니다.");
      return;
    }
    verifyInputRef.current?.click();
  }

  async function startAnalysis() {
    if (!selectedFile) {
      window.alert("먼저 업로드할 이미지를 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setAnalysisProgress(0);
    setAnalysisStage("running");
    setAnalysisRequestPending(true);
    setContentResult(null);
    openToast("등록 가능 여부 분석을 요청했습니다.");

    try {
      const response = await apiRequest<RegisteredContentResponse>("/contents/register/", {
        method: "POST",
        auth: true,
        body: formData,
      });

      const decision =
        response.decision === "allow" || response.decision === "review" || response.decision === "block"
          ? response.decision
          : "block";

      setContentResult(response);
      setAnalysisProgress(100);
      setAnalysisStage(decision);
      openToast(
        decision === "allow"
          ? "분석이 완료되었습니다. 등록 가능한 콘텐츠입니다."
          : decision === "review"
            ? "분석이 완료되었습니다. 보류 판정이 생성되었습니다."
            : "분석이 완료되었습니다. 등록 제한 판정이 생성되었습니다.",
      );
    } catch (error) {
      setAnalysisStage("ready");
      setAnalysisProgress(0);
      window.alert(error instanceof Error ? error.message : "등록 가능 여부 확인에 실패했습니다.");
    } finally {
      setAnalysisRequestPending(false);
    }
  }

  function handlePickVerifyFile(event: React.ChangeEvent<HTMLInputElement>) {
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
    setVerifyFile(nextFile);
    setVerifyResult(null);
    openToast("검증 이미지 업로드가 완료되었습니다.");
  }

  async function startVerify() {
    if (!verifyFile) {
      window.alert("먼저 검증할 이미지를 선택해주세요.");
      return;
    }
    if (!phoneVerified) {
      promptPhoneRequired("휴대폰 인증이 필요합니다.");
      return;
    }

    const formData = new FormData();
    formData.append("file", verifyFile);

    setVerifyProgress(0);
    setVerifyRunning(true);
    setVerifyResult(null);
    openToast("저작물 검증을 요청했습니다.");

    try {
      const response = await apiRequest<VerifyResultResponse>("/contents/verify/", {
        method: "POST",
        auth: true,
        body: formData,
      });
      setVerifyResult(response);
      setVerifyProgress(100);
      openToast(
        response.outcome === "verified"
          ? "워터마크 검증이 완료되었습니다."
          : "유사 이미지 후보 탐색이 완료되었습니다.",
      );
    } catch (error) {
      setVerifyProgress(0);
      window.alert(error instanceof Error ? error.message : "저작물 검증에 실패했습니다.");
    } finally {
      setVerifyRunning(false);
    }
  }

  async function startWatermark() {
    if (!contentResult) {
      window.alert("먼저 등록 가능 여부 분석을 완료해주세요.");
      return;
    }

    if (!phoneVerified) {
      promptPhoneRequired("휴대폰 인증이 필요합니다.");
      return;
    }

    if (contentResult.watermark?.applied && contentResult.watermark_file_url) {
      window.open(contentResult.watermark_file_url, "_blank", "noopener,noreferrer");
      return;
    }

    setAnalysisStage("watermarking");
    setWatermarkProgress(0);
    setWatermarkRequestPending(true);
    openToast("워터마크 삽입을 요청했습니다.");

    try {
      const response = await apiRequest<RegisteredContentResponse>(
        `/contents/${contentResult.public_id}/watermark/`,
        {
          method: "POST",
          auth: true,
        },
      );
      setContentResult(response);
      setWatermarkProgress(100);
      setAnalysisStage("watermarked");
      openToast("워터마크 삽입이 완료되었습니다.");
    } catch (error) {
      setAnalysisStage("allow");
      setWatermarkProgress(0);
      window.alert(error instanceof Error ? error.message : "워터마크 삽입에 실패했습니다.");
    } finally {
      setWatermarkRequestPending(false);
    }
  }

  async function startReviewVote() {
    if (!contentResult) {
      window.alert("먼저 REVIEW 판정 콘텐츠를 준비해주세요.");
      return;
    }

    if (!phoneVerified) {
      promptPhoneRequired("휴대폰 인증이 필요합니다.");
      return;
    }

    setAnalysisStage("reviewStarting");
    setReviewVoteProgress(0);
    setReviewVoteRequestPending(true);
    openToast("커뮤니티 검증 투표 생성을 요청했습니다.");

    try {
      const response = await apiRequest<RegisteredContentResponse>(
        `/contents/${contentResult.public_id}/review-vote/start/`,
        {
          method: "POST",
          auth: true,
        },
      );
      setContentResult(response);
      setReviewVoteProgress(100);

      if (response.decision === "allow" || response.decision === "block") {
        setAnalysisStage(response.decision);
      } else {
        setAnalysisStage("reviewLive");
      }
      openToast("커뮤니티 검증 투표가 시작되었습니다.");
    } catch (error) {
      setAnalysisStage("review");
      setReviewVoteProgress(0);
      window.alert(error instanceof Error ? error.message : "커뮤니티 검증 투표 생성에 실패했습니다.");
    } finally {
      setReviewVoteRequestPending(false);
    }
  }

  async function refreshReviewVote(publicId?: string, options?: { silent?: boolean }) {
    const targetPublicId = publicId || contentResult?.public_id;
    if (!targetPublicId) return;

    try {
      const response = await apiRequest<RegisteredContentResponse>(`/contents/${targetPublicId}/review-vote/`, {
        method: "GET",
        auth: true,
      });
      setContentResult(response);

      if (response.decision === "allow" || response.decision === "block") {
        setReviewVoteModalOpen(false);
        setAnalysisStage(response.decision);
        if (!options?.silent) {
          openToast(
            response.decision === "allow"
              ? "커뮤니티 검증이 승인되어 등록 가능 상태로 전환되었습니다."
              : "커뮤니티 검증이 거절되어 등록 제한 상태로 전환되었습니다.",
          );
        }
        return;
      }

      setAnalysisStage("reviewLive");
      if (!options?.silent) {
        openToast("커뮤니티 검증 현황을 새로고침했습니다.");
      }
    } catch (error) {
      if (!options?.silent) {
        window.alert(error instanceof Error ? error.message : "커뮤니티 검증 상태를 불러오지 못했습니다.");
      }
    }
  }

  async function startMint() {
    if (!contentResult) {
      window.alert("먼저 워터마크 삽입을 완료해주세요.");
      return;
    }

    if (!phoneVerified) {
      promptPhoneRequired("휴대폰 인증이 필요합니다.");
      return;
    }

    if (
      contentResult.blockchain?.mint_kind === "content" &&
      contentResult.blockchain?.minted &&
      contentResult.blockchain?.tx_hash
    ) {
      setAnalysisStage("minted");
      return;
    }

    setAnalysisStage("minting");
    setMintProgress(0);
    setMintRequestPending(true);
    openToast("NFT 토큰 발행을 요청했습니다.");

    try {
      const response = await apiRequest<RegisteredContentResponse>(
        `/contents/${contentResult.public_id}/mint/`,
        {
          method: "POST",
          auth: true,
        },
      );
      setContentResult(response);
      setMintProgress(100);
      setAnalysisStage("minted");
      openToast("NFT 토큰 발행이 완료되었습니다.");
    } catch (error) {
      setAnalysisStage("watermarked");
      setMintProgress(0);
      window.alert(error instanceof Error ? error.message : "NFT 토큰 발행에 실패했습니다.");
    } finally {
      setMintRequestPending(false);
    }
  }

  function castReviewDemoVote(choice: "yes" | "no") {
    if (!contentResult?.public_id) return;

    setReviewVoteDraft((current) => {
      const base = current && current.contentId === contentResult.public_id
        ? current
        : {
            contentId: contentResult.public_id,
            upvotes: contentResult.blockchain?.vote?.upvotes ?? 0,
            downvotes: contentResult.blockchain?.vote?.downvotes ?? 0,
            participantCount: contentResult.blockchain?.vote?.participant_count ?? 0,
            votedChoice: null as "yes" | "no" | null,
          };

      if (base.votedChoice) {
        return base;
      }

      return {
        ...base,
        upvotes: base.upvotes + (choice === "yes" ? 1 : 0),
        downvotes: base.downvotes + (choice === "no" ? 1 : 0),
        participantCount: base.participantCount + 1,
        votedChoice: choice,
      };
    });

    setReviewVoteModalOpen(false);
    openToast("데모 투표에 참여했습니다. 실제 서비스에서는 블록체인에 기록됩니다.");
  }

  async function sendPhoneVerificationCode() {
    const normalizedPhone = phoneInput.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(normalizedPhone)) {
      window.alert("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }

    setSendingPhoneCode(true);
    try {
      await apiRequest("/accounts/phone/send-code/", {
        method: "POST",
        auth: true,
        body: { phone: normalizedPhone },
      });
      setPhoneInput(formatPhoneNumber(normalizedPhone));
      setPhoneTimer(180);
      openToast("인증번호를 전송했습니다. 메시지를 확인해주세요.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setSendingPhoneCode(false);
    }
  }

  async function verifyPhone() {
    const normalizedPhone = phoneInput.replace(/\D/g, "");
    if (!/^\d{6}$/.test(phoneCodeInput)) {
      window.alert("인증번호 6자리를 입력해주세요.");
      return;
    }

    setVerifyingPhoneCode(true);
    try {
      await apiRequest("/accounts/phone/verify-code/", {
        method: "POST",
        auth: true,
        body: { phone: normalizedPhone, code: phoneCodeInput },
      });
      await refreshMe();
      setPhoneCodeInput("");
      setPhoneTimer(0);
      setPhoneVerificationModalOpen(false);
      openToast("휴대폰 인증이 완료되었습니다.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "본인 인증에 실패했습니다.");
    } finally {
      setVerifyingPhoneCode(false);
    }
  }

  async function sendEmailVerificationCode() {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      window.alert("이메일 주소를 정확히 입력해주세요.");
      return;
    }

    setSendingEmailCode(true);
    try {
      await apiRequest("/accounts/email/send-code/", {
        method: "POST",
        auth: true,
        body: { email: normalizedEmail },
      });
      setEmailInput(normalizedEmail);
      setEmailTimer(180);
      openToast("이메일로 인증번호를 전송했습니다.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "이메일 인증번호 발송에 실패했습니다.");
    } finally {
      setSendingEmailCode(false);
    }
  }

  async function verifyEmail() {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!/^\d{6}$/.test(emailCodeInput)) {
      window.alert("이메일 인증번호 6자리를 입력해주세요.");
      return;
    }

    setVerifyingEmailCode(true);
    try {
      await apiRequest("/accounts/email/verify-code/", {
        method: "POST",
        auth: true,
        body: { email: normalizedEmail, code: emailCodeInput },
      });
      await refreshMe();
      setEmailCodeInput("");
      setEmailTimer(0);
      setEmailVerificationModalOpen(false);
      openToast("이메일 인증이 완료되었습니다.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "이메일 인증에 실패했습니다.");
    } finally {
      setVerifyingEmailCode(false);
    }
  }

  return (
    <div className="page-shell">
      <Header
        tabs={tabs}
        activeTab={activeTab}
        loading={loading}
        isLoggedIn={isLoggedIn}
        displayName={displayName}
        avatarInitial={avatarInitial}
        onMoveTab={moveToTab}
        onOpenLogin={() => setModal("loginChoice")}
        onOpenSignup={() => setModal("signup")}
        onLogout={handleLogout}
      />

      <main>
        {activeTab === "home" ? (
          <HomePage systemCards={systemCards} activities={homeActivities} onMoveTab={moveToTab} />
        ) : null}

        {activeTab === "add" ? (
          <RegisterPage
            isLoggedIn={isLoggedIn}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            analysisStage={analysisStage}
            analysisProgress={analysisProgress}
            registerResult={registerResult}
            contentResult={contentResult}
            recentUploads={recentUploads}
            onPickFile={handlePickFile}
            onTriggerPicker={triggerFilePicker}
            onStartAnalysis={startAnalysis}
            onResetToHome={() => {
              setSelectedFile(null);
              setActiveTab("home");
            }}
            onResetToReady={() => {
              setAnalysisStage("ready");
              setAnalysisProgress(0);
              setReviewVoteProgress(0);
              setReviewVoteModalOpen(false);
              setWatermarkProgress(0);
              setMintProgress(0);
            }}
            onSelectAnother={triggerFilePicker}
            onPrimaryAction={() => {
              if (registerResult?.tone === "block") {
                triggerFilePicker();
                return;
              }
              if (!phoneVerified) {
                promptPhoneRequired("휴대폰 인증이 필요합니다.");
                return;
              }
              if (registerResult?.tone === "allow") {
                if (contentResult?.watermark?.applied) {
                  void startMint();
                  return;
                }
                void startWatermark();
                return;
              }
              if (registerResult?.tone === "review") {
                void startReviewVote();
                return;
              }
              if (registerResult) openToast(registerResult.primaryAction);
            }}
            onDownloadWatermarked={() => {
              if (contentResult?.watermark_file_url) {
                window.open(contentResult.watermark_file_url, "_blank", "noopener,noreferrer");
                return;
              }
              openToast("워터마크 결과 파일이 아직 준비되지 않았습니다.");
            }}
            onMoveToHistory={() => setActiveTab("history")}
            onCopyVerificationUrl={() => {
              const verificationLink = contentResult?.blockchain?.verification_link;
              if (!verificationLink) {
                openToast("복사할 검증 URL이 아직 준비되지 않았습니다.");
                return;
              }
              void navigator.clipboard.writeText(verificationLink);
              openToast("검증 URL을 복사했습니다.");
            }}
            uploadInputRef={uploadInputRef}
            formatFileSize={formatFileSize}
            reviewVoteProgress={reviewVoteProgress}
            watermarkProgress={watermarkProgress}
            mintProgress={mintProgress}
            reviewVoteDraft={reviewVoteDraft}
            reviewVoteModalOpen={reviewVoteModalOpen}
            onOpenReviewVoteModal={() => setReviewVoteModalOpen(true)}
            onCloseReviewVoteModal={() => setReviewVoteModalOpen(false)}
            onCastReviewDemoVote={castReviewDemoVote}
            onRefreshReviewVote={() => {
              void refreshReviewVote();
            }}
          />
        ) : null}

        {activeTab === "verify" ? (
          <VerifyPage
            selectedFile={verifyFile}
            previewUrl={verifyPreviewUrl}
            verifyProgress={verifyProgress}
            verifyRunning={verifyRunning}
            verifyResult={verifyResult}
            recentItems={verifyHistoryItems}
            uploadInputRef={verifyInputRef}
            formatFileSize={formatFileSize}
            onPickFile={handlePickVerifyFile}
            onTriggerPicker={triggerVerifyPicker}
            onStartVerify={startVerify}
            onResetVerify={() => {
              setVerifyFile(null);
              setVerifyPreviewUrl("");
              setVerifyProgress(0);
              setVerifyRunning(false);
              setVerifyResult(null);
            }}
          />
        ) : null}

        {activeTab === "history" ? (
          <HistoryPage items={filteredHistory} historyFilter={historyFilter} onFilterChange={setHistoryFilter} />
        ) : null}

        {activeTab === "mypage" ? (
          <MyPage
            displayName={displayName || "VeriMarka 사용자"}
            profileEmail={profileEmail}
            profilePhone={profilePhone}
            avatarInitial={avatarInitial}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            onOpenProfileEdit={() => setProfileEditOpen(true)}
            onOpenPhoneIdentity={() => setPhoneVerificationModalOpen(true)}
            onOpenEmailIdentity={() => setEmailVerificationModalOpen(true)}
            onLogout={handleLogout}
            onOpenWithdraw={() => setWithdrawOpen(true)}
          />
        ) : null}
      </main>

      <Footer />

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

      <PhoneVerificationModal
        open={phoneVerificationModalOpen}
        phone={phoneInput}
        phoneCode={phoneCodeInput}
        phoneTimer={phoneTimer}
        sendingPhone={sendingPhoneCode}
        verifyingPhone={verifyingPhoneCode}
        phoneVerified={phoneVerified}
        onPhoneChange={setPhoneInput}
        onPhoneCodeChange={setPhoneCodeInput}
        onClose={() => setPhoneVerificationModalOpen(false)}
        onSendPhoneCode={sendPhoneVerificationCode}
        onVerifyPhone={verifyPhone}
      />

      <PhoneRequiredModal
        open={phoneRequiredModalOpen}
        onClose={() => setPhoneRequiredModalOpen(false)}
        onMoveToMyPage={() => {
          setPhoneRequiredModalOpen(false);
          setActiveTab("mypage");
        }}
      />

      <EmailVerificationModal
        open={emailVerificationModalOpen}
        email={emailInput}
        emailCode={emailCodeInput}
        emailTimer={emailTimer}
        sendingEmail={sendingEmailCode}
        verifyingEmail={verifyingEmailCode}
        emailVerified={emailVerified}
        onEmailChange={setEmailInput}
        onEmailCodeChange={setEmailCodeInput}
        onClose={() => setEmailVerificationModalOpen(false)}
        onSendEmailCode={sendEmailVerificationCode}
        onVerifyEmail={verifyEmail}
      />

      <ProfileEditModal
        open={profileEditOpen}
        initialDisplayName={displayName || ""}
        submitting={profileSaving}
        onClose={() => setProfileEditOpen(false)}
        onSubmit={handleProfileUpdate}
      />

      <WithdrawConfirmModal
        open={withdrawOpen}
        submitting={withdrawing}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
      />

      <LoginSuccessToast
        open={toast.open}
        message={toast.message}
        duration={toast.duration}
        onClose={closeToast}
      />
    </div>
  );
}
