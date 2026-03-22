interface MyPageProps {
  displayName: string;
  profileEmail: string;
  profilePhone: string;
  lastLoginLabel: string;
  avatarInitial: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  onOpenProfileEdit: () => void;
  onOpenPhoneIdentity: () => void;
  onOpenEmailIdentity: () => void;
  onLogout: () => void;
  onOpenWithdraw: () => void;
}

export default function MyPage({
  displayName,
  profileEmail,
  profilePhone,
  lastLoginLabel,
  avatarInitial,
  emailVerified,
  phoneVerified,
  onOpenProfileEdit,
  onOpenPhoneIdentity,
  onOpenEmailIdentity,
  onLogout,
  onOpenWithdraw,
}: MyPageProps) {
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
            <a href="/terms">이용약관</a>
            <a href="/privacy">개인정보처리방침</a>
            <a href="/support">고객센터</a>
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
              <span className="mypage-chip is-pending">대기</span>
            </div>
            <p>NFT 보유 수량을 기준으로 블록체인 투표 참여 권한이 결정됩니다.</p>
            <div className="token-status-row">
              <div className="token-count-box">
                <span>현재 보유 수량</span>
                <strong><em>0</em> NFT</strong>
              </div>
              <div className="token-count-box">
                <span>투표 최소 조건</span>
                <strong><em>3</em> NFT</strong>
              </div>
            </div>
            <p className="token-status-note">현재 3 NFT 부족하여 투표 권한이 활성화되지 않았습니다.</p>
          </article>

          <article className="mypage-card">
            <div className="mypage-card-head">
              <h3>지갑 연결</h3>
              <span className="mypage-chip">필수</span>
            </div>
            <p>등록 토큰 관리를 위해 지갑을 연결해야합니다.</p>
            <div className="mypage-actions wallet-actions">
              <button className="btn btn-primary" type="button">지갑 등록하기</button>
              <button className="wallet-disconnect-link" type="button">지갑 해제하기</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
