import { useEffect, useState } from "react";
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
        ? { tone: "available", message: "사용 가능한 비밀번호 형식입니다." }
        : { tone: "duplicate", message: "8자 이상, 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다." };

  const passwordConfirmStatus =
    !passwordConfirm
      ? { tone: "idle", message: "" }
      : password === passwordConfirm
        ? { tone: "available", message: "비밀번호가 일치합니다." }
        : { tone: "duplicate", message: "비밀번호가 일치하지 않습니다." };

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
      setNicknameMessage("닉네임은 30자 이하로 입력해주세요.");
      return;
    }

    if (!nicknameRule.test(trimmed)) {
      setNicknameStatus("duplicate");
      setNicknameMessage("닉네임에는 특수문자를 포함할 수 없습니다.");
      return;
    }

    setNicknameStatus("checking");
    setNicknameMessage("닉네임 확인 중입니다.");

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
  }, [open, nickname]);

  async function checkNicknameAvailability(rawValue: string) {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      setNicknameStatus("idle");
      setNicknameMessage("");
      return false;
    }

    if (trimmed.length > 30) {
      setNicknameStatus("duplicate");
      setNicknameMessage("닉네임은 30자 이하로 입력해주세요.");
      return false;
    }

    if (!nicknameRule.test(trimmed)) {
      setNicknameStatus("duplicate");
      setNicknameMessage("닉네임에는 특수문자를 포함할 수 없습니다.");
      return false;
    }

    setNicknameStatus("checking");
    setNicknameMessage("닉네임 확인 중입니다.");

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
        setErrorMessage("사용 가능한 닉네임인지 확인해주세요.");
        return;
      }
    }

    if (nicknameStatus === "duplicate") {
      setErrorMessage("이미 사용 중인 닉네임입니다.");
      return;
    }

    if (!passwordRule.test(password)) {
      setErrorMessage("비밀번호는 8자 이상이며 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setErrorMessage("이용약관과 개인정보 처리방침에 모두 동의해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
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
        error instanceof Error ? error.message : "회원가입에 실패했습니다.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>
          닫기
        </button>

        <h2 className="authTitle authTitle--tight">회원가입</h2>

        <form className="authForm signupFormModal" onSubmit={handleSubmit}>
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
            비밀번호
            <input
              className="fieldInput"
              type="password"
              placeholder="대소문자, 숫자, 특수문자 포함 8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="fieldHelp">8자 이상, 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.</span>
            {passwordStatus.message ? (
              <span className={`fieldHelp passwordHelp passwordHelp--${passwordStatus.tone}`}>
                {passwordStatus.message}
              </span>
            ) : null}
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
              <span>전체 동의</span>
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
                <span>[필수] 이용약관에 동의합니다</span>
              </div>
              <a className="agreementLink" href="/terms" target="_blank" rel="noreferrer">
                보기
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
                <span>[필수] 개인정보 처리방침에 동의합니다</span>
              </div>
              <a className="agreementLink" href="/privacy" target="_blank" rel="noreferrer">
                보기
              </a>
            </label>
          </div>

          {errorMessage && <p className="formError">{errorMessage}</p>}

          <button className="primaryButton" type="submit" disabled={submitting}>
            {submitting ? "가입 중..." : "회원가입 계속하기"}
          </button>
        </form>

        <p className="authSwitch authSwitch--center">
          이미 회원이신가요?{" "}
          <button type="button" className="textLink" onClick={onLogin}>
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}
