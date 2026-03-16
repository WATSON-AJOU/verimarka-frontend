import type { TabName } from "../../types/app";

interface HeaderTab {
  key: TabName;
  label: string;
}

interface HeaderProps {
  tabs: HeaderTab[];
  activeTab: TabName;
  loading: boolean;
  isLoggedIn: boolean;
  displayName: string;
  avatarInitial: string;
  onMoveTab: (tab: TabName) => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onLogout: () => void;
}

export default function Header({
  tabs,
  activeTab,
  loading,
  isLoggedIn,
  displayName,
  avatarInitial,
  onMoveTab,
  onOpenLogin,
  onOpenSignup,
  onLogout,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="topbar">
        <button className="brand" type="button" onClick={() => onMoveTab("home")}>
          <span className="brand-word">VeriMarka</span>
        </button>

        <nav className="tabs" aria-label="주요 메뉴">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab ${activeTab === tab.key ? "is-active" : ""}`}
              onClick={() => onMoveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="auth-slot">
          {!loading && !isLoggedIn ? (
            <div className="guest-actions">
              <button className="auth-text-btn" type="button" onClick={onOpenLogin}>
                로그인
              </button>
              <button className="auth-text-btn signup-link" type="button" onClick={onOpenSignup}>
                회원가입
              </button>
            </div>
          ) : null}

          {!loading && isLoggedIn ? (
            <>
              <button className="user-session" type="button" onClick={() => onMoveTab("mypage")}>
                <span className="user-nickname">{displayName}님</span>
                <span className="profile-shortcut">
                  <span className="profile-shortcut-circle">{avatarInitial}</span>
                </span>
              </button>
              <button className="logout-btn" type="button" onClick={onLogout}>
                로그아웃
              </button>
            </>
          ) : null}

          <div className="lang-switch">
            <button className="lang-trigger" type="button">
              Languages
              <span className="lang-caret">⌄</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
