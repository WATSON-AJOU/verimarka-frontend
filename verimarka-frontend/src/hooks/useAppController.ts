import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccount, useChainId, useConnect, useDisconnect, usePublicClient, useSignMessage, useSwitchChain, useWalletClient } from "wagmi";
import type { Connector } from "wagmi";
import { createWalletClient, custom, type EIP1193Provider, type WalletClient } from "viem";
import { useAuth, type MeResponse } from "./useAuth";
import { resultConfig, systemCards, tabs } from "../lib/mockData";
import { AUTH_REFRESH_FAILED_EVENT, AUTH_REFRESH_SUCCESS_EVENT, apiRequest, authenticatedFetch, streamAuthenticatedJsonEvents } from "../lib/api";
import { appLogger } from "../lib/logger";
import { getDefaultOrganizationSchema, getDefaultWebsiteSchema, useSeo } from "../lib/seo";
import { getLocalizedSeoCopy } from "../lib/app-seo";
import {
  AUTO_LOGOUT_IDLE_MS,
  buildTabPath,
  buildWatermarkedFileName,
  formatFileSize,
  formatLastLogin,
  formatPhoneNumber,
  formatReviewVoteEndAt,
  getCurrentLocale,
  getDefaultUploadContentType,
  formatWalletAddress,
  getInitial,
  getMimeTypeFromFileName,
  getTabFromPath,
  getWalletInstallMessage,
  getWalletNetworkLabel,
  isSupportedUploadFile,
  LOADING_RING_DURATION_MS,
  LOADING_RING_MAX_PENDING_PROGRESS,
  POST_LOGOUT_TOAST_KEY,
  SUSPENDED_ACCOUNT_MESSAGE,
} from "../lib/app-utils";
import { getAccessToken } from "../lib/token";
import {
  isMetaMaskConnectorId,
  logConnectorProviderSnapshot,
  normalizeWalletConnectorId,
  waitForConnectorProvider,
  walletChain,
  walletConnectEnabled,
} from "../lib/wallet";
import type {
  ActivityItem,
  AnalysisJobStatusResponse,
  AnalysisResult,
  AnalysisStage,
  AsyncContentJobResponse,
  AsyncVerifyJobResponse,
  HistoryAllowResumePayload,
  HistoryItem,
  ModalType,
  RegisteredContentResponse,
  ReviewVoteCastResponse,
  ReviewVoteSigningResponse,
  TabName,
  VerifyHistoryItem,
  VerifyResultResponse,
  UploadHistoryItem,
  WalletSummaryResponse,
} from "../types/app";

const REGISTER_DECISIONS = new Set<AnalysisResult>(["verified", "allow", "review", "block", "failed"]);

function isRegisterDecision(value: string | null | undefined): value is AnalysisResult {
  return Boolean(value && REGISTER_DECISIONS.has(value as AnalysisResult));
}

function getDefaultWalletSummary(user?: MeResponse | null): WalletSummaryResponse {
  return {
    connected: Boolean(user?.wallet_address),
    address: user?.wallet_address ?? null,
    chain_id: user?.wallet_chain_id ?? null,
    wallet_type: user?.wallet_type ?? "",
    network_name: "Polygon",
    nft_count: null,
    vote_minimum: 3,
    vote_eligible: false,
    lookup_status: user?.wallet_address ? "failed" : "not_connected",
    lookup_error: user?.wallet_address ? "NFT 보유 수량을 조회하지 못했습니다. 잠시 후 다시 시도해주세요." : null,
  };
}

function getJobProgress(response: AnalysisJobStatusResponse, fallback = 0) {
  if (response.status === "success") return 100;
  if (typeof response.progress !== "number" || Number.isNaN(response.progress)) return fallback;
  return Math.max(0, Math.min(response.progress, 100));
}

function hasWatermarkArtifact(content: RegisteredContentResponse | null | undefined) {
  return Boolean(content?.watermark?.applied && (content.watermark_file_url || content.watermark.output_url));
}

function hasMintedContent(content: RegisteredContentResponse | null | undefined) {
  const blockchain = content?.blockchain;
  return Boolean(
    blockchain?.mint_kind === "content" &&
      blockchain.minted &&
      blockchain.tx_hash &&
      blockchain.token_id !== null &&
      typeof blockchain.token_id !== "undefined" &&
      blockchain.token_id !== 0 &&
      blockchain.token_id !== "0",
  );
}

const MAX_JOB_POLL_FAILURES = 3;

