import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export default function LoginSuccessToast({
  open,
  message = "로그인 완료했습니다.",
  duration = 3000,
  onClose,
}: Props) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open) {
      setProgress(100);
      return;
    }

    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(next);
    }, 30);

    const timeout = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="toast">
      <div className="toast__text">{message}</div>
      <div className="toast__bar">
        <div
          className="toast__barFill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}