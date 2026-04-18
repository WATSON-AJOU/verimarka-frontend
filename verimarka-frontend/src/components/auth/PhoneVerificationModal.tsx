interface PhoneVerificationModalProps {
  open: boolean;
  phone: string;
  phoneCode: string;
  phoneTimer: number;
  sendingPhone: boolean;
  verifyingPhone: boolean;
  phoneVerified: boolean;
  onPhoneChange: (value: string) => void;
  onPhoneCodeChange: (value: string) => void;
  onClose: () => void;
  onSendPhoneCode: () => void;
  onVerifyPhone: () => void;
}

export default function PhoneVerificationModal({
  open,
  phone,
  phoneCode,
  phoneTimer,
  sendingPhone,
  verifyingPhone,
  phoneVerified,
  onPhoneChange,
  onPhoneCodeChange,
  onClose,
  onSendPhoneCode,
  onVerifyPhone,
}: PhoneVerificationModalProps) {
  if (!open) return null;

  const phoneMinutes = String(Math.floor(phoneTimer / 60)).padStart(2, "0");
  const phoneSeconds = String(phoneTimer % 60).padStart(2, "0");

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard identityCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose}>
          닫기
        </button>
        <h2 className="authTitle authTitle--tight">휴대폰 인증</h2>
        <p className="identityDescription">인증 완료 전에는 저작물 등록, 검증, 분석 기록 기능을 사용할 수 없습니다.</p>

        <div className="identitySectionHead">
          <h3>휴대폰 인증</h3>
          <span className={`mypage-chip ${phoneVerified ? "is-verified" : "is-pending"}`}>
            {phoneVerified ? "인증 완료" : "인증 필요"}
          </span>
        </div>

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
              value={phoneCode}
              onChange={(event) => onPhoneCodeChange(event.target.value)}
            />
          </label>
          <button className="secondaryButton" type="button" onClick={onSendPhoneCode} disabled={sendingPhone}>
            {sendingPhone ? "발송 중..." : "인증번호 전송"}
          </button>
        </div>

        <div className="identityTimer">남은 시간 {phoneMinutes}:{phoneSeconds}</div>

        <button className="primaryButton" type="button" onClick={onVerifyPhone} disabled={verifyingPhone}>
          {verifyingPhone ? "확인 중..." : phoneVerified ? "휴대폰 인증 완료" : "휴대폰 인증 완료"}
        </button>
      </div>
    </div>
  );
}
