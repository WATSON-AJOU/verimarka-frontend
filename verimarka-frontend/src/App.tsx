import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccount, useChainId, useConnect, useDisconnect, usePublicClient, useSignMessage, useSwitchChain, useWalletClient } from "wagmi";
import { estimateContractGas, waitForTransactionReceipt, writeContract } from "viem/actions";
import "./App.css";
import EmailLoginModal from "./components/auth/EmailLoginModal";
import EmailVerificationModal from "./components/auth/EmailVerificationModal";
import LoginChoiceModal from "./components/auth/LoginChoiceModal";
import LoginSuccessToast from "./components/auth/LoginSuccessToast";
import PhoneVerificationModal from "./components/auth/PhoneVerificationModal";
import PhoneRequiredModal from "./components/auth/PhoneRequiredModal";
import ProfileEditModal from "./components/auth/ProfileEditModal";
import SignupModal from "./components/auth/SignupModal";
import WalletConnectModal from "./components/auth/WalletConnectModal";
import WithdrawConfirmModal from "./components/auth/WithdrawConfirmModal";
import HistoryPage from "./components/pages/HistoryPage";
import HomePage from "./components/pages/HomePage";
import MyPage from "./components/pages/MyPage";
import RegisterPage from "./components/pages/RegisterPage";
import VerifyPage from "./components/pages/VerifyPage";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { useAuth } from "./hooks/useAuth";
import { resultConfig, systemCards, tabs } from "./lib/mockData";
import { AUTH_REFRESH_FAILED_EVENT, AUTH_REFRESH_SUCCESS_EVENT, apiRequest } from "./lib/api";
import { watsonNftAbi } from "./lib/watsonNftAbi";
import { sepolia, walletConnectEnabled } from "./lib/wallet";
import { getAccessToken } from "./lib/token";
import type { ActivityItem, AnalysisJobStatusResponse, AnalysisStage, AsyncContentJobResponse, AsyncVerifyJobResponse, ModalType, RegisteredContentResponse, TabName, VerifyResultResponse, WalletSummaryResponse } from "./types/app";
import type { HistoryItem } from "./types/app";

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