export function useAppController() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
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
  const [phoneVerificationError, setPhoneVerificationError] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailCodeInput, setEmailCodeInput] = useState("");
  const [emailTimer, setEmailTimer] = useState(0);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState("");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadContentType, setUploadContentType] = useState<"image" | "document">("image");
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("idle");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisProgressMessage, setAnalysisProgressMessage] = useState("");
  const [, setAnalysisRequestPending] = useState(false);
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [reviewVoteProgress, setReviewVoteProgress] = useState(0);
  const [reviewVoteRequestPending, setReviewVoteRequestPending] = useState(false);
  const [reviewVoteModalOpen, setReviewVoteModalOpen] = useState(false);
  const [reviewConsentModalOpen, setReviewConsentModalOpen] = useState(false);
  const [reviewConsentNotifyByEmail, setReviewConsentNotifyByEmail] = useState(false);
  const [reviewConsentOpenedAt, setReviewConsentOpenedAt] = useState<number | null>(null);
  const [reviewConsentFallbackOpenedAt] = useState(() => Date.now());
  const [reviewVoteDraft, setReviewVoteDraft] = useState<{
    contentId: string;
    upvotes: number;
    downvotes: number;
    participantCount: number;
    votedChoice: "yes" | "no" | null;
  } | null>(null);
  const [watermarkProgress, setWatermarkProgress] = useState(0);
  const [watermarkProgressMessage, setWatermarkProgressMessage] = useState("");
  const [, setWatermarkRequestPending] = useState(false);
  const [watermarkJobId, setWatermarkJobId] = useState<string | null>(null);
  const [registerFlowError, setRegisterFlowError] = useState<{
    message: string;
    retryAction: "analysis" | "watermark" | "review";
  } | null>(null);
  const [mintProgress, setMintProgress] = useState(0);
  const [mintRequestPending, setMintRequestPending] = useState(false);
  const [mintErrorMessage, setMintErrorMessage] = useState("");
  const [contentResult, setContentResult] = useState<RegisteredContentResponse | null>(null);

  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyContentType, setVerifyContentType] = useState<"image" | "document">("image");
  const [verifyPreviewUrl, setVerifyPreviewUrl] = useState("");
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyProgressMessage, setVerifyProgressMessage] = useState("");
  const [verifyRunning, setVerifyRunning] = useState(false);
  const [verifyJobId, setVerifyJobId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResultResponse | null>(null);
  const [verifyRequestedAt, setVerifyRequestedAt] = useState<number | null>(null);
  const [verifyFlowError, setVerifyFlowError] = useState("");

  const [historyFilter, setHistoryFilter] = useState<"all" | "allow" | "block" | "review" | "verify">("all");
  const [historyEntries, setHistoryEntries] = useState<HistoryItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [ongoingVoteUploads, setOngoingVoteUploads] = useState<UploadHistoryItem[]>([]);
  const [ongoingVoteVerifyItems, setOngoingVoteVerifyItems] = useState<VerifyHistoryItem[]>([]);

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
    network_name: "Polygon",
    nft_count: null,
    vote_minimum: 3,
    vote_eligible: false,
    lookup_status: "not_connected",
    lookup_error: null,
  });
  const [walletSummaryLoading, setWalletSummaryLoading] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const verifyInputRef = useRef<HTMLInputElement | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const walletClientRef = useRef(walletClient);
  const publicClientRef = useRef(publicClient);
  const fallbackWalletClientRef = useRef<WalletClient | null>(null);
  const analysisPollFailureCountRef = useRef(0);
  const watermarkPollFailureCountRef = useRef(0);
  const verifyPollFailureCountRef = useRef(0);

  const routeLocale = useMemo(() => getCurrentLocale(location.pathname), [location.pathname]);
  const phoneVerified = Boolean(user?.phone_verified);
  const emailVerified = Boolean(user?.email_verified);
  const activeTab = useMemo(() => getTabFromPath(location.pathname), [location.pathname]);
  const appSeo = useMemo(() => getLocalizedSeoCopy(i18n.resolvedLanguage || i18n.language || "ko", activeTab), [activeTab, i18n.language, i18n.resolvedLanguage]);

  useSeo({
    title: appSeo.title,
    description: appSeo.description,
    path: location.pathname,
    locale: appSeo.locale,
    robots: activeTab === "history" || activeTab === "mypage" ? "noindex, nofollow" : undefined,
    alternateGroup: activeTab === "home" ? "home" : activeTab === "add" ? "register" : activeTab === "verify" ? "verify" : undefined,
    structuredData: [getDefaultOrganizationSchema(), getDefaultWebsiteSchema()],
  });

  const historyEntryFromUrl = useMemo(() => new URLSearchParams(location.search).get("entry"), [location.search]);
  const historyDetailTypeFromUrl = useMemo<"allow" | "verified" | "review" | "block" | null>(() => {
    const value = new URLSearchParams(location.search).get("detail");
    if (value === "allow" || value === "verified" || value === "review" || value === "block") return value;
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
  const verifyUserLabel = user?.nickname || user?.display_name || user?.username || "게스트";
  const walletModalConnectors = useMemo(() => {
    const visibleConnectors = connectors.filter(
      (connector) =>
        isMetaMaskConnectorId(connector.id) ||
        connector.id === "rabby" ||
        connector.id === "trustWallet" ||
        connector.id === "walletConnect",
    );

    return visibleConnectors.filter((connector, index, array) => {
      const normalizedConnectorId = normalizeWalletConnectorId(connector.id) || connector.id;
      return array.findIndex((item) => (normalizeWalletConnectorId(item.id) || item.id) === normalizedConnectorId) === index;
    });
  }, [connectors]);

  const navigateToTab = useCallback((nextTab: TabName, options?: { replace?: boolean; search?: string }) => {
    navigate(
      {
        pathname: buildTabPath(nextTab, { locale: routeLocale }),
        search: options?.search ?? "",
      },
      { replace: options?.replace ?? false },
    );
  }, [navigate, routeLocale]);

  function hardNavigateToTab(nextTab: TabName, options?: { search?: string }) {
    const nextPath = buildTabPath(nextTab, { ...options, locale: routeLocale });
    const currentPath = `${window.location.pathname}${window.location.search}`;

    if (currentPath === nextPath) {
      window.location.reload();
      return;
    }

    window.location.assign(nextPath);
  }

  const openToast = useCallback((message: string, duration = 3000) => {
    setToast((current) => ({
      id: current.id + 1,
      open: true,
      message,
      duration,
    }));
  }, []);

  function closeToast() {
    setToast((current) => ({ ...current, open: false }));
  }

  function openOngoingVoteHistory(entryId: string) {
    navigateToTab("history", { search: `?entry=${encodeURIComponent(entryId)}&detail=review` });
  }

  const refreshWalletSummary = useCallback(async (options?: { silent?: boolean }) => {
    if (!hasAuthSession) {
      setWalletSummary({
        connected: false,
        address: null,
        chain_id: null,
        wallet_type: "",
        network_name: "Polygon",
        nft_count: null,
        vote_minimum: 3,
        vote_eligible: false,
        lookup_status: "not_connected",
        lookup_error: null,
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
      setWalletSummary(getDefaultWalletSummary(user));
    } finally {
      if (!options?.silent) {
        setWalletSummaryLoading(false);
      }
    }
  }, [hasAuthSession, user]);

  async function createFallbackWalletClient(options?: { connector?: Connector | null; account?: string | null }): Promise<WalletClient | null> {
    const connector = options?.connector ?? connectedConnector;
    const account = options?.account ?? connectedWalletAddress;
    if (!connector || !account) return null;

    try {
      const provider = await connector.getProvider();
      if (!provider || typeof provider !== "object" || !("request" in provider)) return null;

      const client = createWalletClient({
        account: account as `0x${string}`,
        chain: walletChain,
        transport: custom(provider as EIP1193Provider),
      });
      fallbackWalletClientRef.current = client;
      appLogger.info("wallet.fallback_client_created", {
        connectorId: connector.id,
        account,
      });
      return client;
    } catch (error) {
      appLogger.warn("wallet.fallback_client_failed", {
        connectorId: connector.id,
        account,
        error,
      });
      return null;
    }
  }

  async function resolveConnectorChainId(connector?: Connector | null): Promise<number | null> {
    const targetConnector = connector ?? connectedConnector;
    if (!targetConnector) return null;

    try {
      const provider = await targetConnector.getProvider();
      if (!provider || typeof provider !== "object" || !("request" in provider)) return null;

      const chainIdValue = await (provider as EIP1193Provider).request({ method: "eth_chainId" });
      if (typeof chainIdValue === "string") {
        return chainIdValue.startsWith("0x") ? Number.parseInt(chainIdValue, 16) : Number.parseInt(chainIdValue, 10);
      }
      if (typeof chainIdValue === "number") return chainIdValue;
      return null;
    } catch (error) {
      appLogger.warn("wallet.resolve_chain_id_failed", {
        connectorId: targetConnector.id,
        error,
      });
      return null;
    }
  }

  async function getConnectedWalletProvider(connector?: Connector | null): Promise<EIP1193Provider | null> {
    const targetConnector = connector ?? connectedConnector;
    if (!targetConnector) return null;

    try {
      const provider = await targetConnector.getProvider();
      if (!provider || typeof provider !== "object" || !("request" in provider)) return null;
      return provider as EIP1193Provider;
    } catch (error) {
      appLogger.warn("wallet.resolve_provider_failed", {
        connectorId: targetConnector.id,
        error,
      });
      return null;
    }
  }

  async function promptWatchMintedAsset(response: RegisteredContentResponse) {
    const blockchain = response.blockchain;
    if (!blockchain?.minted || blockchain.mint_kind !== "content") {
      return false;
    }

    const contractAddress = blockchain.contract_address?.trim();
    const tokenIdValue = blockchain.token_id;
    const tokenId = typeof tokenIdValue === "number" ? String(tokenIdValue) : typeof tokenIdValue === "string" ? tokenIdValue.trim() : "";
    const targetChainId = blockchain.chain_id ?? walletChain.id;
    const targetAddress = (blockchain.recipient_address || blockchain.owner_address || "").trim().toLowerCase();
    const connectedAddress = connectedWalletAddress?.trim().toLowerCase() || "";

    if (!contractAddress || !tokenId) {
      appLogger.info("wallet.watch_asset.skipped_missing_metadata", {
        publicId: response.public_id,
        contractAddress: contractAddress ?? null,
        tokenId: tokenId || null,
      });
      return false;
    }

    if (!connectedAddress || (targetAddress && targetAddress !== connectedAddress)) {
      appLogger.info("wallet.watch_asset.skipped_wallet_mismatch", {
        publicId: response.public_id,
        targetAddress: targetAddress || null,
        connectedAddress: connectedAddress || null,
      });
      return false;
    }

    let providerChainId = (await resolveConnectorChainId()) ?? currentWalletChainId ?? null;
    if (providerChainId !== targetChainId) {
      appLogger.info("wallet.watch_asset.switch_chain_required", {
        publicId: response.public_id,
        providerChainId,
        targetChainId,
      });

      try {
        await switchChainAsync({ chainId: targetChainId });
      } catch (switchError) {
        appLogger.warn("wallet.watch_asset.switch_chain_failed", {
          publicId: response.public_id,
          providerChainId,
          targetChainId,
          switchError,
        });
        openToast(`${getWalletNetworkLabel(targetChainId)} 네트워크로 전환한 뒤 NFT 추가를 다시 시도해주세요.`);
        return false;
      }

      providerChainId = (await resolveConnectorChainId()) ?? currentWalletChainId ?? null;
      if (providerChainId !== targetChainId) {
        appLogger.info("wallet.watch_asset.skipped_chain_mismatch", {
          publicId: response.public_id,
          providerChainId,
          targetChainId,
        });
        openToast(`${getWalletNetworkLabel(targetChainId)} 네트워크로 전환한 뒤 NFT 추가를 다시 시도해주세요.`);
        return false;
      }
    }

    const provider = await getConnectedWalletProvider();
    if (!provider) {
      appLogger.info("wallet.watch_asset.skipped_provider_missing", {
        publicId: response.public_id,
      });
      return false;
    }

    try {
      const providerRequest = provider.request as (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
      const result = await providerRequest({
        method: "wallet_watchAsset",
        params: {
          type: "ERC721",
          options: {
            address: contractAddress,
            tokenId,
          },
        },
      });

      const accepted = result === true;
      appLogger.info("wallet.watch_asset.completed", {
        publicId: response.public_id,
        contractAddress,
        tokenId,
        accepted,
      });
      return accepted;
    } catch (error) {
      appLogger.warn("wallet.watch_asset.failed", {
        publicId: response.public_id,
        contractAddress,
        tokenId,
        error,
      });
      return false;
    }
  }

  async function requestReviewVoteSignature(signing: ReviewVoteSigningResponse, choice: "yes" | "no"): Promise<string> {
    const provider = await getConnectedWalletProvider();
    if (!provider) {
      throw new Error("브라우저 지갑 provider를 확인하지 못했습니다. 지갑을 다시 연결한 뒤 투표해주세요.");
    }

    const typedData = {
      domain: signing.domain,
      primaryType: signing.primaryType,
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Vote: signing.types.Vote,
      },
      message: {
        tokenId: signing.token_id,
        isOriginal: choice === "yes",
        voter: signing.voter,
        nonce: signing.nonce,
        deadline: signing.deadline,
      },
    };

    const providerRequest = provider.request as (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    const signature = await providerRequest({
      method: "eth_signTypedData_v4",
      params: [signing.voter, JSON.stringify(typedData)],
    });

    if (typeof signature !== "string" || !signature.startsWith("0x")) {
      throw new Error("지갑 서명 응답을 확인하지 못했습니다.");
    }

    return signature;
  }

  async function waitForWalletClients(timeoutMs = 3000, intervalMs = 150) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const resolvedWalletClient = walletClientRef.current ?? fallbackWalletClientRef.current ?? (await createFallbackWalletClient());

      if (resolvedWalletClient && publicClientRef.current) {
        return {
          walletClient: resolvedWalletClient,
          publicClient: publicClientRef.current,
        };
      }

      await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
    }

    return {
      walletClient: walletClientRef.current ?? fallbackWalletClientRef.current ?? (await createFallbackWalletClient()),
      publicClient: publicClientRef.current ?? null,
    };
  }

  function triggerDirectDownload(url: string, fileName: string) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
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

    const response = await authenticatedFetch(url);
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
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        throw new Error("다운로드 파일을 불러오지 못했습니다.");
      }

      const blob = await response.blob();
      const handle = await picker({
        suggestedName: fileName,
        types: [
          {
            description: "VeriMarka file",
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

  async function getCurrentUserForProtectedAction() {
    if (!hasAuthSession) {
      setModal("loginChoice");
      return null;
    }

    if (!loading && user) {
      return user;
    }

    return await refreshMe();
  }

  async function ensureProtectedActionReady(options: { phoneMessage: string; walletMessage: string }) {
    const currentUser = await getCurrentUserForProtectedAction();
    if (!currentUser) return null;

    if (!currentUser.phone_verified) {
      promptPhoneRequired(options.phoneMessage);
      return null;
    }

    if (!currentUser.wallet_address) {
      promptWalletRequired(options.walletMessage);
      return null;
    }

    return currentUser;
  }

  useEffect(() => {
    walletClientRef.current = walletClient;
    if (walletClient) {
      fallbackWalletClientRef.current = null;
    }
  }, [walletClient]);

  useEffect(() => {
    publicClientRef.current = publicClient;
  }, [publicClient]);

  useEffect(() => {
    fallbackWalletClientRef.current = null;
  }, [connectedConnector?.id, connectedWalletAddress, currentWalletChainId]);

  useEffect(() => {
    appLogger.info("wallet.state_changed", {
      isConnected,
      connectedWalletAddress: connectedWalletAddress ?? null,
      connectorId: connectedConnector?.id ?? null,
      connectorName: connectedConnector?.name ?? null,
      currentWalletChainId,
      hasWalletClient: Boolean(walletClient),
      hasPublicClient: Boolean(publicClient),
      linkedWalletAddress: user?.wallet_address ?? null,
    });
  }, [isConnected, connectedWalletAddress, connectedConnector, currentWalletChainId, walletClient, publicClient, user?.wallet_address]);

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
    const timer = window.setTimeout(() => {
      setPhoneInput(user?.phone ?? "");
      setEmailInput(user?.email ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [phoneVerificationModalOpen, emailVerificationModalOpen, user?.phone, user?.email]);

  useEffect(() => {
    const postLogoutToast = window.sessionStorage.getItem(POST_LOGOUT_TOAST_KEY);
    if (!postLogoutToast) return;

    window.sessionStorage.removeItem(POST_LOGOUT_TOAST_KEY);
    const timer = window.setTimeout(() => openToast(postLogoutToast, 3000), 0);
    return () => window.clearTimeout(timer);
  }, [openToast]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const legacyTab = params.get("tab");
    if (!hasAuthSession || legacyTab !== "history" || location.pathname !== "/") return;

    const entry = params.get("entry");
    navigateToTab("history", {
      replace: true,
      search: entry ? `?entry=${encodeURIComponent(entry)}` : "",
    });
  }, [hasAuthSession, location.pathname, location.search, navigateToTab]);

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
  }, [navigateToTab, openToast]);

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
        void logout();
        navigateToTab("home", { replace: true });
        setModal("none");
        setSelectedFile(null);
        setVerifyFile(null);
        setContentResult(null);
        setVerifyResult(null);
        setVerifyRequestedAt(null);
        openToast("30분 동안 활동이 없어 자동 로그아웃되었습니다.");
      }, AUTO_LOGOUT_IDLE_MS);
    };

    const activityEvents: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

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
  }, [hasAuthSession, logout, navigateToTab, openToast]);

  useEffect(() => {
    if (!selectedFile) {
      const timer = window.setTimeout(() => {
        setPreviewUrl("");
        setUploadContentType("image");
        setAnalysisStage("idle");
        setAnalysisProgress(0);
        setAnalysisJobId(null);
        setReviewVoteProgress(0);
        setReviewVoteModalOpen(false);
        setReviewVoteDraft(null);
        setWatermarkProgress(0);
        setRegisterFlowError(null);
        setMintProgress(0);
        setContentResult(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    const timer = window.setTimeout(() => {
      setPreviewUrl(objectUrl);
      setAnalysisStage("ready");
      setAnalysisProgress(0);
      setReviewVoteProgress(0);
      setWatermarkProgress(0);
      setMintProgress(0);
      setRegisterFlowError(null);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!contentResult?.public_id || contentResult.decision !== "review") {
      const timer = window.setTimeout(() => setReviewVoteModalOpen(false), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
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
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    contentResult?.public_id,
    contentResult?.decision,
    contentResult?.blockchain?.vote?.upvotes,
    contentResult?.blockchain?.vote?.downvotes,
    contentResult?.blockchain?.vote?.participant_count,
  ]);

  useEffect(() => {
    if (!verifyFile) {
      const timer = window.setTimeout(() => {
        setVerifyPreviewUrl("");
        setVerifyContentType("image");
        setVerifyProgress(0);
        setVerifyRunning(false);
        setVerifyJobId(null);
        setVerifyResult(null);
        setVerifyRequestedAt(null);
        setVerifyFlowError("");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const objectUrl = URL.createObjectURL(verifyFile);
    const timer = window.setTimeout(() => {
      setVerifyPreviewUrl(objectUrl);
      setVerifyProgress(0);
      setVerifyRunning(false);
      setVerifyResult(null);
      setVerifyFlowError("");
    }, 0);

    return () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
    };
  }, [verifyFile]);

  useEffect(() => {
    if (!hasAuthSession) {
      const timer = window.setTimeout(() => {
        setWalletSummary({
          connected: false,
          address: null,
          chain_id: null,
          wallet_type: "",
          network_name: "Polygon",
          nft_count: null,
          vote_minimum: 3,
          vote_eligible: false,
          lookup_status: "not_connected",
          lookup_error: null,
        });
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      void refreshWalletSummary();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasAuthSession, refreshWalletSummary]);

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
    if (analysisStage !== "running" || !analysisJobId) return;

    const controller = new AbortController();
    void streamAuthenticatedJsonEvents<AnalysisJobStatusResponse>(`/analysis/jobs/${analysisJobId}/stream/`, {
      signal: controller.signal,
      onEvent: (response) => {
        analysisPollFailureCountRef.current = 0;
        setAnalysisProgress((current) => getJobProgress(response, current));
        setAnalysisProgressMessage(response.progress_message || "");

        if (response.status === "success" && response.content) {
          const resolvedContent = response.content;
          const decision = isRegisterDecision(resolvedContent.decision) ? resolvedContent.decision : "block";

          setContentResult(resolvedContent);
          setAnalysisProgress(100);
          setAnalysisStage(decision);
          setAnalysisRequestPending(false);
          setAnalysisJobId(null);
        }

        if (response.status === "failure") {
          setAnalysisStage("ready");
          setAnalysisProgress(0);
          setAnalysisRequestPending(false);
          setAnalysisJobId(null);
          setRegisterFlowError({
            message: response.error_message || "등록 가능 여부 확인에 실패했습니다. 잠시 후 다시 시도해주세요.",
            retryAction: "analysis",
          });
        }
      },
    }).catch((error) => {
      if (controller.signal.aborted) return;
      appLogger.warn("analysis.job_stream.failed", { jobId: analysisJobId, error });
    });

    return () => controller.abort();
  }, [analysisStage, analysisJobId]);

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

        analysisPollFailureCountRef.current = 0;
        setAnalysisProgress((current) => getJobProgress(response, current));
        setAnalysisProgressMessage(response.progress_message || "");

        if (response.status === "success" && response.content) {
          const resolvedContent = response.content;
          const decision = isRegisterDecision(resolvedContent.decision) ? resolvedContent.decision : "block";

          setContentResult(resolvedContent);
          setAnalysisProgress(100);
          setAnalysisStage(decision);
          setAnalysisRequestPending(false);
          setAnalysisJobId(null);
          return;
        }

        if (response.status === "failure") {
          setAnalysisStage("ready");
          setAnalysisProgress(0);
          setAnalysisRequestPending(false);
          setAnalysisJobId(null);
          setRegisterFlowError({
            message: response.error_message || "등록 가능 여부 확인에 실패했습니다. 잠시 후 다시 시도해주세요.",
            retryAction: "analysis",
          });
        }
      } catch (error) {
        if (cancelled) return;
        analysisPollFailureCountRef.current += 1;
        if (analysisPollFailureCountRef.current >= MAX_JOB_POLL_FAILURES) {
          setAnalysisStage("ready");
          setAnalysisProgress(0);
          setAnalysisRequestPending(false);
          setAnalysisJobId(null);
          setRegisterFlowError({
            message: error instanceof Error ? error.message : "분석 상태를 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.",
            retryAction: "analysis",
          });
        }
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

    const controller = new AbortController();
    void streamAuthenticatedJsonEvents<AnalysisJobStatusResponse>(`/analysis/jobs/${watermarkJobId}/stream/`, {
      signal: controller.signal,
      onEvent: (response) => {
        watermarkPollFailureCountRef.current = 0;
        setWatermarkProgress((current) => getJobProgress(response, current));
        setWatermarkProgressMessage(response.progress_message || "");

        if (response.status === "success" && response.content) {
          const resolvedContent = response.content;
          setContentResult(resolvedContent);
          setWatermarkProgress(100);
          setAnalysisStage(hasWatermarkArtifact(resolvedContent) ? "watermarked" : "allow");
          setWatermarkRequestPending(false);
          setWatermarkJobId(null);
          if (!hasWatermarkArtifact(resolvedContent)) {
            setRegisterFlowError({
              message: "워터마크 처리 결과 파일을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
              retryAction: "watermark",
            });
          }
        }

        if (response.status === "failure") {
          setAnalysisStage("allow");
          setWatermarkProgress(0);
          setWatermarkRequestPending(false);
          setWatermarkJobId(null);
          setRegisterFlowError({
            message: response.error_message || "워터마크 삽입에 실패했습니다. 잠시 후 다시 시도해주세요.",
            retryAction: "watermark",
          });
        }
      },
    }).catch((error) => {
      if (controller.signal.aborted) return;
      appLogger.warn("watermark.job_stream.failed", { jobId: watermarkJobId, error });
    });

    return () => controller.abort();
  }, [analysisStage, watermarkJobId]);

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

        watermarkPollFailureCountRef.current = 0;
        setWatermarkProgress((current) => getJobProgress(response, current));
        setWatermarkProgressMessage(response.progress_message || "");

        if (response.status === "success" && response.content) {
          const resolvedContent = response.content;
          setContentResult(resolvedContent);
          setWatermarkProgress(100);
          setAnalysisStage(hasWatermarkArtifact(resolvedContent) ? "watermarked" : "allow");
          setWatermarkRequestPending(false);
          setWatermarkJobId(null);
          if (!hasWatermarkArtifact(resolvedContent)) {
            setRegisterFlowError({
              message: "워터마크 처리 결과 파일을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
              retryAction: "watermark",
            });
          }
          return;
        }

        if (response.status === "failure") {
          setAnalysisStage("allow");
          setWatermarkProgress(0);
          setWatermarkRequestPending(false);
          setWatermarkJobId(null);
          setRegisterFlowError({
            message: response.error_message || "워터마크 삽입에 실패했습니다. 잠시 후 다시 시도해주세요.",
            retryAction: "watermark",
          });
        }
      } catch (error) {
        if (cancelled) return;
        watermarkPollFailureCountRef.current += 1;
        if (watermarkPollFailureCountRef.current >= MAX_JOB_POLL_FAILURES) {
          setAnalysisStage("allow");
          setWatermarkProgress(0);
          setWatermarkRequestPending(false);
          setWatermarkJobId(null);
          setRegisterFlowError({
            message: error instanceof Error ? error.message : "워터마크 상태를 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.",
            retryAction: "watermark",
          });
        }
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

    const controller = new AbortController();
    void streamAuthenticatedJsonEvents<AnalysisJobStatusResponse>(`/analysis/jobs/${verifyJobId}/stream/`, {
      signal: controller.signal,
      onEvent: (response) => {
        verifyPollFailureCountRef.current = 0;
        setVerifyProgress((current) => getJobProgress(response, current));
        setVerifyProgressMessage(response.progress_message || "");

        if (response.status === "success" && response.result) {
          setVerifyResult(response.result);
          setVerifyProgress(100);
          setVerifyRunning(false);
          setVerifyJobId(null);
        }

        if (response.status === "failure") {
          setVerifyProgress(0);
          setVerifyRunning(false);
          setVerifyJobId(null);
          setVerifyFlowError(response.error_message || "저작물 검증에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      },
    }).catch((error) => {
      if (controller.signal.aborted) return;
      appLogger.warn("verify.job_stream.failed", { jobId: verifyJobId, error });
    });

    return () => controller.abort();
  }, [verifyRunning, verifyJobId]);

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

        verifyPollFailureCountRef.current = 0;
        setVerifyProgress((current) => getJobProgress(response, current));
        setVerifyProgressMessage(response.progress_message || "");

        if (response.status === "success" && response.result) {
          setVerifyResult(response.result);
          setVerifyProgress(100);
          setVerifyRunning(false);
          setVerifyJobId(null);
          return;
        }

        if (response.status === "failure") {
          setVerifyProgress(0);
          setVerifyRunning(false);
          setVerifyJobId(null);
          setVerifyFlowError(response.error_message || "저작물 검증에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      } catch (error) {
        if (cancelled) return;
        verifyPollFailureCountRef.current += 1;
        if (verifyPollFailureCountRef.current >= MAX_JOB_POLL_FAILURES) {
          setVerifyProgress(0);
          setVerifyRunning(false);
          setVerifyJobId(null);
          setVerifyFlowError(error instanceof Error ? error.message : "검증 상태를 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.");
        }
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
    if (analysisStage !== "reviewStarting" || !reviewVoteRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(LOADING_RING_MAX_PENDING_PROGRESS, (elapsed / LOADING_RING_DURATION_MS) * LOADING_RING_MAX_PENDING_PROGRESS);
      setReviewVoteProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, reviewVoteRequestPending]);

  useEffect(() => {
    if (analysisStage !== "minting" || !mintRequestPending) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(LOADING_RING_MAX_PENDING_PROGRESS, (elapsed / LOADING_RING_DURATION_MS) * LOADING_RING_MAX_PENDING_PROGRESS);
      setMintProgress(next);
    }, 50);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, mintRequestPending]);

  const refreshReviewVote = useCallback(async (publicId?: string, options?: { silent?: boolean }) => {
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
        return;
      }

      setAnalysisStage("reviewLive");
    } catch (error) {
      if (!options?.silent) {
        setRegisterFlowError({
          message: error instanceof Error ? error.message : "커뮤니티 검증 상태를 불러오지 못했습니다.",
          retryAction: "review",
        });
      }
    }
  }, [contentResult?.public_id]);

  useEffect(() => {
    if (analysisStage !== "reviewLive" || !contentResult?.public_id) return;
    const voteStatus = contentResult.blockchain?.vote?.status;
    if (voteStatus && voteStatus !== "Pending") return;
    const intervalId = window.setInterval(() => {
      void refreshReviewVote(contentResult.public_id, { silent: true });
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, contentResult?.public_id, contentResult?.blockchain?.vote?.status, refreshReviewVote]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await apiRequest<Array<{
          id?: string;
          type?: "allow" | "verified" | "review" | "block" | "verify";
          status: "ALLOW" | "VERIFIED" | "REVIEW" | "BLOCK" | "VERIFY";
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

  const loadHistoryEntries = useCallback(async (options?: { silent?: boolean }) => {
    if (!hasAuthSession) {
      setHistoryEntries([]);
      return;
    }

    try {
      const response = await apiRequest<Array<{
        id: string;
        type: "allow" | "verified" | "review" | "block" | "verify";
        file_name: string;
        summary: string;
        timestamp: string;
        cosine: string;
        phash: string;
        extra: string;
        preview_url?: string | null;
        original_preview_url?: string | null;
        comparison_preview_url?: string | null;
        comparison_file_name?: string;
        comparison_public_id?: string;
        comparison_label?: string;
        download_url?: string | null;
        blockchain?: HistoryItem["blockchain"];
      }>>("/logs/history/?page_size=100", {
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
          originalPreviewUrl: item.original_preview_url ?? item.preview_url ?? null,
          comparisonPreviewUrl: item.comparison_preview_url ?? null,
          comparisonFileName: item.comparison_file_name ?? "",
          comparisonPublicId: item.comparison_public_id ?? "",
          comparisonLabel: item.comparison_label ?? "",
          downloadUrl: item.download_url ?? null,
          blockchain: item.blockchain ?? null,
        })),
      );
    } catch {
      if (!options?.silent) {
        setHistoryEntries([]);
      }
    }
  }, [hasAuthSession]);

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
  }, [activeTab, hasAuthSession, historyEntryFromUrl, loadHistoryEntries]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return historyEntries;
    if (historyFilter === "allow") {
      return historyEntries.filter((item) => item.type === "allow" || item.type === "verified");
    }
    return historyEntries.filter((item) => item.type === historyFilter);
  }, [historyEntries, historyFilter]);

  const registerDecision =
    isRegisterDecision(analysisStage)
      ? analysisStage
      : isRegisterDecision(contentResult?.decision)
        ? contentResult.decision
        : null;

  const registerResult = registerDecision ? resultConfig[registerDecision] : null;

  async function handleLogin(email: string, password: string) {
    try {
      await login(email, password);
      setModal("none");
      openToast("로그인되었습니다. 반갑습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "로그인에 실패했습니다.";
      if (message.includes("사용 정지된 계정입니다.") || message.includes(SUSPENDED_ACCOUNT_MESSAGE)) {
        void logout();
        setModal("none");
        navigateToTab("home", { replace: true });
        openToast(SUSPENDED_ACCOUNT_MESSAGE);
        return;
      }
      throw error;
    }
  }

  async function handleSignup(email: string, nickname: string, password: string, termsAgreed: boolean, privacyAgreed: boolean) {
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
    void logout().finally(() => {
      navigateToTab("home", { replace: true });
      setSelectedFile(null);
      setPhoneVerificationModalOpen(false);
      setEmailVerificationModalOpen(false);
      setPhoneRequiredModalOpen(false);
      setProfileEditOpen(false);
      window.sessionStorage.setItem(POST_LOGOUT_TOAST_KEY, "로그아웃되었습니다.");
      window.location.reload();
    });
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
    setWalletConnectingLabel(
      connectorId === "walletConnect"
        ? "WalletConnect QR 또는 지갑 앱 승인창을 확인하고 연결 요청을 완료하세요."
        : "지갑 승인창을 확인하고 연결 요청을 완료하세요.",
    );

    try {
      const normalizedRequestedConnectorId = normalizeWalletConnectorId(connectorId);
      const normalizedConnectedConnectorId = normalizeWalletConnectorId(connectedConnector?.id);
      let walletAddress = connectedWalletAddress;
      let walletType = normalizedConnectedConnectorId || connectedConnector?.id || connectedConnector?.name || "Injected Wallet";
      let walletChainId = currentWalletChainId ?? walletChain.id;
      const signerSessionMissing = !walletClient;
      const requiresNewConnection =
        !walletAddress ||
        !isConnected ||
        signerSessionMissing ||
        (normalizedRequestedConnectorId && normalizedConnectedConnectorId !== normalizedRequestedConnectorId);

      appLogger.info("wallet.connect.start", {
        requestedConnectorId: connectorId ?? null,
        normalizedRequestedConnectorId: normalizedRequestedConnectorId ?? null,
        isConnected,
        connectedWalletAddress: connectedWalletAddress ?? null,
        connectedConnectorId: connectedConnector?.id ?? null,
        normalizedConnectedConnectorId: normalizedConnectedConnectorId ?? null,
        connectedConnectorName: connectedConnector?.name ?? null,
        currentWalletChainId,
        signerSessionMissing,
        requiresNewConnection,
      });
      logConnectorProviderSnapshot(connectorId);

      if (requiresNewConnection) {
        if (connectorId === "walletConnect" && !walletConnectEnabled) {
          throw new Error(getWalletInstallMessage("walletConnect"));
        }

        const targetConnector =
          connectors.find((item) => item.id === connectorId) ??
          connectors.find((item) => normalizeWalletConnectorId(item.id) === normalizedRequestedConnectorId) ??
          connectors.find((item) => item.id === "metaMask") ??
          connectors.find((item) => isMetaMaskConnectorId(item.id)) ??
          connectors[0];
        if (!targetConnector) {
          throw new Error("사용 가능한 지갑 연결 방식을 찾을 수 없습니다.");
        }

        if (connectorId !== "walletConnect") {
          const providerResolved = await waitForConnectorProvider(targetConnector.id);
          logConnectorProviderSnapshot(targetConnector.id);
          if (!providerResolved) {
            appLogger.warn("wallet.connect.provider_precheck_failed", {
              requestedConnectorId: connectorId ?? null,
              targetConnectorId: targetConnector.id,
            });
          }
        }

        if (isConnected) {
          try {
            await disconnectAsync();
          } catch (disconnectError) {
            appLogger.warn("wallet.reconnect_disconnect_failed", { error: disconnectError });
          }
        }

        const result = await connectAsync({ connector: targetConnector });
        walletAddress = result.accounts[0];
        walletType = normalizeWalletConnectorId(targetConnector.id) || targetConnector.id || targetConnector.name;
        const providerChainId = await resolveConnectorChainId(targetConnector);
        walletChainId = providerChainId ?? result.chainId ?? currentWalletChainId ?? walletChain.id;
        setWalletConnectingLabel(
          targetConnector.id === "walletConnect"
            ? "모바일 지갑 앱에서 WalletConnect 연결과 서명 요청을 승인하세요."
            : "지갑 연결이 확인되었습니다. 지갑에서 서명 요청을 승인하세요.",
        );

        const clientState = await waitForWalletClients();
        if (!clientState.walletClient) {
          throw new Error("브라우저 지갑 서명 세션을 준비하지 못했습니다. 지갑 연결을 다시 시도해주세요.");
        }
      }

      if (!walletAddress) {
        throw new Error("지갑 주소를 확인할 수 없습니다.");
      }

      const verifiedChainId = (await resolveConnectorChainId()) ?? walletChainId;
      walletChainId = verifiedChainId;

      if (walletChainId !== walletChain.id) {
        try {
          await switchChainAsync({ chainId: walletChain.id });
        } catch (switchError) {
          appLogger.warn("wallet.connect.switch_chain_failed", {
            walletAddress,
            walletChainId,
            expectedChainId: walletChain.id,
            switchError,
          });
        }

        const switchedChainId = (await resolveConnectorChainId()) ?? walletChainId;
        walletChainId = switchedChainId;

        if (walletChainId !== walletChain.id) {
          throw new Error("Polygon 네트워크로 전환한 뒤 다시 시도해주세요.");
        }
      }

      const challenge = await apiRequest<{ address: string; message: string; nonce: string; expires_at: string }>("/wallets/connect/challenge/", {
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
      if (message.includes("wallet_requestPermissions") || message.includes("already pending") || message.includes("-32002")) {
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

  function moveToHeaderTab(nextTab: TabName) {
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
    hardNavigateToTab(nextTab);
  }

  function handlePickFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (!isSupportedUploadFile(nextFile)) {
      window.alert("JPG, PNG, PDF, DOC, DOCX 파일만 업로드할 수 있습니다.");
      return;
    }
    if (nextFile.size > 30 * 1024 * 1024) {
      window.alert("파일 크기는 30MB 이하만 가능합니다.");
      return;
    }
    setSelectedFile(nextFile);
    setUploadContentType(getDefaultUploadContentType(nextFile));
    setContentResult(null);
    setMintErrorMessage("");
  }

  async function triggerFilePicker() {
    const readyUser = await ensureProtectedActionReady({
      phoneMessage: "휴대폰 인증이 필요합니다.",
      walletMessage: "지갑 연결 후 저작물 등록을 이용할 수 있습니다.",
    });
    if (!readyUser) return;
    uploadInputRef.current?.click();
  }

  async function triggerVerifyPicker() {
    const readyUser = await ensureProtectedActionReady({
      phoneMessage: "휴대폰 인증이 필요합니다.",
      walletMessage: "지갑 연결 후 저작물 검증을 이용할 수 있습니다.",
    });
    if (!readyUser) return;
    verifyInputRef.current?.click();
  }

  async function startAnalysis() {
    if (!selectedFile) {
      window.alert("먼저 업로드할 파일을 선택해주세요.");
      return;
    }
    const readyUser = await ensureProtectedActionReady({
      phoneMessage: "휴대폰 인증이 필요합니다.",
      walletMessage: "지갑 연결 후 저작물 등록을 이용할 수 있습니다.",
    });
    if (!readyUser) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("content_type", uploadContentType);

    setAnalysisProgress(0);
    setAnalysisProgressMessage("등록 작업을 서버에 전송하고 있습니다.");
    setAnalysisStage("running");
    setAnalysisRequestPending(true);
    setAnalysisJobId(null);
    setContentResult(null);
    setMintErrorMessage("");
    setRegisterFlowError(null);
    analysisPollFailureCountRef.current = 0;

    try {
      const response = await apiRequest<AsyncContentJobResponse>("/contents/register/", {
        method: "POST",
        auth: true,
        body: formData,
      });
      setAnalysisJobId(response.job_id);
      setAnalysisProgress((current) => Math.max(current, response.progress ?? 0));
      setAnalysisProgressMessage(response.progress_message || "");
      setContentResult(response.content ?? null);
    } catch (error) {
      setAnalysisStage("ready");
      setAnalysisProgress(0);
      setAnalysisProgressMessage("");
      setAnalysisRequestPending(false);
      setRegisterFlowError({
        message: error instanceof Error ? error.message : "등록 가능 여부 확인에 실패했습니다.",
        retryAction: "analysis",
      });
    }
  }

  function handlePickVerifyFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (!isSupportedUploadFile(nextFile)) {
      window.alert("JPG, PNG, PDF, DOC, DOCX 파일만 업로드할 수 있습니다.");
      return;
    }
    if (nextFile.size > 30 * 1024 * 1024) {
      window.alert("파일 크기는 30MB 이하만 가능합니다.");
      return;
    }
    setVerifyFile(nextFile);
    setVerifyContentType(getDefaultUploadContentType(nextFile));
    setVerifyResult(null);
    setVerifyRequestedAt(Date.now());
    setVerifyFlowError("");
  }

  async function startVerify() {
    if (!verifyFile) {
      window.alert("먼저 검증할 파일을 선택해주세요.");
      return;
    }
    const readyUser = await ensureProtectedActionReady({
      phoneMessage: "휴대폰 인증이 필요합니다.",
      walletMessage: "지갑 연결 후 저작물 검증을 이용할 수 있습니다.",
    });
    if (!readyUser) return;

    const formData = new FormData();
    formData.append("file", verifyFile);
    formData.append("content_type", verifyContentType);
    const requestedAt = Date.now();

    setVerifyProgress(0);
    setVerifyProgressMessage("검증 작업을 서버에 전송하고 있습니다.");
    setVerifyRunning(true);
    setVerifyJobId(null);
    setVerifyResult(null);
    setVerifyRequestedAt(requestedAt);
    setVerifyFlowError("");
    verifyPollFailureCountRef.current = 0;

    try {
      const response = await apiRequest<AsyncVerifyJobResponse>("/contents/verify/", {
        method: "POST",
        auth: true,
        body: formData,
      });
      setVerifyJobId(response.job_id);
      setVerifyProgress((current) => Math.max(current, response.progress ?? 0));
      setVerifyProgressMessage(response.progress_message || "");
    } catch (error) {
      setVerifyProgress(0);
      setVerifyProgressMessage("");
      setVerifyRunning(false);
      setVerifyFlowError(error instanceof Error ? error.message : "저작물 검증에 실패했습니다.");
    }
  }

  async function startWatermark() {
    if (!contentResult) {
      window.alert("먼저 등록 가능 여부 분석을 완료해주세요.");
      return;
    }
    const readyUser = await ensureProtectedActionReady({
      phoneMessage: "휴대폰 인증이 필요합니다.",
      walletMessage: "지갑 연결 후 서비스를 이용할 수 있습니다.",
    });
    if (!readyUser) return;
    if (hasWatermarkArtifact(contentResult)) {
      setAnalysisStage("watermarked");
      return;
    }

    setAnalysisStage("watermarking");
    setWatermarkProgress(0);
    setWatermarkProgressMessage("워터마크 작업을 서버에 전송하고 있습니다.");
    setWatermarkRequestPending(true);
    setWatermarkJobId(null);
    setRegisterFlowError(null);
    watermarkPollFailureCountRef.current = 0;

    try {
      const response = await apiRequest<AsyncContentJobResponse>(`/contents/${contentResult.public_id}/watermark/`, {
        method: "POST",
        auth: true,
      });
      if (response.status === "success" && response.content) {
        setContentResult(response.content);
        setWatermarkProgress(100);
        setWatermarkRequestPending(false);
        setWatermarkJobId(null);
        setAnalysisStage(hasWatermarkArtifact(response.content) ? "watermarked" : "allow");
        if (!hasWatermarkArtifact(response.content)) {
          setRegisterFlowError({
            message: "워터마크 처리 결과 파일을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
            retryAction: "watermark",
          });
        }
        return;
      }
      setWatermarkJobId(response.job_id);
      setWatermarkProgress((current) => Math.max(current, response.progress ?? 0));
      setWatermarkProgressMessage(response.progress_message || "");
      setContentResult(response.content ?? contentResult);
    } catch (error) {
      setAnalysisStage("allow");
      setWatermarkProgress(0);
      setWatermarkProgressMessage("");
      setWatermarkRequestPending(false);
      setRegisterFlowError({
        message: error instanceof Error ? error.message : "워터마크 삽입에 실패했습니다.",
        retryAction: "watermark",
      });
    }
  }

  async function startReviewVote() {
    if (!contentResult) {
      window.alert("먼저 REVIEW 판정 콘텐츠를 준비해주세요.");
      return;
    }
    const readyUser = await ensureProtectedActionReady({
      phoneMessage: "휴대폰 인증이 필요합니다.",
      walletMessage: "지갑 연결 후 서비스를 이용할 수 있습니다.",
    });
    if (!readyUser) return;

    setAnalysisStage("reviewStarting");
    setReviewVoteProgress(0);
    setReviewVoteRequestPending(true);

    try {
      const response = await apiRequest<RegisteredContentResponse>(`/contents/${contentResult.public_id}/review-vote/start/`, {
        method: "POST",
        auth: true,
        body: {
          notify_by_email: reviewConsentNotifyByEmail,
        },
      });
      setContentResult(response);
      setReviewVoteProgress(100);

      if (response.decision === "allow" || response.decision === "block") {
        setAnalysisStage(response.decision);
      } else {
        setAnalysisStage("reviewLive");
      }
    } catch (error) {
      setAnalysisStage("review");
      setReviewVoteProgress(0);
      setRegisterFlowError({
        message: error instanceof Error ? error.message : "커뮤니티 검증 투표 생성에 실패했습니다.",
        retryAction: "review",
      });
    } finally {
      setReviewVoteRequestPending(false);
    }
  }

  async function openReviewConsent() {
    const readyUser = await ensureProtectedActionReady({
      phoneMessage: "휴대폰 인증이 필요합니다.",
      walletMessage: "지갑 연결 후 서비스를 이용할 수 있습니다.",
    });
    if (!readyUser) return;

    setReviewConsentNotifyByEmail(false);
    setReviewConsentOpenedAt(Date.now());
    setReviewConsentModalOpen(true);
  }

  async function startMint() {
    if (!contentResult) {
      window.alert("먼저 워터마크 삽입을 완료해주세요.");
      return;
    }
    const readyUser = await ensureProtectedActionReady({
      phoneMessage: "휴대폰 인증이 필요합니다.",
      walletMessage: "지갑 연결 후 서비스를 이용할 수 있습니다.",
    });
    if (!readyUser) return;
    if (hasMintedContent(contentResult)) {
      setMintErrorMessage("");
      setAnalysisStage("minted");
      return;
    }

    setMintErrorMessage("");
    setAnalysisStage("minting");
    setMintProgress(0);
    setMintRequestPending(true);

    try {
      const response = await apiRequest<RegisteredContentResponse>(`/contents/${contentResult.public_id}/mint/`, {
        method: "POST",
        auth: true,
      });
      setContentResult(response);
      if (!hasMintedContent(response)) {
        setMintErrorMessage("토큰 발행 응답에서 유효한 Token ID 또는 트랜잭션 해시를 확인하지 못했습니다.");
        setAnalysisStage("mintFailed");
        setMintProgress(0);
        return;
      }
      await promptWatchMintedAsset(response);
      setMintProgress(100);
      setAnalysisStage("minted");
      await refreshWalletSummary({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "NFT 토큰 발행에 실패했습니다.";
      setMintErrorMessage(message);
      setAnalysisStage("mintFailed");
      setMintProgress(0);
    } finally {
      setMintRequestPending(false);
    }
  }

  async function submitSignedReviewVote(publicId: string, options: {
    choice: "yes" | "no";
    chainId: number;
    tokenId?: number | string | null;
    contractAddress?: string | null;
    voteStatus?: string | null;
    voteEndTime?: string | null;
    suppressToast?: boolean;
  }): Promise<ReviewVoteCastResponse> {
    if (historyVoteSubmitting) {
      if (!options.suppressToast) {
        openToast("이미 투표 요청을 처리 중입니다.");
      }
      throw new Error("Vote submission already in progress.");
    }
    if (!hasAuthSession) {
      setModal("loginChoice");
      if (!options.suppressToast) {
        openToast("로그인 후 투표할 수 있습니다.");
      }
      throw new Error("Authentication required.");
    }
    if (walletRequired) {
      promptWalletRequired("지갑 연결 후 투표할 수 있습니다.");
      throw new Error("Wallet link required.");
    }
    if (walletSummary.lookup_status === "failed") {
      if (!options.suppressToast) {
        openToast(walletSummary.lookup_error || "NFT 보유 수량을 조회하지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
      throw new Error("Wallet summary lookup failed.");
    }
    if (!walletSummary.vote_eligible) {
      if (!options.suppressToast) {
        openToast(`투표 참여는 최소 ${walletSummary.vote_minimum} NFT 보유 후 가능합니다.`);
      }
      throw new Error("Vote eligibility requirement not met.");
    }
    if (!connectedWalletAddress || !isConnected) {
      setWalletConnectModalOpen(true);
      if (!options.suppressToast) {
        openToast("투표하려면 연결된 지갑이 필요합니다.");
      }
      throw new Error("Connected wallet required.");
    }
    if (!user?.wallet_address || user.wallet_address.toLowerCase() !== connectedWalletAddress.toLowerCase()) {
      if (!options.suppressToast) {
        openToast("서비스에 연동된 지갑과 현재 연결된 지갑이 다릅니다. 같은 지갑으로 다시 연결하세요.");
      }
      throw new Error("Connected wallet does not match linked wallet.");
    }

    setHistoryVoteSubmitting(true);

    try {
      const providerChainId = (await resolveConnectorChainId()) ?? currentWalletChainId ?? null;
      if (providerChainId !== options.chainId) {
        await switchChainAsync({ chainId: options.chainId });
      }

      const signing = await apiRequest<ReviewVoteSigningResponse>(`/contents/${publicId}/review-vote/signing/`, {
        method: "GET",
        auth: true,
      });
      const signature = await requestReviewVoteSignature(signing, options.choice);

      return await apiRequest<ReviewVoteCastResponse>(`/contents/${publicId}/review-vote/vote/`, {
        method: "POST",
        auth: true,
        body: {
          is_original: options.choice === "yes",
          deadline: signing.deadline,
          signature,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "투표 참여 중 오류가 발생했습니다.";
      const normalizedMessage =
        message.includes("Already voted")
          ? "이미 이 투표에 참여했습니다."
          : message.includes("replacement transaction underpriced")
            ? "이전 투표 트랜잭션이 아직 처리 중입니다. 잠시 후 분석 기록을 새로고침한 뒤 다시 확인해주세요."
            : message.includes("Voting time ended") || message.includes("Signature expired")
              ? "투표가 종료되었거나 서명이 만료되었습니다. 다시 시도해주세요."
              : message.includes("Voting not active")
                ? "현재 진행 중인 투표가 아닙니다."
                : message.includes("Invalid signature")
                  ? "지갑 서명 검증에 실패했습니다. 다시 시도해주세요."
                  : message;
      if (!options.suppressToast) {
        openToast(normalizedMessage);
      }
      throw error;
    } finally {
      setHistoryVoteSubmitting(false);
    }
  }

  function hasContentMintForHistory(blockchain?: HistoryAllowResumePayload["blockchain"] | null) {
    return Boolean(
      blockchain?.mint_kind === "content" &&
        blockchain?.minted &&
        blockchain?.token_id !== null &&
        typeof blockchain?.token_id !== "undefined" &&
        blockchain?.token_id !== 0 &&
        blockchain?.token_id !== "0",
    );
  }

  function parseHistoryCosine(value: string) {
    const matched = value.match(/([0-9]*\.?[0-9]+)/);
    if (!matched) return null;
    const parsed = Number(matched[1]);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function parseHistoryPhash(value: string) {
    const matched = value.match(/Distance\s+(\d+)/i);
    if (!matched) return null;
    const parsed = Number(matched[1]);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function buildContentResultFromHistory(item: HistoryAllowResumePayload): RegisteredContentResponse {
    const blockchain = item.blockchain || {};
    return {
      id: 0,
      public_id: item.id,
      content_type: "image",
      status: "allow",
      original_filename: item.fileName,
      original_storage_key: "",
      mime_type: "image/png",
      file_size: 0,
      file_url: item.originalPreviewUrl || item.previewUrl || null,
      watermark_file_url: item.comparisonPreviewUrl || null,
      decision: "allow",
      reason: item.extra,
      next_action: "none",
      top_cosine: parseHistoryCosine(item.cosine),
      top_phash_dist: parseHistoryPhash(item.phash),
      top_match: {},
      candidates: [],
      watermark: {
        applied: Boolean(item.downloadUrl),
        requested: Boolean(item.downloadUrl),
        output_url: item.comparisonPreviewUrl || null,
        output_key: null,
        payload_id: null,
        model: null,
        model_version: null,
        nbits: null,
        scaling_w: null,
        proportion_masked: null,
        details: {},
      },
      blockchain: {
        minted: Boolean(blockchain.minted),
        mint_kind: blockchain.mint_kind,
        network_name: blockchain.network_name || undefined,
        chain_id: blockchain.chain_id ?? undefined,
        contract_address: blockchain.contract_address || undefined,
        recipient_address: blockchain.recipient_address || undefined,
        owner_address: blockchain.owner_address || undefined,
        token_id: blockchain.token_id ?? undefined,
        status: blockchain.status || undefined,
        file_hash: blockchain.file_hash || blockchain.content_hash || undefined,
        tx_hash: blockchain.tx_hash || blockchain.transaction_hash || undefined,
        minted_at: blockchain.minted_at || undefined,
        minted_at_display: blockchain.minted_at_display || undefined,
        vote: blockchain.vote
          ? {
              active: blockchain.vote.active,
              vote_id: blockchain.vote.vote_id,
              status: blockchain.vote.status,
              upvotes: blockchain.vote.upvotes,
              downvotes: blockchain.vote.downvotes,
              participant_count: blockchain.vote.participant_count,
              has_votes: blockchain.vote.has_votes,
              upvote_rate: blockchain.vote.upvote_rate,
              downvote_rate: blockchain.vote.downvote_rate,
              end_time: blockchain.vote.end_time || undefined,
              end_time_display: blockchain.vote.end_time_display || undefined,
              started_at: blockchain.vote.started_at || undefined,
              started_at_display: blockchain.vote.started_at_display || undefined,
              finalized_at: blockchain.vote.finalized_at || undefined,
              finalized_at_display: blockchain.vote.finalized_at_display || undefined,
              similarity_percent: blockchain.vote.similarity_percent ?? undefined,
              threshold: blockchain.vote.threshold ?? undefined,
              delta: blockchain.vote.delta ?? undefined,
            }
          : undefined,
      },
      timing_ms: {},
    };
  }

  function openAllowHistoryFlow(item: HistoryAllowResumePayload) {
    const hydratedContent = buildContentResultFromHistory(item);
    const contentMinted = hasContentMintForHistory(item.blockchain);
    const watermarkApplied = Boolean(item.downloadUrl);

    setSelectedFile(null);
    setPreviewUrl(item.originalPreviewUrl || item.previewUrl || "");
    setContentResult(hydratedContent);
    setAnalysisProgress(0);
    setAnalysisRequestPending(false);
    setAnalysisJobId(null);
    setWatermarkProgress(0);
    setWatermarkRequestPending(false);
    setWatermarkJobId(null);
    setRegisterFlowError(null);
    setMintProgress(0);
    setMintRequestPending(false);
    setMintErrorMessage("");
    setAnalysisStage(contentMinted ? "minted" : watermarkApplied ? "watermarked" : "allow");
    navigateToTab("add");
  }

  async function castReviewVote(choice: "yes" | "no") {
    if (!contentResult?.public_id) {
      return;
    }

    const response = await submitSignedReviewVote(contentResult.public_id, {
      choice,
      chainId: contentResult.blockchain?.chain_id ?? walletChain.id,
      tokenId: contentResult.blockchain?.token_id ?? null,
      contractAddress: contentResult.blockchain?.contract_address ?? null,
      voteStatus: contentResult.blockchain?.vote?.status ?? null,
      voteEndTime: contentResult.blockchain?.vote?.end_time ?? null,
      suppressToast: true,
    });

    setContentResult(response.content);
    setReviewVoteDraft({
      contentId: response.content.public_id,
      upvotes: response.content.blockchain?.vote?.upvotes ?? 0,
      downvotes: response.content.blockchain?.vote?.downvotes ?? 0,
      participantCount: response.content.blockchain?.vote?.participant_count ?? 0,
      votedChoice: choice,
    });
    setReviewVoteModalOpen(false);
  }

  async function castHistoryReviewVote(item: HistoryItem, choice: "yes" | "no") {
    await submitSignedReviewVote(item.id, {
      choice,
      chainId: item.blockchain?.chain_id ?? walletChain.id,
      tokenId: item.blockchain?.token_id ?? null,
      contractAddress: item.blockchain?.contract_address ?? null,
      voteStatus: item.blockchain?.vote?.status ?? null,
      voteEndTime: item.blockchain?.vote?.end_time ?? null,
    });
    await loadHistoryEntries({ silent: true });
    openToast(choice === "yes" ? "찬성 투표가 기록되었습니다." : "반대 투표가 기록되었습니다.");
  }

  async function sendPhoneVerificationCode() {
    const normalizedPhone = phoneInput.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(normalizedPhone)) {
      setPhoneVerificationError("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }

    setSendingPhoneCode(true);
    setPhoneVerificationError("");
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
      setPhoneVerificationError(error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setSendingPhoneCode(false);
    }
  }

  async function verifyPhone() {
    const normalizedPhone = phoneInput.replace(/\D/g, "");
    if (!/^\d{6}$/.test(phoneCodeInput)) {
      setPhoneVerificationError("인증번호 6자리를 입력해주세요.");
      return;
    }

    setVerifyingPhoneCode(true);
    setPhoneVerificationError("");
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
      setPhoneVerificationError(error instanceof Error ? error.message : "본인 인증에 실패했습니다.");
    } finally {
      setVerifyingPhoneCode(false);
    }
  }

  async function sendEmailVerificationCode() {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailVerificationError("이메일 주소를 정확히 입력해주세요.");
      return;
    }

    setSendingEmailCode(true);
    setEmailVerificationError("");
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
      setEmailVerificationError(error instanceof Error ? error.message : "이메일 인증번호 발송에 실패했습니다.");
    } finally {
      setSendingEmailCode(false);
    }
  }

  async function verifyEmail() {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!/^\d{6}$/.test(emailCodeInput)) {
      setEmailVerificationError("이메일 인증번호 6자리를 입력해주세요.");
      return;
    }

    setVerifyingEmailCode(true);
    setEmailVerificationError("");
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
      setEmailVerificationError(error instanceof Error ? error.message : "이메일 인증에 실패했습니다.");
    } finally {
      setVerifyingEmailCode(false);
    }
  }

  const resetRegisterFlow = () => {
    setAnalysisStage("ready");
    setAnalysisProgress(0);
    setAnalysisProgressMessage("");
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
    setWatermarkProgressMessage("");
    setWatermarkRequestPending(false);
    setWatermarkJobId(null);
    setMintProgress(0);
    setMintRequestPending(false);
    setContentResult(null);
  };

  const resetVerifyFlow = () => {
    setVerifyFile(null);
    setVerifyPreviewUrl("");
    setVerifyProgress(0);
    setVerifyProgressMessage("");
    setVerifyRunning(false);
    setVerifyJobId(null);
    setVerifyResult(null);
    setVerifyRequestedAt(null);
    setVerifyFlowError("");
  };

  return {
    session: {
      loading,
      isLoggedIn,
      user,
      displayName,
      avatarInitial,
      profileEmail,
      profilePhone,
      lastLoginLabel,
      phoneVerified,
      emailVerified,
      verifyUserLabel,
      hasAuthSession,
    },
    navigation: {
      activeTab,
      tabs,
      moveToTab,
      moveToHeaderTab,
      navigateToTab,
      historyEntryFromUrl,
      historyDetailTypeFromUrl,
    },
    home: {
      systemCards,
      recentActivities,
      historyVoteSubmitting,
      castHistoryReviewVote,
    },
    register: {
      selectedFile,
      uploadContentType,
      previewUrl,
      analysisStage,
      analysisProgress,
      analysisProgressMessage,
      registerResult,
      contentResult,
      recentUploads: ongoingVoteUploads,
      uploadInputRef,
      reviewVoteProgress,
      reviewConsentModalOpen,
      reviewConsentNotifyByEmail,
      reviewConsentEndAtLabel: formatReviewVoteEndAt(reviewConsentOpenedAt ?? reviewConsentFallbackOpenedAt),
      reviewVoteDraft,
      reviewVoteModalOpen,
      watermarkProgress,
      watermarkProgressMessage,
      mintProgress,
      mintErrorMessage,
      registerFlowError,
      setRegisterFlowError,
      setReviewConsentModalOpen,
      setReviewConsentNotifyByEmail,
      setReviewVoteModalOpen,
      handlePickFile,
      triggerFilePicker,
      startAnalysis,
      resetRegisterFlow,
      startWatermark,
      openReviewConsent,
      startReviewVote,
      refreshReviewVote,
      startMint,
      castReviewVote,
      saveFileWithPicker,
      buildWatermarkedFileName,
      setSelectedFile,
      setUploadContentType,
      setPreviewUrl,
      setReviewConsentOpenedAt,
      setContentResult,
      setMintErrorMessage,
      promptPhoneRequired,
      openToast,
    },
    verify: {
      selectedFile: verifyFile,
      contentType: verifyContentType,
      previewUrl: verifyPreviewUrl,
      verifyProgress,
      verifyProgressMessage,
      verifyRunning,
      verifyResult,
      verifyRequestedAt,
      verifyFlowError,
      setVerifyFlowError,
      setVerifyContentType,
      recentItems: ongoingVoteVerifyItems,
      uploadInputRef: verifyInputRef,
      handlePickVerifyFile,
      triggerVerifyPicker,
      startVerify,
      resetVerifyFlow,
    },
    history: {
      filteredHistory,
      historyFilter,
      setHistoryFilter,
      openAllowHistoryFlow,
      castHistoryReviewVote,
      historyVoteSubmitting,
    },
    mypage: {
      linkedWalletAddress,
      walletNetworkLabel,
      walletTypeLabel,
      walletSummary,
      walletSummaryLoading,
      walletConnecting,
      walletDisconnecting,
      handleConnectWallet,
      handleDisconnectWallet,
      setProfileEditOpen,
      setPhoneVerificationModalOpen,
      setEmailVerificationModalOpen,
      setWithdrawOpen,
    },
    auth: {
      modal,
      setModal,
      handleLogin,
      handleSignup,
      handleLogout,
      profileEditOpen,
      profileSaving,
      handleProfileUpdate,
      withdrawOpen,
      withdrawing,
      handleWithdraw,
    },
    wallet: {
      walletConnectModalOpen,
      setWalletConnectModalOpen,
      walletModalConnectors,
      walletConnecting,
      walletConnectingLabel,
      connectWalletWithConnector,
    },
    identity: {
      phoneVerificationModalOpen,
      setPhoneVerificationModalOpen,
      phoneRequiredModalOpen,
      setPhoneRequiredModalOpen,
      phoneInput,
      setPhoneInput,
      phoneCodeInput,
      setPhoneCodeInput,
      phoneTimer,
      sendingPhoneCode,
      verifyingPhoneCode,
      phoneVerificationError,
      setPhoneVerificationError,
      sendPhoneVerificationCode,
      verifyPhone,
      emailVerificationModalOpen,
      setEmailVerificationModalOpen,
      emailInput,
      setEmailInput,
      emailCodeInput,
      setEmailCodeInput,
      emailTimer,
      sendingEmailCode,
      verifyingEmailCode,
      emailVerificationError,
      setEmailVerificationError,
      sendEmailVerificationCode,
      verifyEmail,
    },
    toast: {
      toast,
      openToast,
      closeToast,
    },
    common: {
      formatFileSize,
      openOngoingVoteHistory,
      walletConnectEnabled,
    },
  };
}

export type AppController = ReturnType<typeof useAppController>;
