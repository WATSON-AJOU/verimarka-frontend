import { useState } from "react";

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
        error instanceof Error ? error.message : "로그인에 실패했습니다.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose}>
          닫기
        </button>

        <h2 className="authTitle authTitle--tight">로그인</h2>

        <form className="authForm" onSubmit={handleSubmit}>
          <label className="fieldLabel">
            이메일
            <input
              className="fieldInput"
              type="email"
              placeholder="example@verimarka.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="fieldLabel">
            비밀번호
            <input
              className="fieldInput"
              type="password"
              placeholder="8자 이상 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {errorMessage && <p className="formError">{errorMessage}</p>}

          <button className="primaryButton" type="submit" disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인 계속하기"}
          </button>
        </form>

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
