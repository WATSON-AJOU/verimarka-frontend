import { useEffect, useState } from "react";

interface ProfileEditModalProps {
  open: boolean;
  initialDisplayName: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { display_name: string }) => Promise<void>;
}

export default function ProfileEditModal({
  open,
  initialDisplayName,
  submitting,
  onClose,
  onSubmit,
}: ProfileEditModalProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setDisplayName(initialDisplayName);
    setErrorMessage("");
  }, [initialDisplayName, open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = displayName.trim();

    if (!normalized) {
      setErrorMessage("표시명을 입력해주세요.");
      return;
    }

    if (normalized.length > 50) {
      setErrorMessage("표시명은 50자 이하로 입력해주세요.");
      return;
    }

    setErrorMessage("");
    try {
      await onSubmit({ display_name: normalized });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "프로필 수정에 실패했습니다.");
    }
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard authCard profileEditCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" onClick={onClose}>
          닫기
        </button>

        <h2 className="authTitle authTitle--tight">프로필 수정</h2>
        <p className="authHint">마이페이지와 헤더에 표시될 이름을 변경할 수 있습니다.</p>

        <form className="authForm" onSubmit={handleSubmit}>
          <label className="fieldLabel">
            표시명
            <input
              className="fieldInput"
              type="text"
              placeholder="표시명을 입력해주세요"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={50}
              required
            />
          </label>

          {errorMessage ? <p className="formError">{errorMessage}</p> : null}

          <div className="profileEditActions">
            <button className="secondaryButton" type="button" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button className="primaryButton" type="submit" disabled={submitting}>
              {submitting ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
