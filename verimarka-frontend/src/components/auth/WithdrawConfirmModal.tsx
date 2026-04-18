interface WithdrawConfirmModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function WithdrawConfirmModal({
  open,
  submitting,
  onClose,
  onConfirm,
}: WithdrawConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard withdrawCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose}>
          닫기
        </button>
        <h2 className="authTitle authTitle--tight">회원 탈퇴</h2>
        <p className="authHint">
          계정은 즉시 비활성화되며 로그인 상태와 프로필 식별 정보는 정리됩니다.
        </p>
        <p className="withdrawWarning">
          진행 후에는 현재 세션이 종료되며, 복구가 필요하면 관리자 문의가 필요할 수 있습니다.
        </p>

        <div className="profileEditActions">
          <button className="secondaryButton" type="button" onClick={onClose} disabled={submitting}>
            취소
          </button>
          <button className="dangerButton" type="button" onClick={() => void onConfirm()} disabled={submitting}>
            {submitting ? "처리 중..." : "탈퇴 진행"}
          </button>
        </div>
      </div>
    </div>
  );
}
