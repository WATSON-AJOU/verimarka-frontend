interface EmailVerificationModalProps {
  open: boolean;
  email: string;
  emailCode: string;
  emailTimer: number;
  sendingEmail: boolean;
  verifyingEmail: boolean;
  emailVerified: boolean;
  onEmailChange: (value: string) => void;
  onEmailCodeChange: (value: string) => void;
  onClose: () => void;
  onSendEmailCode: () => void;
  onVerifyEmail: () => void;
}

export default function EmailVerificationModal({
  open,
  email,
  emailCode,
  emailTimer,
  sendingEmail,
  verifyingEmail,
  emailVerified,
  onEmailChange,
  onEmailCodeChange,
  onClose,
  onSendEmailCode,
  onVerifyEmail,
}: EmailVerificationModalProps) {
  if (!open) return null;

  const emailMinutes = String(Math.floor(emailTimer / 60)).padStart(2, "0");
  const emailSeconds = String(emailTimer % 60).padStart(2, "0");

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard identityCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>
          닫기
        </button>
        <h2 className="authTitle authTitle--tight">이메일 인증</h2>
        <p className="identityDescription">서비스 이용을 위해 계정 이메일 인증을 완료해주세요.</p>

        <div className="identitySectionHead">
          <h3>이메일 인증</h3>
          <span className={`mypage-chip ${emailVerified ? "is-verified" : "is-pending"}`}>
            {emailVerified ? "인증 완료" : "인증 필요"}
          </span>
        </div>

        <label className="fieldLabel">
          이메일
          <input
            className="fieldInput"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </label>

        <div className="identityRow">
          <label className="fieldLabel identityCodeField">
            이메일 인증번호
            <input
              className="fieldInput"
              type="text"
              inputMode="numeric"
              placeholder="6자리 입력"
              value={emailCode}
              onChange={(event) => onEmailCodeChange(event.target.value)}
            />
          </label>
          <button className="secondaryButton" type="button" onClick={onSendEmailCode} disabled={sendingEmail}>
            {sendingEmail ? "발송 중..." : "이메일 전송"}
          </button>
        </div>

        <div className="identityTimer">남은 시간 {emailMinutes}:{emailSeconds}</div>

        <button className="primaryButton" type="button" onClick={onVerifyEmail} disabled={verifyingEmail}>
          {verifyingEmail ? "확인 중..." : emailVerified ? "이메일 인증 완료" : "이메일 인증 완료"}
        </button>
      </div>
    </div>
  );
}
