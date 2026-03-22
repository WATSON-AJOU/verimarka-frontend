interface PhoneRequiredModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onMoveToMyPage: () => void;
}

export default function PhoneRequiredModal({
  open,
  title = "휴대폰 인증이 필요합니다",
  description = "서비스 이용을 위해 마이페이지에서 휴대폰 인증을 완료해주세요.",
  onClose,
  onMoveToMyPage,
}: PhoneRequiredModalProps) {
  if (!open) return null;

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard phoneRequiredCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>
          닫기
        </button>

        <h2 className="authTitle authTitle--tight">{title}</h2>
        <p className="phoneRequiredText">{description}</p>

        <div className="phoneRequiredActions">
          <button className="secondaryButton" type="button" onClick={onClose}>
            닫기
          </button>
          <button className="primaryButton" type="button" onClick={onMoveToMyPage}>
            마이페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
