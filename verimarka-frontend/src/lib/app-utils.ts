import { normalizeWalletConnectorId, walletChain } from "./wallet";
import type { TabName } from "../types/app";

export const TAB_PATHS: Record<TabName, string> = {
  home: "/",
  add: "/register",
  verify: "/verify",
  history: "/history",
  mypage: "/mypage",
};

export const LOADING_RING_DURATION_MS = 15000;
export const LOADING_RING_MAX_PENDING_PROGRESS = 99;
export const AUTO_LOGOUT_IDLE_MS = 30 * 60 * 1000;
export const POST_LOGOUT_TOAST_KEY = "verimarka:post-logout-toast";
export const SUSPENDED_ACCOUNT_MESSAGE = "정지된 계정입니다.";
export const SUPPORTED_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const SUPPORTED_UPLOAD_DESCRIPTION = "지원 포맷: JPG, PNG, PDF, DOC, DOCX / 최대 20MB";

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

export function formatLastLogin(value: string | null | undefined) {
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

export function formatWalletAddress(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function getWalletNetworkLabel(chainId: number | null | undefined) {
  if (chainId === walletChain.id) return "Polygon";
  if (!chainId) return "Polygon";
  return `Chain #${chainId}`;
}

export function getWalletInstallMessage(connectorId?: string) {
  const normalizedConnectorId = normalizeWalletConnectorId(connectorId);

  if (normalizedConnectorId === "metaMask") {
    return "MetaMask 지갑이 설치되어 있지 않습니다. MetaMask 확장 프로그램을 먼저 설치하세요.";
  }

  if (normalizedConnectorId === "rabby") {
    return "Rabby 지갑이 설치되어 있지 않습니다. Rabby 확장 프로그램을 먼저 설치하세요.";
  }

  if (normalizedConnectorId === "trustWallet") {
    return "Trust Wallet 지갑이 설치되어 있지 않습니다. Trust Wallet 확장 프로그램을 먼저 설치하세요.";
  }

  if (normalizedConnectorId === "walletConnect") {
    return "WalletConnect QR 연결을 사용할 수 없습니다. 배포 환경의 VITE_WALLETCONNECT_PROJECT_ID 설정을 확인하세요.";
  }

  return "브라우저 지갑이 설치되어 있지 않습니다. MetaMask 같은 지갑을 먼저 설치하세요.";
}

export function getTabFromPath(pathname: string): TabName {
  if (pathname === "/register") return "add";
  if (pathname === "/verify") return "verify";
  if (pathname === "/history") return "history";
  if (pathname === "/mypage") return "mypage";
  return "home";
}

export function buildTabPath(nextTab: TabName, options?: { search?: string }) {
  return `${TAB_PATHS[nextTab]}${options?.search ?? ""}`;
}

export function buildWatermarkedFileName(fileName: string) {
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

export function getMimeTypeFromFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

export function isSupportedUploadMimeType(mimeType: string) {
  return [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ].includes(mimeType);
}

export function isSupportedUploadFile(file: File) {
  if (isSupportedUploadMimeType(file.type)) return true;
  return [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"].some((extension) =>
    file.name.toLowerCase().endsWith(extension),
  );
}

export function formatReviewVoteEndAt(baseTime: number) {
  const date = new Date(baseTime + 72 * 60 * 60 * 1000);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}월 ${day}일 ${hours}시 ${minutes}분`;
}

export function getInitial(value: string) {
  const safeValue = value.trim();
  return safeValue ? safeValue.slice(0, 1).toUpperCase() : "V";
}