function formatLastLogin(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function formatWalletAddress(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function getWalletNetworkLabel(chainId: number | null | undefined) {
  if (chainId === sepolia.id) return "Sepolia";
  if (!chainId) return "Sepolia";
  return `Chain #${chainId}`;
}

function hasInjectedWalletProvider() {
  if (typeof window === "undefined") return false;
  return typeof (window as Window & { ethereum?: unknown }).ethereum !== "undefined";
}

function getWalletInstallMessage(connectorId?: string) {
  if (connectorId === "rabby") {
    return "Rabby 지갑이 설치되어 있지 않습니다. Rabby 확장 프로그램을 먼저 설치하세요.";
  }

  if (connectorId === "trustWallet") {
    return "Trust Wallet 지갑이 설치되어 있지 않습니다. Trust Wallet 확장 프로그램을 먼저 설치하세요.";
  }

  if (connectorId === "walletConnect") {
    return "WalletConnect를 사용할 수 없습니다. Project ID 설정을 확인하세요.";
  }

  return "브라우저 지갑이 설치되어 있지 않습니다. MetaMask 같은 지갑을 먼저 설치하세요.";
}

const TAB_PATHS: Record<TabName, string> = {
  home: "/",
  add: "/register",
  verify: "/verify",
  history: "/history",
  mypage: "/mypage",
};

function getTabFromPath(pathname: string): TabName {
  if (pathname === "/register") return "add";
  if (pathname === "/verify") return "verify";
  if (pathname === "/history") return "history";
  if (pathname === "/mypage") return "mypage";
  return "home";
}

function buildHistoryEntryUrl(entryId: string) {
  const url = new URL(window.location.href);
  url.pathname = TAB_PATHS.history;
  url.searchParams.set("entry", entryId);
  return url.toString();
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

function getMimeTypeFromFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function formatReviewVoteEndAt(baseTime: number) {
  const date = new Date(baseTime + 72 * 60 * 60 * 1000);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}월 ${day}일 ${hours}시 ${minutes}분`;
}

function getInitial(value: string) {
  const safeValue = value.trim();
  return safeValue ? safeValue.slice(0, 1).toUpperCase() : "V";
}

const LOADING_RING_DURATION_MS = 15000;
const LOADING_RING_MAX_PENDING_PROGRESS = 99;
const AUTO_LOGOUT_IDLE_MS = 30 * 60 * 1000;
const POST_LOGOUT_TOAST_KEY = "verimarka:post-logout-toast";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isLoggedIn, login, signup, logout, withdraw, refreshMe, updateProfile } = useAuth();
  const { address: connectedWalletAddress, connector: connectedConnector, isConnected } = useAccount();
  const currentWalletChainId = useChainId();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const [modal, setModal] = useState<ModalType>("none");
  const [toast, setToast] = useState({
    id: 0,
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
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [reviewVoteProgress, setReviewVoteProgress] = useState(0);
  const [reviewVoteRequestPending, setReviewVoteRequestPending] = useState(false);
  const [reviewVoteModalOpen, setReviewVoteModalOpen] = useState(false);
  const [reviewConsentModalOpen, setReviewConsentModalOpen] = useState(false);
  const [reviewConsentNotifyByEmail, setReviewConsentNotifyByEmail] = useState(false);
  const [reviewConsentOpenedAt, setReviewConsentOpenedAt] = useState<number | null>(null);
  const [reviewVoteDraft, setReviewVoteDraft] = useState<{
    contentId: string;
    upvotes: number;
    downvotes: number;
    participantCount: number;
    votedChoice: "yes" | "no" | null;
  } | null>(null);
  const [watermarkProgress, setWatermarkProgress] = useState(0);
  const [watermarkRequestPending, setWatermarkRequestPending] = useState(false);
  const [watermarkJobId, setWatermarkJobId] = useState<string | null>(null);
  const [mintProgress, setMintProgress] = useState(0);
  const [mintRequestPending, setMintRequestPending] = useState(false);
  const [contentResult, setContentResult] = useState<RegisteredContentResponse | null>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyPreviewUrl, setVerifyPreviewUrl] = useState("");
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyRunning, setVerifyRunning] = useState(false);
  const [verifyJobId, setVerifyJobId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResultResponse | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "allow" | "block" | "review" | "verify">("all");
  const [historyEntries, setHistoryEntries] = useState<HistoryItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [ongoingVoteUploads, setOngoingVoteUploads] = useState<import("./types/app").UploadHistoryItem[]>([]);
  const [ongoingVoteVerifyItems, setOngoingVoteVerifyItems] = useState<import("./types/app").VerifyHistoryItem[]>([]);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletConnectingLabel, setWalletConnectingLabel] = useState("");
  const [walletDisconnecting, setWalletDisconnecting] = useState(false);
  const [walletConnectModalOpen, setWalletConnectModalOpen] = useState(false);
  const [historyVoteSubmitting, setHistoryVoteSubmitting] = useState(false);
  const [walletSummary, setWalletSummary] = useState<WalletSummaryResponse>({
    connected: false,
    address: null,
    chain_id: null,
    wallet_type: "",
    network_name: "Sepolia",
    nft_count: 0,
    vote_minimum: 3,
    vote_eligible: false,
  });
  const [walletSummaryLoading, setWalletSummaryLoading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const verifyInputRef = useRef<HTMLInputElement | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);

  const phoneVerified = Boolean(user?.phone_verified);
  const emailVerified = Boolean(user?.email_verified);
  const activeTab = useMemo(() => getTabFromPath(location.pathname), [location.pathname]);
  const historyEntryFromUrl = useMemo(() => new URLSearchParams(location.search).get("entry"), [location.search]);
  const historyDetailTypeFromUrl = useMemo(() => {
    const value = new URLSearchParams(location.search).get("detail");
    if (value === "allow" || value === "review" || value === "block") return value;
    return null;
  }, [location.search]);
  const displayName = useMemo(() => {
    if (!user) return "";
    return user.display_name || user.nickname || user.username || user.email.split("@")[0] || "회원";
  }, [user]);
  const profileEmail = user?.email || "user@verimarka.com";
  const profilePhone = user?.phone ? formatPhoneNumber(user.phone) : "미인증";
  const lastLoginLabel = formatLastLogin(user?.last_login_at);
  const avatarInitial = getInitial(displayName);
  const hasAuthSession = isLoggedIn || Boolean(getAccessToken());
  const linkedWalletAddress = formatWalletAddress(user?.wallet_address);
  const walletNetworkLabel = getWalletNetworkLabel(user?.wallet_chain_id);
  const walletTypeLabel = user?.wallet_type || connectedConnector?.name || "Injected Wallet";
  const walletRequired = !user?.wallet_address;

  function navigateToTab(nextTab: TabName, options?: { replace?: boolean; search?: string }) {
    navigate(
      {
        pathname: TAB_PATHS[nextTab],
        search: options?.search ?? "",
      },
      { replace: options?.replace ?? false },
    );
  }

  function openOngoingVoteHistory(entryId: string) {
    navigateToTab("history", { search: `?entry=${encodeURIComponent(entryId)}&detail=review` });
  }

  async function refreshWalletSummary(options?: { silent?: boolean }) {
    if (!hasAuthSession) {
      setWalletSummary({
        connected: false,
        address: null,
        chain_id: null,
        wallet_type: "",
        network_name: "Sepolia",
        nft_count: 0,
        vote_minimum: 3,
        vote_eligible: false,
      });
      return;
    }

    if (!options?.silent) {
      setWalletSummaryLoading(true);
    }

    try {
      const response = await apiRequest<WalletSummaryResponse>("/wallets/summary/", {
        method: "GET",
        auth: true,
      });
      setWalletSummary(response);
    } catch {
      setWalletSummary({
        connected: false,
        address: null,
        chain_id: null,
        wallet_type: "",
        network_name: "Sepolia",
        nft_count: 0,
        vote_minimum: 3,
        vote_eligible: false,
      });
    } finally {
      if (!options?.silent) {
        setWalletSummaryLoading(false);
      }
    }
  }

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
    const postLogoutToast = window.sessionStorage.getItem(POST_LOGOUT_TOAST_KEY);
    if (!postLogoutToast) return;

    window.sessionStorage.removeItem(POST_LOGOUT_TOAST_KEY);
    openToast(postLogoutToast, 3000);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const legacyTab = params.get("tab");
    if (!hasAuthSession || legacyTab !== "history" || location.pathname !== "/") return;

    const entry = params.get("entry");
    navigateToTab("history", {
      replace: true,
      search: entry ? `?entry=${encodeURIComponent(entry)}` : "",
    });
  }, [hasAuthSession, location.pathname, location.search]);

  useEffect(() => {
    function handleRefreshSuccess() {
      openToast("세션이 갱신되었습니다.");
    }

    function handleRefreshFailure() {
      navigateToTab("home", { replace: true });
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
    if (!hasAuthSession) {
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      return;
    }

    const resetInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = window.setTimeout(() => {
        logout();
        navigateToTab("home", { replace: true });
        setModal("none");
        setSelectedFile(null);
        setVerifyFile(null);
        setContentResult(null);
        setVerifyResult(null);
        openToast("30분 동안 활동이 없어 자동 로그아웃되었습니다.");
      }, AUTO_LOGOUT_IDLE_MS);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    };
  }, [hasAuthSession, logout]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      setAnalysisStage("idle");
      setAnalysisProgress(0);
      setAnalysisJobId(null);
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
      setVerifyJobId(null);
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
    if (!hasAuthSession || (activeTab !== "add" && activeTab !== "verify")) return;

    let cancelled = false;

    void (async () => {
      try {
        const response = await apiRequest<Array<{
          id: string;
          title: string;
          owner: string;
          date: string;
          description: string;
          preview_url?: string | null;
        }>>("/contents/ongoing-votes/", {
          method: "GET",
          auth: true,
        });

        if (cancelled) return;

        setOngoingVoteUploads(
          response.map((item, index) => ({
            id: item.id,
            title: item.title,
            date: item.date,
            owner: item.owner,
            tone: index % 3 === 0 ? "sunrise" : index % 3 === 1 ? "blue" : "green",
            previewUrl: item.preview_url ?? null,
          })),
        );
        setOngoingVoteVerifyItems(
          response.map((item, index) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            tone: index % 3 === 0 ? "blue" : index % 3 === 1 ? "review" : "green",
            previewUrl: item.preview_url ?? null,
          })),
        );
      } catch {
        if (cancelled) return;
        setOngoingVoteUploads([]);
        setOngoingVoteVerifyItems([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, hasAuthSession]);

  useEffect(() => {
    if (!hasAuthSession) {
      setWalletSummary({
        connected: false,
        address: null,
        chain_id: null,
        wallet_type: "",
        network_name: "Sepolia",
        nft_count: 0,
        vote_minimum: 3,
        vote_eligible: false,
      });
      return;
    }

    void refreshWalletSummary();
  }, [hasAuthSession, user?.wallet_address]);

  useEffect(() => {
    if (analysisStage !== "running" || !analysisJobId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await apiRequest<AnalysisJobStatusResponse>(`/analysis/jobs/${analysisJobId}/`, {
          method: "GET",
          auth: true,
        });
        if (cancelled) return;

        if (response.status === "success" && response.content) {
          const resolvedContent = response.content;
          const decision =
            resolvedContent.decision === "allow" || resolvedContent.decision === "review" || resolvedContent.decision === "block"
              ? resolvedContent.decision
              : "block";

          setContentResult(resolvedContent);
          setAnalysisProgress(100);
          setAnalysisStage(decision);
          setAnalysisRequestPending(false);
          setAnalysisJobId(null);
          openToast(
            decision === "allow"
              ? "분석이 완료되었습니다. 등록 가능한 콘텐츠입니다."
              : decision === "review"
                ? "분석이 완료되었습니다. 보류 판정이 생성되었습니다."
                : "분석이 완료되었습니다. 등록 제한 판정이 생성되었습니다.",
          );
          return;
        }

        if (response.status === "failure") {
          setAnalysisStage("ready");
          setAnalysisProgress(0);
          setAnalysisRequestPending(false);
          setAnalysisJobId(null);
          window.alert(response.error_message || "등록 가능 여부 확인에 실패했습니다.");
        }
      } catch {
        if (cancelled) return;
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [analysisStage, analysisJobId]);

  useEffect(() => {
    if (analysisStage !== "watermarking" || !watermarkJobId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await apiRequest<AnalysisJobStatusResponse>(`/analysis/jobs/${watermarkJobId}/`, {
          method: "GET",
          auth: true,
        });
        if (cancelled) return;

        if (response.status === "success" && response.content) {
          setContentResult(response.content);
          setWatermarkProgress(100);
          setAnalysisStage("watermarked");
          setWatermarkRequestPending(false);
          setWatermarkJobId(null);
          openToast("워터마크 삽입이 완료되었습니다.");
          return;
        }

        if (response.status === "failure") {
          setAnalysisStage("allow");
          setWatermarkProgress(0);
          setWatermarkRequestPending(false);
          setWatermarkJobId(null);
          window.alert(response.error_message || "워터마크 삽입에 실패했습니다.");
        }
      } catch {
        if (cancelled) return;
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [analysisStage, watermarkJobId]);

  useEffect(() => {
    if (!verifyRunning || !verifyJobId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await apiRequest<AnalysisJobStatusResponse>(`/analysis/jobs/${verifyJobId}/`, {
          method: "GET",
          auth: true,
        });
        if (cancelled) return;

        if (response.status === "success" && response.result) {
          setVerifyResult(response.result);
          setVerifyProgress(100);
          setVerifyRunning(false);
          setVerifyJobId(null);
          openToast(
            response.result.outcome === "verified"
              ? "워터마크 검증이 완료되었습니다."
              : "유사 이미지 후보 탐색이 완료되었습니다.",
          );
          return;
        }

        if (response.status === "failure") {
          setVerifyProgress(0);
          setVerifyRunning(false);
          setVerifyJobId(null);
          window.alert(response.error_message || "저작물 검증에 실패했습니다.");
        }
      } catch {
        if (cancelled) return;
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [verifyRunning, verifyJobId]);

  useEffect(() => {
    if (analysisStage !== "running" || !analysisRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(
        LOADING_RING_MAX_PENDING_PROGRESS,
        (elapsed / LOADING_RING_DURATION_MS) * LOADING_RING_MAX_PENDING_PROGRESS,
      );
      setAnalysisProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, analysisRequestPending]);

  useEffect(() => {
    if (analysisStage !== "reviewStarting" || !reviewVoteRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(
        LOADING_RING_MAX_PENDING_PROGRESS,
        (elapsed / LOADING_RING_DURATION_MS) * LOADING_RING_MAX_PENDING_PROGRESS,
      );
      setReviewVoteProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, reviewVoteRequestPending]);

  useEffect(() => {
    if (analysisStage !== "watermarking" || !watermarkRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(
        LOADING_RING_MAX_PENDING_PROGRESS,
        (elapsed / LOADING_RING_DURATION_MS) * LOADING_RING_MAX_PENDING_PROGRESS,
      );
      setWatermarkProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, watermarkRequestPending]);

  useEffect(() => {
    if (analysisStage !== "minting" || !mintRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(
        LOADING_RING_MAX_PENDING_PROGRESS,
        (elapsed / LOADING_RING_DURATION_MS) * LOADING_RING_MAX_PENDING_PROGRESS,
      );
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
      const next = Math.min(
        LOADING_RING_MAX_PENDING_PROGRESS,
        (elapsed / LOADING_RING_DURATION_MS) * LOADING_RING_MAX_PENDING_PROGRESS,
      );
      setVerifyProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [verifyRunning]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await apiRequest<Array<{
          id?: string;
          type?: "allow" | "review" | "block" | "verify";
          status: "ALLOW" | "REVIEW" | "BLOCK" | "VERIFY";
          title: string;
          description: string;
          extra?: string;
          progress?: number | null;
          tone: string;
          preview_url?: string | null;
          blockchain?: HistoryItem["blockchain"] | null;
        }>>("/logs/recent/", {
          method: "GET",
        });

        if (cancelled) return;

        setRecentActivities(
          response.map((item) => ({
            id: item.id,
            type: item.type,
            status: item.status,
            title: item.title,
            description: item.description,
            extra: item.extra,
            progress: typeof item.progress === "number" ? item.progress : undefined,
            tone: item.tone,
            previewUrl: item.preview_url ?? null,
            blockchain: item.blockchain ?? null,
          })),
        );
      } catch {
        if (!cancelled) {
          setRecentActivities([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadHistoryEntries(options?: { silent?: boolean }) {
    if (!hasAuthSession) {
      setHistoryEntries([]);
      return;
    }

    try {
      const response = await apiRequest<Array<{
        id: string;
        type: "allow" | "review" | "block" | "verify";
        file_name: string;
        summary: string;
        timestamp: string;
        cosine: string;
        phash: string;
        extra: string;
        preview_url?: string | null;
        download_url?: string | null;
        blockchain?: HistoryItem["blockchain"];
      }>>("/logs/history/", {
        method: "GET",
        auth: true,
      });

      setHistoryEntries(
        response.map((item) => ({
          id: item.id,
          type: item.type,
          fileName: item.file_name,
          summary: item.summary,
          timestamp: item.timestamp,
          cosine: item.cosine,
          phash: item.phash,
          extra: item.extra,
          previewUrl: item.preview_url ?? null,
          downloadUrl: item.download_url ?? null,
          blockchain: item.blockchain ?? null,
        })),
      );
    } catch {
      if (!options?.silent) {
        setHistoryEntries([]);
      }
    }
  }

  useEffect(() => {
    if (activeTab !== "history" || !hasAuthSession) return;

    let cancelled = false;

    void (async () => {
      try {
        await loadHistoryEntries({ silent: true });
        if (cancelled) return;
      } catch {
        if (!cancelled) {
          setHistoryEntries([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, hasAuthSession, historyEntryFromUrl]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return historyEntries;
    return historyEntries.filter((item) => item.type === historyFilter);
  }, [historyEntries, historyFilter]);

  const registerDecision =
    analysisStage === "allow" || analysisStage === "review" || analysisStage === "block"
      ? analysisStage
      : contentResult?.decision === "allow" || contentResult?.decision === "review" || contentResult?.decision === "block"
        ? contentResult.decision
        : null;

  const registerResult = registerDecision ? resultConfig[registerDecision] : null;

  function openToast(message: string, duration = 3000) {
    setToast((current) => ({
      id: current.id + 1,
      open: true,
      message,
      duration,
    }));
  }

  function closeToast() {
    setToast((current) => ({ ...current, open: false }));
  }

  function triggerDirectDownload(url: string, fileName: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  function isCrossOriginUrl(url: string) {
    try {
      return new URL(url, window.location.origin).origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  async function downloadFile(url: string, fileName: string) {
    if (isCrossOriginUrl(url)) {
      triggerDirectDownload(url, fileName);
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("다운로드 파일을 불러오지 못했습니다.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function saveFileWithPicker(url: string, fileName: string) {
    const picker = (
      window as Window & {
        showSaveFilePicker?: (options?: {
          suggestedName?: string;
          types?: Array<{
            description?: string;
            accept: Record<string, string[]>;
          }>;
        }) => Promise<{
          createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>;
            close: () => Promise<void>;
          }>;
        }>;
      }
    ).showSaveFilePicker;

    if (!picker || isCrossOriginUrl(url)) {
      await downloadFile(url, fileName);
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("다운로드 파일을 불러오지 못했습니다.");
      }

      const blob = await response.blob();
      const handle = await picker({
        suggestedName: fileName,
        types: [
          {
            description: "Image file",
            accept: {
              [blob.type || getMimeTypeFromFileName(fileName)]: [`.${fileName.split(".").pop() || "jpg"}`],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      await downloadFile(url, fileName);
    }
  }

  function promptPhoneRequired(message = "서비스 이용을 위해 마이페이지에서 휴대폰 인증을 완료해주세요.") {
    setPhoneRequiredModalOpen(true);
    openToast(message);
  }

  function promptWalletRequired(message = "지갑 연결 후 이용 가능합니다.") {
    navigateToTab("mypage");
    openToast(message);
  }

  async function handleLogin(email: string, password: string) {
    await login(email, password);
    setModal("none");
    openToast("로그인되었습니다. 반갑습니다.");
  }

  async function handleSignup(
    email: string,
    nickname: string,
    password: string,
    termsAgreed: boolean,
    privacyAgreed: boolean,
  ) {
    await signup({
      email,
      nickname,
      password,
      terms_agreed: termsAgreed,
      privacy_agreed: privacyAgreed,
    });
    setModal("none");
    openToast("회원가입과 로그인이 완료되었습니다.");
  }

  function handleLogout() {
    logout();
    navigateToTab("home", { replace: true });
    setSelectedFile(null);
    setPhoneVerificationModalOpen(false);
    setEmailVerificationModalOpen(false);
    setPhoneRequiredModalOpen(false);
    setProfileEditOpen(false);
    window.sessionStorage.setItem(POST_LOGOUT_TOAST_KEY, "로그아웃되었습니다.");
    window.location.reload();
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
      navigateToTab("home", { replace: true });
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

  async function connectWalletWithConnector(connectorId?: string) {
    if (walletConnecting) {
      openToast("이미 지갑 연결 요청이 진행 중입니다. MetaMask 승인창을 먼저 확인하세요.");
      return;
    }

    if (!hasAuthSession) {
      setModal("loginChoice");
      openToast("로그인 후 지갑을 연결할 수 있습니다.");
      return;
    }

    setWalletConnecting(true);
    setWalletConnectingLabel("지갑 승인창을 확인하고 연결 요청을 완료하세요.");

    try {
      let walletAddress = connectedWalletAddress;
      let walletType = connectedConnector?.name || "Injected Wallet";
      let walletChainId = currentWalletChainId ?? sepolia.id;
      const requiresNewConnection =
        !walletAddress || !isConnected || (connectorId && connectedConnector?.id !== connectorId);

      if (requiresNewConnection) {
        if (connectorId === "walletConnect" && !walletConnectEnabled) {
          throw new Error(getWalletInstallMessage("walletConnect"));
        }

        if (connectorId !== "walletConnect" && !hasInjectedWalletProvider()) {
          throw new Error(getWalletInstallMessage(connectorId));
        }

        const targetConnector =
          connectors.find((item) => item.id === connectorId) ??
          connectors.find((item) => item.id === "metaMask") ??
          connectors[0];
        if (!targetConnector) {
          throw new Error("사용 가능한 지갑 연결 방식을 찾을 수 없습니다.");
        }

        const result = await connectAsync({ connector: targetConnector });
        walletAddress = result.accounts[0];
        walletType = targetConnector.name;
        walletChainId = result.chainId ?? sepolia.id;
        setWalletConnectingLabel("지갑 연결이 확인되었습니다. 지갑에서 서명 요청을 승인하세요.");
      }

      if (!walletAddress) {
        throw new Error("지갑 주소를 확인할 수 없습니다.");
      }

      const challenge = await apiRequest<{
        address: string;
        message: string;
        nonce: string;
        expires_at: string;
      }>("/wallets/connect/challenge/", {
        method: "POST",
        auth: true,
        body: { address: walletAddress },
      });

      const signature = await signMessageAsync({ message: challenge.message });

      await apiRequest("/wallets/connect/verify/", {
        method: "POST",
        auth: true,
        body: {
          address: walletAddress,
          signature,
          chain_id: walletChainId,
          wallet_type: walletType,
        },
      });

      setWalletConnectModalOpen(false);
      await refreshMe();
      await refreshWalletSummary({ silent: true });
      openToast("지갑이 연결되었습니다.");
    } catch (error) {
      let message = error instanceof Error ? error.message : "지갑 연결 중 오류가 발생했습니다.";
      if (message.includes("Provider not found")) {
        message = getWalletInstallMessage(connectorId);
      }
      if (
        message.includes("wallet_requestPermissions") ||
        message.includes("already pending") ||
        message.includes("-32002")
      ) {
        message = "이미 MetaMask 승인창이 열려 있습니다. MetaMask 확장 창을 먼저 처리한 뒤 다시 시도하세요.";
      }
      openToast(message);
    } finally {
      setWalletConnecting(false);
      setWalletConnectingLabel("");
    }
  }

  function handleConnectWallet() {
    if (!hasAuthSession) {
      setModal("loginChoice");
      openToast("로그인 후 지갑을 연결할 수 있습니다.");
      return;
    }

    setWalletConnectModalOpen(true);
  }

  async function handleDisconnectWallet() {
    if (!hasAuthSession) return;

    setWalletDisconnecting(true);

    try {
      await apiRequest<{ message: string }>("/wallets/me/", {
        method: "DELETE",
        auth: true,
      });

      if (isConnected) {
        await disconnectAsync();
      }

      await refreshMe();
      await refreshWalletSummary({ silent: true });
      openToast("지갑 연결이 해제되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "지갑 연결 해제 중 오류가 발생했습니다.";
      openToast(message);
    } finally {
      setWalletDisconnecting(false);
    }
  }

  function moveToTab(nextTab: TabName) {
    const tabConfig = tabs.find((tab) => tab.key === nextTab);
    if (tabConfig?.requiresAuth && !hasAuthSession) {
      setModal("loginChoice");
      openToast("로그인 후 이용 가능합니다.");
      return;
    }
    if (nextTab === "mypage" && !hasAuthSession) {
      setModal("loginChoice");
      openToast("로그인 후 마이페이지를 이용할 수 있습니다.");
      return;
    }
    navigateToTab(nextTab);
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
    if (!hasAuthSession) {
      setModal("loginChoice");
      openToast("로그인 후 업로드할 수 있습니다.");
      return;
    }
    if (!phoneVerified) {
      promptPhoneRequired("휴대폰 인증이 필요합니다.");
      return;
    }
    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 저작물 등록을 이용할 수 있습니다.");
      return;
    }
    uploadInputRef.current?.click();
  }

  function triggerVerifyPicker() {
    if (!hasAuthSession) {
      setModal("loginChoice");
      openToast("로그인 후 이용 가능합니다.");
      return;
    }
    if (!phoneVerified) {
      promptPhoneRequired("휴대폰 인증이 필요합니다.");
      return;
    }
    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 저작물 검증을 이용할 수 있습니다.");
      return;
    }
    verifyInputRef.current?.click();
  }

  async function startAnalysis() {
    if (!selectedFile) {
      window.alert("먼저 업로드할 이미지를 선택해주세요.");
      return;
    }
    if (!phoneVerified) {
      promptPhoneRequired("휴대폰 인증이 필요합니다.");
      return;
    }
    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 저작물 등록을 이용할 수 있습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setAnalysisProgress(0);
    setAnalysisStage("running");
    setAnalysisRequestPending(true);
    setAnalysisJobId(null);
    setContentResult(null);
    openToast("등록 가능 여부 분석을 요청했습니다.");

    try {
      const response = await apiRequest<AsyncContentJobResponse>("/contents/register/", {
        method: "POST",
        auth: true,
        body: formData,
      });
      setAnalysisJobId(response.job_id);
      setContentResult(response.content ?? null);
    } catch (error) {
      setAnalysisStage("ready");
      setAnalysisProgress(0);
      setAnalysisRequestPending(false);
      window.alert(error instanceof Error ? error.message : "등록 가능 여부 확인에 실패했습니다.");
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
    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 저작물 검증을 이용할 수 있습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("file", verifyFile);

    setVerifyProgress(0);
    setVerifyRunning(true);
    setVerifyJobId(null);
    setVerifyResult(null);
    openToast("저작물 검증을 요청했습니다.");

    try {
      const response = await apiRequest<AsyncVerifyJobResponse>("/contents/verify/", {
        method: "POST",
        auth: true,
        body: formData,
      });
      setVerifyJobId(response.job_id);
    } catch (error) {
      setVerifyProgress(0);
      setVerifyRunning(false);
      window.alert(error instanceof Error ? error.message : "저작물 검증에 실패했습니다.");
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
    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 서비스를 이용할 수 있습니다.");
      return;
    }

    if (contentResult.watermark?.applied && contentResult.watermark_file_url) {
      setAnalysisStage("watermarked");
      return;
    }

    setAnalysisStage("watermarking");
    setWatermarkProgress(0);
    setWatermarkRequestPending(true);
    setWatermarkJobId(null);
    openToast("워터마크 삽입을 요청했습니다.");

    try {
      const response = await apiRequest<AsyncContentJobResponse>(
        `/contents/${contentResult.public_id}/watermark/`,
        {
          method: "POST",
          auth: true,
        },
      );
      setWatermarkJobId(response.job_id);
      setContentResult(response.content ?? contentResult);
    } catch (error) {
      setAnalysisStage("allow");
      setWatermarkProgress(0);
      setWatermarkRequestPending(false);
      window.alert(error instanceof Error ? error.message : "워터마크 삽입에 실패했습니다.");
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
    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 서비스를 이용할 수 있습니다.");
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
    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 서비스를 이용할 수 있습니다.");
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
      await refreshWalletSummary({ silent: true });
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

  async function castHistoryReviewVote(item: HistoryItem, choice: "yes" | "no") {
    if (historyVoteSubmitting) {
      openToast("이미 투표 요청을 처리 중입니다.");
      return;
    }

    if (!hasAuthSession) {
      setModal("loginChoice");
      openToast("로그인 후 투표할 수 있습니다.");
      return;
    }

    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 투표할 수 있습니다.");
      return;
    }

    if (!walletSummary.vote_eligible) {
      openToast(`투표 참여는 최소 ${walletSummary.vote_minimum} NFT 보유 후 가능합니다.`);
      return;
    }

    if (!connectedWalletAddress || !isConnected) {
      setWalletConnectModalOpen(true);
      openToast("투표하려면 연결된 지갑이 필요합니다.");
      return;
    }

    if (!user?.wallet_address || user.wallet_address.toLowerCase() !== connectedWalletAddress.toLowerCase()) {
      openToast("서비스에 연동된 지갑과 현재 연결된 지갑이 다릅니다. 같은 지갑으로 다시 연결하세요.");
      return;
    }

    const tokenId = item.blockchain?.token_id;
    const contractAddress = item.blockchain?.contract_address;
    const chainId = item.blockchain?.chain_id ?? sepolia.id;

    if (tokenId === null || tokenId === undefined || !contractAddress) {
      openToast("투표 대상의 블록체인 정보가 부족합니다. 새로고침 후 다시 시도하세요.");
      return;
    }

    if (!walletClient || !publicClient) {
      openToast("지갑 클라이언트를 확인할 수 없습니다. 다시 연결 후 시도하세요.");
      return;
    }

    setHistoryVoteSubmitting(true);

    try {
      if (currentWalletChainId !== chainId) {
        await switchChainAsync({ chainId });
      }

      const estimatedGas = await estimateContractGas(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: watsonNftAbi,
        functionName: "voteForDocument",
        args: [BigInt(tokenId), choice === "yes"],
        account: connectedWalletAddress as `0x${string}`,
      });

      const hash = await writeContract(walletClient, {
        address: contractAddress as `0x${string}`,
        abi: watsonNftAbi,
        functionName: "voteForDocument",
        args: [BigInt(tokenId), choice === "yes"],
        account: connectedWalletAddress as `0x${string}`,
        gas: (estimatedGas * 12n) / 10n,
      });

      await waitForTransactionReceipt(publicClient, { hash });

      await apiRequest<RegisteredContentResponse>(`/contents/${item.id}/review-vote/`, {
        method: "GET",
        auth: true,
      });
      await loadHistoryEntries({ silent: true });
      openToast(choice === "yes" ? "찬성 투표가 기록되었습니다." : "반대 투표가 기록되었습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "투표 참여 중 오류가 발생했습니다.";
      const normalizedMessage =
        message.includes("gas limit too high")
          ? "지갑이 과도한 가스 한도를 설정해 투표에 실패했습니다. 다시 시도해주세요."
          : message.includes("Already voted")
            ? "이미 이 투표에 참여했습니다."
            : message.includes("Voting time ended")
              ? "투표가 종료되어 더 이상 참여할 수 없습니다."
              : message.includes("Voting not active")
                ? "현재 진행 중인 투표가 아닙니다."
                : message;
      openToast(normalizedMessage);
      throw error;
    } finally {
      setHistoryVoteSubmitting(false);
    }
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
          <HomePage
            systemCards={systemCards}
            activities={recentActivities}
            onMoveTab={moveToTab}
            onCastReviewVote={castHistoryReviewVote}
            reviewVoteSubmitting={historyVoteSubmitting}
          />
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
            recentUploads={ongoingVoteUploads}
            onOpenOngoingVote={openOngoingVoteHistory}
            onPickFile={handlePickFile}
            onTriggerPicker={triggerFilePicker}
            onStartAnalysis={startAnalysis}
            onResetToHome={() => {
              setSelectedFile(null);
              navigateToTab("home");
            }}
            onResetToReady={() => {
              setAnalysisStage("ready");
              setAnalysisProgress(0);
              setAnalysisRequestPending(false);
              setAnalysisJobId(null);
              setReviewVoteProgress(0);
              setReviewVoteRequestPending(false);
              setReviewConsentModalOpen(false);
              setReviewConsentNotifyByEmail(false);
              setReviewConsentOpenedAt(null);
              setReviewVoteModalOpen(false);
              setReviewVoteDraft(null);
              setWatermarkProgress(0);
              setWatermarkRequestPending(false);
              setWatermarkJobId(null);
              setMintProgress(0);
              setMintRequestPending(false);
              setContentResult(null);
            }}
            onSelectAnother={() => {
              setSelectedFile(null);
              setPreviewUrl("");
              setAnalysisStage("idle");
              setAnalysisProgress(0);
              setAnalysisRequestPending(false);
              setAnalysisJobId(null);
              setReviewVoteProgress(0);
              setReviewVoteRequestPending(false);
              setReviewConsentModalOpen(false);
              setReviewConsentNotifyByEmail(false);
              setReviewConsentOpenedAt(null);
              setReviewVoteModalOpen(false);
              setReviewVoteDraft(null);
              setWatermarkProgress(0);
              setWatermarkRequestPending(false);
              setWatermarkJobId(null);
              setMintProgress(0);
              setMintRequestPending(false);
              setContentResult(null);
              triggerFilePicker();
            }}
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
                setReviewConsentNotifyByEmail(false);
                setReviewConsentOpenedAt(Date.now());
                setReviewConsentModalOpen(true);
                return;
              }
              if (registerResult) openToast(registerResult.primaryAction);
            }}
            onDownloadWatermarked={() => {
              const watermarkFileUrl = contentResult?.watermark_file_url;
              if (watermarkFileUrl) {
                void (async () => {
                  await saveFileWithPicker(
                    watermarkFileUrl,
                    buildWatermarkedFileName(selectedFile?.name || contentResult.original_filename || "watermarked.jpg"),
                  );
                  openToast("이미지 다운로드에 성공했습니다.");
                })();
                return;
              }
              openToast("워터마크 결과 파일이 아직 준비되지 않았습니다.");
            }}
            onMoveToHistory={() => navigateToTab("history")}
            onCopyVerificationUrl={() => {
              const historyLink = buildHistoryEntryUrl(contentResult?.public_id || "");
              void navigator.clipboard.writeText(historyLink);
              openToast("URL 복사가 완료되었습니다.");
            }}
            uploadInputRef={uploadInputRef}
            formatFileSize={formatFileSize}
            reviewVoteProgress={reviewVoteProgress}
            emailVerified={emailVerified}
            emailAddress={user?.email || "-"}
            reviewConsentModalOpen={reviewConsentModalOpen}
            reviewConsentNotifyByEmail={reviewConsentNotifyByEmail}
            reviewConsentEndAtLabel={formatReviewVoteEndAt(reviewConsentOpenedAt ?? Date.now())}
            watermarkProgress={watermarkProgress}
            mintProgress={mintProgress}
            reviewVoteDraft={reviewVoteDraft}
            reviewVoteModalOpen={reviewVoteModalOpen}
            onCloseReviewConsentModal={() => setReviewConsentModalOpen(false)}
            onToggleReviewConsentNotify={() => {
              if (!emailVerified) return;
              setReviewConsentNotifyByEmail((current) => !current);
            }}
            onConfirmReviewConsent={() => {
              setReviewConsentModalOpen(false);
              void startReviewVote();
            }}
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
            recentItems={ongoingVoteVerifyItems}
            onOpenOngoingVote={openOngoingVoteHistory}
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
              setVerifyJobId(null);
              setVerifyResult(null);
            }}
          />
        ) : null}

        {activeTab === "history" ? (
          <HistoryPage
            items={filteredHistory}
            historyFilter={historyFilter}
            onFilterChange={setHistoryFilter}
            onOpenToast={openToast}
            onCastReviewVote={castHistoryReviewVote}
            reviewVoteSubmitting={historyVoteSubmitting}
            initialExpandedId={historyEntryFromUrl}
            initialDetailType={historyDetailTypeFromUrl}
          />
        ) : null}

        {activeTab === "mypage" ? (
          <MyPage
            displayName={displayName || "VeriMarka 사용자"}
            profileEmail={profileEmail}
            profilePhone={profilePhone}
            lastLoginLabel={lastLoginLabel}
            avatarInitial={avatarInitial}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            walletAddress={linkedWalletAddress}
            walletNetworkLabel={walletNetworkLabel}
            walletTypeLabel={walletTypeLabel}
            nftCount={walletSummary.nft_count}
            voteMinimum={walletSummary.vote_minimum}
            voteEligible={walletSummary.vote_eligible}
            walletSummaryLoading={walletSummaryLoading}
            walletConnecting={walletConnecting}
            walletDisconnecting={walletDisconnecting}
            onOpenProfileEdit={() => setProfileEditOpen(true)}
            onOpenPhoneIdentity={() => setPhoneVerificationModalOpen(true)}
            onOpenEmailIdentity={() => setEmailVerificationModalOpen(true)}
            onLogout={handleLogout}
            onOpenWithdraw={() => setWithdrawOpen(true)}
            onConnectWallet={handleConnectWallet}
            onDisconnectWallet={handleDisconnectWallet}
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

      <WalletConnectModal
        open={walletConnectModalOpen}
        connectors={connectors.filter(
          (connector) =>
            connector.id === "metaMask" ||
            connector.id === "rabby" ||
            connector.id === "trustWallet" ||
            connector.id === "walletConnect",
        )}
        walletConnectEnabled={walletConnectEnabled}
        connecting={walletConnecting}
        connectingLabel={walletConnectingLabel}
        onClose={() => setWalletConnectModalOpen(false)}
        onSelectConnector={(connector) => {
          void connectWalletWithConnector(connector.id);
        }}
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
          navigateToTab("mypage");
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
        toastId={toast.id}
        open={toast.open}
        message={toast.message}
        duration={toast.duration}
        onClose={closeToast}
      />
    </div>
  );
}
