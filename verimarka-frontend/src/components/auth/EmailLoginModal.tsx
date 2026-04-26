import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
  onSignup: () => void;
}

export default function EmailLoginModal({
  open,
  onClose,
  onSubmit,
  onSignup,
}: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      await onSubmit(email, password);
      setEmail("");
      setPassword("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.loginFailed");
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

        <h2 className="authTitle authTitle--tight">{t("auth.login")}</h2>

        <form className="authForm" onSubmit={handleSubmit}>
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
            {t("auth.password")}
            <input
              className="fieldInput"
              type="password"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {errorMessage && <p className="formError">{errorMessage}</p>}

          <button className="primaryButton" type="submit" disabled={submitting}>
            {submitting ? t("auth.loginSubmitting") : t("auth.continueLogin")}
          </button>
        </form>

        <p className="authSwitch">
          {t("auth.notMember")}{" "}
          <button type="button" className="textLink" onClick={onSignup}>
            {t("auth.signup")}
          </button>
        </p>
      </div>
    </div>
  );
}
