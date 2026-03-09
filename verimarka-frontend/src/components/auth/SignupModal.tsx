import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string, username: string, password: string) => Promise<void>;
  onLogin: () => void;
}

export default function SignupModal({
  open,
  onClose,
  onSubmit,
  onLogin,
}: Props) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await onSubmit(email, username, password);
      setEmail("");
      setUsername("");
      setPassword("");
      setPasswordConfirm("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "회원가입에 실패했습니다.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard authCard" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>
          닫기
        </button>

        <h2 className="authTitle authTitle--tight">회원가입</h2>

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
            닉네임
            <input
              className="fieldInput"
              type="text"
              placeholder="사용할 닉네임 입력"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          <label className="fieldLabel">
            비밀번호 확인
            <input
              className="fieldInput"
              type="password"
              placeholder="비밀번호를 다시 입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </label>

          {errorMessage && <p className="formError">{errorMessage}</p>}

          <button className="primaryButton" type="submit" disabled={submitting}>
            {submitting ? "가입 중..." : "회원가입 계속하기"}
          </button>
        </form>

        <p className="authSwitch">
          이미 회원이신가요?{" "}
          <button type="button" className="textLink" onClick={onLogin}>
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}