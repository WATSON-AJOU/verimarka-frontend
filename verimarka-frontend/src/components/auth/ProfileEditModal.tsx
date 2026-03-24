import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const DISPLAY_NAME_REGEX = /^[A-Za-z0-9가-힣 ]+$/;

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
  const [displayNameStatus, setDisplayNameStatus] = useState<"idle" | "checking" | "available" | "duplicate">("idle");
  const [displayNameMessage, setDisplayNameMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setDisplayName(initialDisplayName);
    setErrorMessage("");
    setDisplayNameStatus("idle");
    setDisplayNameMessage("");
  }, [initialDisplayName, open]);

  if (!open) return null;

  async function checkDisplayNameAvailability(rawValue: string) {
    const normalized = rawValue.trim();

    if (!normalized) {
      setDisplayNameStatus("duplicate");
      setDisplayNameMessage("표시명을 입력해주세요.");
      return false;
    }

    if (normalized.length > 20) {
      setDisplayNameStatus("duplicate");
      setDisplayNameMessage("표시명은 20자 이하로 입력해주세요.");
      return false;
    }

    if (!DISPLAY_NAME_REGEX.test(normalized)) {
      setDisplayNameStatus("duplicate");
      setDisplayNameMessage("표시명에는 특수문자를 포함할 수 없습니다.");
      return false;
    }

    if (normalized === initialDisplayName.trim()) {
      setDisplayNameStatus("available");
      setDisplayNameMessage("현재 사용 중인 표시명입니다.");
      return true;
    }

    setDisplayNameStatus("checking");
    setDisplayNameMessage("표시명 확인 중입니다.");

    try {
      const response = await apiRequest<{ available: boolean; message: string }>(
        `/accounts/display-name-availability/?display_name=${encodeURIComponent(normalized)}`,
        { auth: true },
      );
      setDisplayNameStatus(response.available ? "available" : "duplicate");
      setDisplayNameMessage(response.message);
      return response.available;
    } catch {
      setDisplayNameStatus("idle");
      setDisplayNameMessage("");
      return false;
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = displayName.trim();

    if (!normalized) {
      setErrorMessage("표시명을 입력해주세요.");
      return;
    }

    if (normalized.length > 20) {
      setErrorMessage("표시명은 20자 이하로 입력해주세요.");
      return;
    }

    if (!DISPLAY_NAME_REGEX.test(normalized)) {
      setErrorMessage("표시명에는 특수문자를 포함할 수 없습니다.");
      return;
    }

    if (normalized !== initialDisplayName.trim() && displayNameStatus !== "available") {
      const available = await checkDisplayNameAvailability(normalized);
      if (!available) {
        setErrorMessage("사용 가능한 표시명인지 중복 검사를 해주세요.");
        return;
      }
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
            <div className="fieldInputRow">
              <input
                className="fieldInput"
                type="text"
                placeholder="표시명을 입력해주세요"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setDisplayNameStatus("idle");
                  setDisplayNameMessage("");
                }}
                maxLength={20}
                required
              />
              <button
                className="fieldActionButton"
                type="button"
                disabled={displayNameStatus === "checking"}
                onClick={() => {
                  void checkDisplayNameAvailability(displayName);
                }}
              >
                {displayNameStatus === "checking" ? "확인 중" : "중복 검사"}
              </button>
            </div>
            <span className="fieldHelp">표시명은 20자 이하이며 특수문자를 사용할 수 없습니다.</span>
            {displayNameMessage ? (
              <span className={`fieldHelp nicknameHelp nicknameHelp--${displayNameStatus}`}>
                {displayNameMessage}
              </span>
            ) : null}
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
