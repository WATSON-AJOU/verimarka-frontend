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

export default function LoginChoiceModal({
  open,
  onClose,
  onEmailLogin,
  onSignup,
}: Props) {
  const { t } = useTranslation();

  function loginWithGoogle() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;

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
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    const url =
      "https://kauth.kakao.com/oauth/authorize" +
      "?response_type=code" +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

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
            disabled
            title={t("auth.appleSoon")}
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
          {" "}및
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
