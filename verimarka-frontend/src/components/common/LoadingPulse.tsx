import { useEffect, useMemo, useState } from "react";

interface LoadingPulseProps {
  message?: string;
  fallbackMessage: string;
  messages: string[];
}

export default function LoadingPulse({ message, fallbackMessage, messages }: LoadingPulseProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const statusMessages = useMemo(() => {
    const primaryMessage = message?.trim() || fallbackMessage;
    return [primaryMessage, ...messages].filter((value, index, array) => value && array.indexOf(value) === index);
  }, [fallbackMessage, message, messages]);

  useEffect(() => {
    if (statusMessages.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % statusMessages.length);
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [statusMessages.length]);

  const displayedMessage = statusMessages[messageIndex % statusMessages.length] || fallbackMessage;

  return (
    <div className="loading-pulse" aria-live="polite">
      <div className="loading-pulse-status">
        <span className="loading-pulse-spinner" aria-hidden="true" />
        <strong>{displayedMessage}</strong>
      </div>
      <div className="loading-pulse-bar" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
