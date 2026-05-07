import appleLogo from "../../assets/applelogo.svg";
import googleLogo from "../../assets/googlelogo.svg";
import kakaoLogo from "../../assets/kakaologo.svg";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  onEmailLogin: () => void;
  onSignup: () => void;
}

const APPLE_OAUTH_STATE_KEY = "verimarka:oauth:apple:state";

export default function LoginChoiceModal({
  open,
  onClose,
  onEmailLogin,
  onSignup,
}: Props) {
  const { t } = useTranslation();

  function loginWithGoogle() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri =
      import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
      `${window.location.origin}/auth/google/callback`;

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
    const redirectUri =
      import.meta.env.VITE_KAKAO_REDIRECT_URI ||
      `${window.location.origin}/auth/kakao/callback`;

    const url =
      "https://kauth.kakao.com/oauth/authorize" +
      "?response_type=code" +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = url;
  }

  function loginWithApple() {
    const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
    if (!clientId) {
      window.alert("Apple 로그인 설정이 누락되었습니다.");
      return;
    }
    const redirectUri =
      import.meta.env.VITE_APPLE_REDIRECT_URI ||
      `${window.location.origin}/auth/apple/callback`;
    const state = crypto.randomUUID();
    window.sessionStorage.setItem(APPLE_OAUTH_STATE_KEY, state);

    const url =
      "https://appleid.apple.com/auth/authorize" +
      "?response_type=code" +
      "&response_mode=query" +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      "&scope=name%20email" +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = url;
  }

  if (!open) return null;

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose}>
          {t("auth.close")}
        </button>

        <h2 className="authTitle">{t("auth.login")}</h2>

        <p className="authHint authHint--center">{t("auth.firstLoginNotice")}</p>

        <div className="authActions">
          <button
            type="button"
            className="socialButton socialButton--google"
            onClick={loginWithGoogle}
          >
            <img className="socialButton__icon" src={googleLogo} alt="" aria-hidden="true" />
            {t("auth.continueWithGoogle")}
          </button>

          <button
            type="button"
            className="socialButton socialButton--apple"
            onClick={loginWithApple}
          >
            <img className="socialButton__icon socialButton__icon--apple" src={appleLogo} alt="" aria-hidden="true" />
            {t("auth.continueWithApple")}
          </button>

          <button
            type="button"
            className="socialButton socialButton--kakao"
            onClick={loginWithKakao}
          >
            <img className="socialButton__icon" src={kakaoLogo} alt="" aria-hidden="true" />
            {t("auth.continueWithKakao")}
          </button>

          <button className="emailLoginButton" type="button" onClick={onEmailLogin}>
            {t("auth.emailLogin")}
          </button>
        </div>

        <p className="oauthAgreementText">
          {t("auth.agreePrefix")}{" "}
          <a href="/terms" target="_blank" rel="noreferrer">
            {t("auth.terms")}
          </a>
          {" "}{t("auth.agreeJoiner")}
          <br />
          <a href="/privacy" target="_blank" rel="noreferrer">
            {t("auth.privacy")}
          </a>
          {t("auth.agreeSuffix")}
        </p>

        <p className="authSwitch authSwitch--center">
          {t("auth.notMember")}{" "}
          <button type="button" className="textLink" onClick={onSignup}>
            {t("auth.signup")}
          </button>
        </p>
      </div>
    </div>
  );
}
