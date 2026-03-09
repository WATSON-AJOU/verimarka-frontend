interface HeaderProps {
  isLoggedIn: boolean;
  loading: boolean;
  displayName: string;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export default function Header({
  isLoggedIn,
  loading,
  displayName,
  onOpenLogin,
  onLogout,
}: HeaderProps) {
  return (
    <header className="topbar">
      <div className="topbarLeft">
        <button className="brandButton" type="button" title="홈으로 이동">
          <span className="brandGradient">VeriMarka</span>
        </button>

        <nav className="nav">
          <button className="navIconButton navIconButton--active" type="button">
            홈
          </button>
          <button className="navLink" type="button">
            저작물 등록
          </button>
          <button className="navLink" type="button">
            저작물 검증
          </button>
          <button className="navLink" type="button">
            분석 기록
          </button>
        </nav>
      </div>

      <div className="topbarActions">
        {!loading && !isLoggedIn ? (
          <button className="outlineActionButton" onClick={onOpenLogin}>
            로그인
          </button>
        ) : null}

        {!loading && isLoggedIn ? (
          <>
            <span className="nickname">{displayName}님</span>
            <button className="textActionButton" onClick={onLogout}>
              로그아웃
            </button>
          </>
        ) : null}

        <button className="outlineActionButton">Languages ▾</button>
      </div>
    </header>
  );
}