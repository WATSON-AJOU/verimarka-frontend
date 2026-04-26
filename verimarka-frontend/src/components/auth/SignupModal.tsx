import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../../lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    email: string,
    nickname: string,
    password: string,
    termsAgreed: boolean,
    privacyAgreed: boolean,
  ) => Promise<void>;
  onLogin: () => void;
}

export default function SignupModal({
  open,
  onClose,
  onSubmit,
  onLogin,
}: Props) {
  const { t } = useTranslation();
  const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  const nicknameRule = /^[A-Za-z0-9가-힣 ]+$/;
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "duplicate">("idle");
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const passwordStatus =
    !password
      ? { tone: "idle", message: "" }
      : passwordRule.test(password)
        ? { tone: "available", message: t("auth.passwordAvailable") }
        : { tone: "duplicate", message: t("auth.passwordRule") };

  const passwordConfirmStatus =
    !passwordConfirm
      ? { tone: "idle", message: "" }
      : password === passwordConfirm
        ? { tone: "available", message: t("auth.passwordAvailable") }
        : { tone: "duplicate", message: t("auth.passwordMismatch") };

  useEffect(() => {
    if (!open) return;
    const trimmed = nickname.trim();

    if (!trimmed) {
      setNicknameStatus("idle");
      setNicknameMessage("");
      return;
    }

    if (trimmed.length > 30) {
      setNicknameStatus("duplicate");
      setNicknameMessage(t("auth.nicknameTooLong"));
      return;
    }

    if (!nicknameRule.test(trimmed)) {
      setNicknameStatus("duplicate");
      setNicknameMessage(t("auth.nicknameInvalid"));
      return;
    }

    setNicknameStatus("checking");
    setNicknameMessage(t("auth.nicknameChecking"));

    const timer = window.setTimeout(async () => {
      try {
        const response = await apiRequest<{ available: boolean; message: string }>(
          `/accounts/nickname-availability/?nickname=${encodeURIComponent(trimmed)}`,
        );
        setNicknameStatus(response.available ? "available" : "duplicate");
        setNicknameMessage(response.message);
      } catch {
        setNicknameStatus("idle");
        setNicknameMessage("");
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [open, nickname, t]);

  async function checkNicknameAvailability(rawValue: string) {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      setNicknameStatus("idle");
      setNicknameMessage("");
      return false;
    }

    if (trimmed.length > 30) {
      setNicknameStatus("duplicate");
      setNicknameMessage(t("auth.nicknameTooLong"));
      return false;
    }

    if (!nicknameRule.test(trimmed)) {
      setNicknameStatus("duplicate");
      setNicknameMessage(t("auth.nicknameInvalid"));
      return false;
    }

    setNicknameStatus("checking");
    setNicknameMessage(t("auth.nicknameChecking"));

    try {
      const response = await apiRequest<{ available: boolean; message: string }>(
        `/accounts/nickname-availability/?nickname=${encodeURIComponent(trimmed)}`,
      );
      setNicknameStatus(response.available ? "available" : "duplicate");
      setNicknameMessage(response.message);
      return response.available;
    } catch {
      setNicknameStatus("idle");
      setNicknameMessage("");
      return false;
    }
  }

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (nicknameStatus !== "available") {
      const available = await checkNicknameAvailability(nickname);
      if (!available) {
        setErrorMessage(t("auth.nicknameRequired"));
        return;
      }
    }

    if (nicknameStatus === "duplicate") {
      setErrorMessage(t("auth.nicknameDuplicate"));
      return;
    }

    if (!passwordRule.test(password)) {
      setErrorMessage(t("auth.passwordRule"));
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setErrorMessage(t("auth.mustAgree"));
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage(t("auth.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await onSubmit(email, nickname, password, agreeTerms, agreePrivacy);
      setEmail("");
      setNickname("");
      setNicknameStatus("idle");
      setNicknameMessage("");
      setPassword("");
      setPasswordConfirm("");
      setAgreeAll(false);
      setAgreeTerms(false);
      setAgreePrivacy(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.signupFailed");
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose}>
          {t("auth.close")}
        </button>

        <h2 className="authTitle authTitle--tight">{t("auth.signup")}</h2>

        <form className="authForm signupFormModal" onSubmit={handleSubmit}>
          <label className="fieldLabel">
            {t("auth.email")}
            <input
              className="fieldInput"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="fieldLabel">
            {t("auth.nickname")}
            <input
              className="fieldInput"
              type="text"
              placeholder={t("auth.nicknamePlaceholder")}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onBlur={() => {
                void checkNicknameAvailability(nickname);
              }}
              required
            />
            {nicknameMessage ? (
              <span className={`fieldHelp nicknameHelp nicknameHelp--${nicknameStatus}`}>
                {nicknameMessage}
              </span>
            ) : null}
          </label>

          <label className="fieldLabel">
            {t("auth.password")}
            <input
              className="fieldInput"
              type="password"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="fieldHelp">{t("auth.passwordRule")}</span>
            {passwordStatus.message ? (
              <span className={`fieldHelp passwordHelp passwordHelp--${passwordStatus.tone}`}>
                {passwordStatus.message}
              </span>
            ) : null}
          </label>

          <label className="fieldLabel">
            {t("auth.passwordConfirm")}
            <input
              className="fieldInput"
              type="password"
              placeholder={t("auth.passwordConfirmPlaceholder")}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
            {passwordConfirmStatus.message ? (
              <span className={`fieldHelp passwordHelp passwordHelp--${passwordConfirmStatus.tone}`}>
                {passwordConfirmStatus.message}
              </span>
            ) : null}
          </label>

          <div className="agreementSection">
            <label className="agreementRow agreementRow--all">
              <input
                type="checkbox"
                checked={agreeAll}
                onChange={(event) => {
                  const nextValue = event.target.checked;
                  setAgreeAll(nextValue);
                  setAgreeTerms(nextValue);
                  setAgreePrivacy(nextValue);
                }}
              />
              <span>{t("auth.agreeAll")}</span>
            </label>

            <label className="agreementRow">
              <div className="agreementLabel">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setAgreeTerms(nextValue);
                    setAgreeAll(nextValue && agreePrivacy);
                  }}
                />
                <span>{t("auth.agreeTerms")}</span>
              </div>
              <a className="agreementLink" href="/terms" target="_blank" rel="noreferrer">
                {t("auth.terms")}
              </a>
            </label>

            <label className="agreementRow">
              <div className="agreementLabel">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setAgreePrivacy(nextValue);
                    setAgreeAll(agreeTerms && nextValue);
                  }}
                />
                <span>{t("auth.agreePrivacy")}</span>
              </div>
              <a className="agreementLink" href="/privacy" target="_blank" rel="noreferrer">
                {t("auth.privacy")}
              </a>
            </label>
          </div>

          {errorMessage && <p className="formError">{errorMessage}</p>}

          <button className="primaryButton" type="submit" disabled={submitting}>
            {submitting ? t("auth.signupSubmitting") : t("auth.continueSignup")}
          </button>
        </form>

        <p className="authSwitch authSwitch--center">
          {t("auth.alreadyMember")}{" "}
          <button type="button" className="textLink" onClick={onLogin}>
            {t("auth.login")}
          </button>
        </p>
      </div>
    </div>
  );
}
