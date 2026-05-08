import { useLocation } from "react-router-dom";
import { getLocaleFromPathname, withLocalePath } from "../../lib/locales";

interface MyPageProps {
  displayName: string;
  profileEmail: string;
  profilePhone: string;
  lastLoginLabel: string;
  avatarInitial: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  walletAddress: string | null;
  walletNetworkLabel: string;
  walletTypeLabel: string;
  nftCount: number | null;
  voteMinimum: number;
  voteEligible: boolean;
  walletLookupStatus: "not_connected" | "ok" | "failed";
  walletLookupError?: string | null;
  walletSummaryLoading: boolean;
  walletConnecting: boolean;
  walletDisconnecting: boolean;
  onOpenProfileEdit: () => void;
  onOpenPhoneIdentity: () => void;
  onOpenEmailIdentity: () => void;
  onLogout: () => void;
  onOpenWithdraw: () => void;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

export default function MyPage({
  displayName,
  profileEmail,
  profilePhone,
  lastLoginLabel,
  avatarInitial,
  emailVerified,
  phoneVerified,
  walletAddress,
  walletNetworkLabel,
  walletTypeLabel,
  nftCount,
  voteMinimum,
  voteEligible,
  walletLookupStatus,
  walletLookupError,
  walletSummaryLoading,
  walletConnecting,
  walletDisconnecting,
  onOpenProfileEdit,
  onOpenPhoneIdentity,
  onOpenEmailIdentity,
  onLogout,
  onOpenWithdraw,
  onConnectWallet,
  onDisconnectWallet,
}: MyPageProps) {
  const location = useLocation();
  const currentLocale = getLocaleFromPathname(location.pathname) || "ko";

  return (
    <section className="mypage-shell">
      <div className="mypage-header">
        <h2>마이페이지</h2>
        <p>인증 상태와 계정 정보를 한 번에 관리하세요.</p>
      </div>

      <div className="mypage-layout">
        <aside className="mypage-profile-card">
          <div className="mypage-avatar">{avatarInitial}</div>
          <h3>{displayName}</h3>
          <p>{profileEmail}</p>
          <p>{profilePhone}</p>
          <p>최근 접속 {lastLoginLabel}</p>
          <button className="btn btn-secondary mypage-edit-btn" type="button" onClick={onOpenProfileEdit}>
            프로필 수정
          </button>

          <div className="mypage-quick-links">
            <a href="#!" onClick={(event) => { event.preventDefault(); onLogout(); }}>로그아웃</a>
            <a href={withLocalePath("/terms", currentLocale)}>이용약관</a>
            <a href={withLocalePath("/privacy", currentLocale)}>개인정보처리방침</a>
            <a href={withLocalePath("/support", currentLocale)}>고객센터</a>
            <button className="mypage-withdraw-link" type="button" onClick={onOpenWithdraw}>
              회원 탈퇴
            </button>
          </div>
        </aside>

        <div className="mypage-content">
          <article className="mypage-card">
            <div className="mypage-card-head">
              <h3>본인 인증</h3>
              <span className={`mypage-verify-item ${phoneVerified ? "is-done" : "is-pending"}`}>
                {phoneVerified ? "휴대폰 인증 완료" : "휴대폰 인증 필요"}
              </span>
              <span className={`mypage-verify-item ${emailVerified ? "is-done" : "is-pending"}`}>
                {emailVerified ? "이메일 인증 완료" : "이메일 인증 선택"}
              </span>
            </div>
            <p>
              {phoneVerified
                ? "휴대폰 인증이 완료되었습니다. 이메일 인증은 선택적으로 진행할 수 있습니다."
                : "서비스 이용 제한 해제를 위해 휴대폰 인증을 진행해주세요. 이메일 인증은 선택입니다."}
            </p>
            <div className="mypage-actions mypage-actions--double">
              <button
                className={`btn btn-primary ${phoneVerified ? "is-static" : ""}`}
                type="button"
                disabled={phoneVerified}
                onClick={onOpenPhoneIdentity}
              >
                {phoneVerified ? "휴대폰 인증 완료" : "휴대폰 인증하기"}
              </button>
              <button
                className={`btn btn-primary ${emailVerified ? "is-static" : ""}`}
                type="button"
                disabled={emailVerified}
                onClick={onOpenEmailIdentity}
              >
                {emailVerified ? "이메일 인증 완료" : "이메일 인증하기"}
              </button>
            </div>
          </article>

          <article className="mypage-card token-status-card">
            <div className="mypage-card-head">
              <h3>보유 토큰</h3>
              <span className={`mypage-chip ${voteEligible ? "is-done" : "is-pending"}`}>
                {!walletAddress ? "미연결" : walletLookupStatus === "failed" ? "조회 실패" : voteEligible ? "참여 가능" : "대기"}
              </span>
            </div>
            <p>NFT 보유 수량을 기준으로 블록체인 투표 참여 권한이 결정됩니다.</p>
            <div className="token-status-grid">
              <div className="token-count-box token-count-box--hero">
                <span>현재 보유 수량</span>
                <strong><em>{walletSummaryLoading || walletLookupStatus === "failed" ? "-" : (nftCount ?? "-")}</em> NFT</strong>
              </div>
              <div className="token-count-box">
                <span>투표 최소 조건</span>
                <strong><em>{voteMinimum}</em> NFT</strong>
              </div>
            </div>
            <div className="token-status-note token-status-note--panel">
              {!walletAddress
                ? "지갑을 연결해야 보유 NFT 수량을 조회할 수 있습니다."
                : walletSummaryLoading
                  ? "체인에서 NFT 보유 수량을 조회하고 있습니다."
                  : walletLookupStatus === "failed"
                    ? (walletLookupError || "NFT 보유 수량을 조회하지 못했습니다. 잠시 후 다시 시도해주세요.")
                  : voteEligible
                    ? `현재 ${nftCount ?? 0} NFT를 보유하여 투표 권한이 활성화되었습니다.`
                    : `현재 ${Math.max(voteMinimum - (nftCount ?? 0), 0)} NFT 부족하여 투표 권한이 활성화되지 않았습니다.`}
            </div>
          </article>

          <article className="mypage-card">
            <div className="mypage-card-head">
              <h3>지갑 연결</h3>
              <span className="mypage-chip">필수</span>
            </div>
            <p>등록 토큰 관리를 위해 지갑을 연결해야합니다.</p>
            <div className="wallet-panel">
              <div className="wallet-link-status">
                <span className={`mypage-verify-item ${walletAddress ? "is-done" : "is-pending"}`}>
                  {walletAddress ? "연결 완료" : "미연결"}
                </span>
                <div className="wallet-link-meta">
                  <strong>{walletAddress ?? "연결된 지갑이 없습니다."}</strong>
                  <span>
                    {walletAddress
                      ? `${walletNetworkLabel} · ${walletTypeLabel || "Injected Wallet"}`
                      : "브라우저 지갑으로 연결 후 서명하여 등록합니다."}
                  </span>
                </div>
              </div>

              <div className="wallet-brief-grid">
                <div className="wallet-brief-box">
                  <span>네트워크</span>
                  <strong>{walletAddress ? walletNetworkLabel : "-"}</strong>
                </div>
                <div className="wallet-brief-box">
                  <span>지갑 유형</span>
                  <strong>{walletAddress ? walletTypeLabel : "-"}</strong>
                </div>
              </div>

              {!walletAddress ? (
                <div className="wallet-guide-box">
                  <strong>연결 안내</strong>
                  <p>MetaMask, Rabby 또는 WalletConnect로 지갑을 연결한 뒤 서명을 완료하면 등록과 검증 기능을 사용할 수 있습니다.</p>
                  <ul>
                    <li>1. 지갑 확장 프로그램 또는 모바일 지갑 앱 준비</li>
                    <li>2. 아래 `지갑 등록하기` 선택</li>
                    <li>3. 지갑 선택 후 서명 요청 승인</li>
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="mypage-actions wallet-actions">
              <button className="btn btn-primary" type="button" onClick={onConnectWallet} disabled={walletConnecting}>
                {walletConnecting ? "지갑 연결 중..." : walletAddress ? "지갑 다시 연결하기" : "지갑 등록하기"}
              </button>
              {walletAddress ? (
                <button className="wallet-disconnect-link" type="button" onClick={onDisconnectWallet} disabled={walletDisconnecting}>
                  {walletDisconnecting ? "해제 중..." : "지갑 해제하기"}
                </button>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
