interface Props {
  open: boolean;
  onClose: () => void;
  onEmailLogin: () => void;
  onSignup: () => void;
}

export default function LoginChoiceModal({
  open,
  onClose,
  onEmailLogin,
  onSignup,
}: Props) {
  function loginWithGoogle() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = "http://localhost:5173/auth/google/callback";

    const url =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      "?response_type=code" +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      "&scope=openid%20email%20profile" +
      "&access_type=offline";

    window.location.href = url;
  }

  function loginWithKakao() {
    const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = "http://localhost:5173/auth/kakao/callback";

    const url =
      "https://kauth.kakao.com/oauth/authorize" +
      "?response_type=code" +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = url;
  }

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard authCard" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>
          닫기
        </button>

        <div className="authLogo">🍇</div>
        <h2 className="authTitle">로그인</h2>

        <div className="authActions">
          <button
            className="socialButton socialButton--google"
            onClick={loginWithGoogle}
          >
            Google로 계속하기
          </button>

          <button
            className="socialButton socialButton--apple"
            disabled
            title="준비중"
          >
            Apple로 계속하기
          </button>

          <button
            className="socialButton socialButton--kakao"
            onClick={loginWithKakao}
          >
            Kakao로 계속하기
          </button>

          <button className="emailLoginButton" onClick={onEmailLogin}>
            이메일로 로그인
          </button>
        </div>

        <p className="authHint">최초 로그인 시 자동으로 회원가입이 진행됩니다.</p>

        <p className="authSwitch">
          회원이 아니신가요?{" "}
          <button type="button" className="textLink" onClick={onSignup}>
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
}