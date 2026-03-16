interface IdentityModalProps {
  open: boolean;
  phone: string;
  code: string;
  timer: number;
  sending: boolean;
  verifying: boolean;
  onPhoneChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onSendCode: () => void;
  onVerify: () => void;
}

export default function IdentityModal({
  open,
  phone,
  code,
  timer,
  sending,
  verifying,
  onPhoneChange,
  onCodeChange,
  onClose,
  onSendCode,
  onVerify,
}: IdentityModalProps) {
  if (!open) return null;

  const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
  const seconds = String(timer % 60).padStart(2, "0");

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard identityCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>
          닫기
        </button>
        <h2 className="authTitle authTitle--tight">휴대폰 본인 인증</h2>
        <p className="identityDescription">
          인증 완료 전에는 저작물 등록, 검증, 분석 기록 기능을 사용할 수 없습니다.
        </p>

        <label className="fieldLabel">
          휴대폰 번호
          <input
            className="fieldInput"
            type="tel"
            placeholder="01012345678"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
          />
        </label>

        <div className="identityRow">
          <label className="fieldLabel identityCodeField">
            인증번호
            <input
              className="fieldInput"
              type="text"
              inputMode="numeric"
              placeholder="6자리 입력"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
            />
          </label>
          <button className="secondaryButton" type="button" onClick={onSendCode} disabled={sending}>
            {sending ? "발송 중..." : "인증번호 전송"}
          </button>
        </div>

        <div className="identityTimer">남은 시간 {minutes}:{seconds}</div>

        <button className="primaryButton" type="button" onClick={onVerify} disabled={verifying}>
          {verifying ? "확인 중..." : "본인 인증 완료"}
        </button>
      </div>
    </div>
  );
}
