import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import EmailLoginModal from "./components/auth/EmailLoginModal";
import EmailVerificationModal from "./components/auth/EmailVerificationModal";
import LoginChoiceModal from "./components/auth/LoginChoiceModal";
import LoginSuccessToast from "./components/auth/LoginSuccessToast";
import PhoneVerificationModal from "./components/auth/PhoneVerificationModal";
import PhoneRequiredModal from "./components/auth/PhoneRequiredModal";
import ProfileEditModal from "./components/auth/ProfileEditModal";
import SignupModal from "./components/auth/SignupModal";
import WithdrawConfirmModal from "./components/auth/WithdrawConfirmModal";
import HistoryPage from "./components/pages/HistoryPage";
import HomePage from "./components/pages/HomePage";
import MyPage from "./components/pages/MyPage";
import RegisterPage from "./components/pages/RegisterPage";
import VerifyPage from "./components/pages/VerifyPage";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { useAuth } from "./hooks/useAuth";
import { historyItems, homeActivities, recentUploads, resultConfig, systemCards, tabs } from "./lib/mockData";
import { AUTH_REFRESH_FAILED_EVENT, AUTH_REFRESH_SUCCESS_EVENT, apiRequest } from "./lib/api";
import type { AnalysisStage, ModalType, RegisteredContentResponse, TabName } from "./types/app";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

function getInitial(value: string) {
  const safeValue = value.trim();
  return safeValue ? safeValue.slice(0, 1).toUpperCase() : "V";
}

export default function App() {
  const { user, loading, isLoggedIn, login, signup, logout, withdraw, refreshMe, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [modal, setModal] = useState<ModalType>("none");
  const [toast, setToast] = useState({
    open: false,
    message: "로그인 완료했습니다.",
    duration: 3000,
  });
  const [phoneVerificationModalOpen, setPhoneVerificationModalOpen] = useState(false);
  const [emailVerificationModalOpen, setEmailVerificationModalOpen] = useState(false);
  const [phoneRequiredModalOpen, setPhoneRequiredModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneCodeInput, setPhoneCodeInput] = useState("");
  const [phoneTimer, setPhoneTimer] = useState(0);
  const [sendingPhoneCode, setSendingPhoneCode] = useState(false);
  const [verifyingPhoneCode, setVerifyingPhoneCode] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailCodeInput, setEmailCodeInput] = useState("");
  const [emailTimer, setEmailTimer] = useState(0);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>("idle");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisRequestPending, setAnalysisRequestPending] = useState(false);
  const [contentResult, setContentResult] = useState<RegisteredContentResponse | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "allow" | "review">("all");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const phoneVerified = Boolean(user?.phone_verified);
  const emailVerified = Boolean(user?.email_verified);
  const identityVerified = phoneVerified && emailVerified;
  const displayName = useMemo(() => {
    if (!user) return "";
    return user.display_name || user.nickname || user.username || user.email.split("@")[0] || "회원";
  }, [user]);
  const profileEmail = user?.email || "user@verimarka.com";
  const profilePhone = user?.phone ? formatPhoneNumber(user.phone) : "미인증";
  const avatarInitial = getInitial(displayName);

  useEffect(() => {
    if (!phoneTimer) return;
    const timerId = window.setTimeout(() => setPhoneTimer((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timerId);
  }, [phoneTimer]);

  useEffect(() => {
    if (!emailTimer) return;
    const timerId = window.setTimeout(() => setEmailTimer((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timerId);
  }, [emailTimer]);

  useEffect(() => {
    if (!phoneVerificationModalOpen && !emailVerificationModalOpen) return;
    setPhoneInput(user?.phone ?? "");
    setEmailInput(user?.email ?? "");
  }, [phoneVerificationModalOpen, emailVerificationModalOpen, user?.phone, user?.email]);

  useEffect(() => {
    function handleRefreshSuccess() {
      openToast("세션이 갱신되었습니다.");
    }

    function handleRefreshFailure() {
      setActiveTab("home");
      openToast("세션이 만료되었습니다. 다시 로그인해주세요.");
    }

    window.addEventListener(AUTH_REFRESH_SUCCESS_EVENT, handleRefreshSuccess);
    window.addEventListener(AUTH_REFRESH_FAILED_EVENT, handleRefreshFailure);

    return () => {
      window.removeEventListener(AUTH_REFRESH_SUCCESS_EVENT, handleRefreshSuccess);
      window.removeEventListener(AUTH_REFRESH_FAILED_EVENT, handleRefreshFailure);
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      setAnalysisStage("idle");
      setAnalysisProgress(0);
      setContentResult(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setAnalysisStage("ready");
    setAnalysisProgress(0);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (analysisStage !== "running" || !analysisRequestPending) return;
    const intervalId = window.setInterval(() => {
      setAnalysisProgress((current) => Math.min(92, current + 3 + Math.random() * 6));
    }, 180);
    return () => window.clearInterval(intervalId);
  }, [analysisStage, analysisRequestPending]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return historyItems;
    return historyItems.filter((item) => item.type === historyFilter);
  }, [historyFilter]);

  const registerResult =
    analysisStage === "allow" || analysisStage === "review" || analysisStage === "block"
      ? resultConfig[analysisStage]
      : null;

  function openToast(message: string, duration = 3000) {
    setToast({ open: true, message, duration });
  }

  function closeToast() {
    setToast((current) => ({ ...current, open: false }));
  }

  function promptPhoneRequired(message = "서비스 이용을 위해 마이페이지에서 휴대폰 인증을 완료해주세요.") {
    setPhoneRequiredModalOpen(true);
    openToast(message);
  }

  async function handleLogin(email: string, password: string) {
    await login(email, password);
    setModal("none");
    openToast("로그인되었습니다. 반갑습니다.");
  }

  async function handleSignup(
    email: string,
    username: string,
    password: string,
    termsAgreed: boolean,
    privacyAgreed: boolean,
  ) {
    await signup({
      email,
      username,
      password,
      terms_agreed: termsAgreed,
      privacy_agreed: privacyAgreed,
    });
    setModal("none");
    openToast("회원가입과 로그인이 완료되었습니다.");
  }

  function handleLogout() {
    logout();
    setActiveTab("home");
    setSelectedFile(null);
    setPhoneVerificationModalOpen(false);
    setEmailVerificationModalOpen(false);
    setPhoneRequiredModalOpen(false);
    setProfileEditOpen(false);
    openToast("로그아웃되었습니다.");
    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  }

  async function handleProfileUpdate(payload: { display_name: string }) {
    setProfileSaving(true);
    try {
      await updateProfile(payload);
      setProfileEditOpen(false);
      openToast("프로필이 변경되었습니다.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      await withdraw();
      setWithdrawOpen(false);
      setActiveTab("home");
      setSelectedFile(null);
      setPhoneVerificationModalOpen(false);
      setEmailVerificationModalOpen(false);
      setPhoneRequiredModalOpen(false);
      setPhoneCodeInput("");
      setEmailCodeInput("");
      setPhoneTimer(0);
      setEmailTimer(0);
      setProfileEditOpen(false);
      openToast("회원 탈퇴가 완료되었습니다.");
      window.setTimeout(() => {
        window.location.reload();
      }, 350);
    } finally {
      setWithdrawing(false);
    }
  }

  function moveToTab(nextTab: TabName) {
    const tabConfig = tabs.find((tab) => tab.key === nextTab);
    if (tabConfig?.requiresAuth && !isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 이용 가능합니다.");
      return;
    }
    if (nextTab === "mypage" && !isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 마이페이지를 이용할 수 있습니다.");
      return;
    }
    setActiveTab(nextTab);
  }

  function handlePickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (!/^image\/(jpeg|png)$/.test(nextFile.type)) {
      window.alert("JPG 또는 PNG 파일만 업로드할 수 있습니다.");
      return;
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      window.alert("파일 크기는 20MB 이하만 가능합니다.");
      return;
    }
    setSelectedFile(nextFile);
    setContentResult(null);
    openToast("이미지 업로드가 완료되었습니다.");
  }

  function triggerFilePicker() {
    if (!isLoggedIn) {
      setModal("loginChoice");
      openToast("로그인 후 업로드할 수 있습니다.");
      return;
    }
    uploadInputRef.current?.click();
  }

  async function startAnalysis() {
    if (!selectedFile) {
      window.alert("먼저 업로드할 이미지를 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setAnalysisProgress(8);
    setAnalysisStage("running");
    setAnalysisRequestPending(true);
    setContentResult(null);
    openToast("등록 가능 여부 분석을 요청했습니다.");

    try {
      const response = await apiRequest<RegisteredContentResponse>("/contents/register/", {
        method: "POST",
        auth: true,
        body: formData,
      });

      const decision =
        response.decision === "allow" || response.decision === "review" || response.decision === "block"
          ? response.decision
          : "block";

      setContentResult(response);
      setAnalysisProgress(100);
      setAnalysisStage(decision);
      openToast(
        decision === "allow"
          ? "분석이 완료되었습니다. 등록 가능한 콘텐츠입니다."
          : decision === "review"
            ? "분석이 완료되었습니다. 보류 판정이 생성되었습니다."
            : "분석이 완료되었습니다. 등록 제한 판정이 생성되었습니다.",
      );
    } catch (error) {
      setAnalysisStage("ready");
      setAnalysisProgress(0);
      window.alert(error instanceof Error ? error.message : "등록 가능 여부 확인에 실패했습니다.");
    } finally {
      setAnalysisRequestPending(false);
    }
  }

  async function sendPhoneVerificationCode() {
    const normalizedPhone = phoneInput.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(normalizedPhone)) {
      window.alert("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }

    setSendingPhoneCode(true);
    try {
      await apiRequest("/accounts/phone/send-code/", {
        method: "POST",
        auth: true,
        body: { phone: normalizedPhone },
      });
      setPhoneInput(formatPhoneNumber(normalizedPhone));
      setPhoneTimer(180);
      openToast("인증번호를 전송했습니다. 메시지를 확인해주세요.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setSendingPhoneCode(false);
    }
  }

  async function verifyPhone() {
    const normalizedPhone = phoneInput.replace(/\D/g, "");
    if (!/^\d{6}$/.test(phoneCodeInput)) {
      window.alert("인증번호 6자리를 입력해주세요.");
      return;
    }

    setVerifyingPhoneCode(true);
    try {
      await apiRequest("/accounts/phone/verify-code/", {
        method: "POST",
        auth: true,
        body: { phone: normalizedPhone, code: phoneCodeInput },
      });
      await refreshMe();
      setPhoneCodeInput("");
      setPhoneTimer(0);
      setPhoneVerificationModalOpen(false);
      openToast("휴대폰 인증이 완료되었습니다.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "본인 인증에 실패했습니다.");
    } finally {
      setVerifyingPhoneCode(false);
    }
  }

  async function sendEmailVerificationCode() {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      window.alert("이메일 주소를 정확히 입력해주세요.");
      return;
    }

    setSendingEmailCode(true);
    try {
      await apiRequest("/accounts/email/send-code/", {
        method: "POST",
        auth: true,
        body: { email: normalizedEmail },
      });
      setEmailInput(normalizedEmail);
      setEmailTimer(180);
      openToast("이메일로 인증번호를 전송했습니다.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "이메일 인증번호 발송에 실패했습니다.");
    } finally {
      setSendingEmailCode(false);
    }
  }

  async function verifyEmail() {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!/^\d{6}$/.test(emailCodeInput)) {
      window.alert("이메일 인증번호 6자리를 입력해주세요.");
      return;
    }

    setVerifyingEmailCode(true);
    try {
      await apiRequest("/accounts/email/verify-code/", {
        method: "POST",
        auth: true,
        body: { email: normalizedEmail, code: emailCodeInput },
      });
      await refreshMe();
      setEmailCodeInput("");
      setEmailTimer(0);
      setEmailVerificationModalOpen(false);
      openToast("이메일 인증이 완료되었습니다.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "이메일 인증에 실패했습니다.");
    } finally {
      setVerifyingEmailCode(false);
    }
  }

  return (
    <div className="page-shell">
      <Header
        tabs={tabs}
        activeTab={activeTab}
        loading={loading}
        isLoggedIn={isLoggedIn}
        displayName={displayName}
        avatarInitial={avatarInitial}
        onMoveTab={moveToTab}
        onOpenLogin={() => setModal("loginChoice")}
        onOpenSignup={() => setModal("signup")}
        onLogout={handleLogout}
      />

      <main>
        {activeTab === "home" ? (
          <HomePage systemCards={systemCards} activities={homeActivities} onMoveTab={moveToTab} />
        ) : null}

        {activeTab === "add" ? (
          <RegisterPage
            isLoggedIn={isLoggedIn}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            analysisStage={analysisStage}
            analysisProgress={analysisProgress}
            registerResult={registerResult}
            contentResult={contentResult}
            recentUploads={recentUploads}
            onPickFile={handlePickFile}
            onTriggerPicker={triggerFilePicker}
            onStartAnalysis={startAnalysis}
            onResetToHome={() => {
              setSelectedFile(null);
              setActiveTab("home");
            }}
            onResetToReady={() => {
              setAnalysisStage("ready");
              setAnalysisProgress(0);
            }}
            onSelectAnother={triggerFilePicker}
            onPrimaryAction={() => {
              if (registerResult?.tone === "block") {
                triggerFilePicker();
                return;
              }
              if (!identityVerified) {
                promptPhoneRequired("휴대폰 인증이 필요합니다.");
                return;
              }
              if (registerResult) openToast(registerResult.primaryAction);
            }}
            uploadInputRef={uploadInputRef}
            formatFileSize={formatFileSize}
          />
        ) : null}

        {activeTab === "verify" ? (
          <VerifyPage
            onAttemptUpload={() => {
              if (!identityVerified) {
                promptPhoneRequired("휴대폰 인증이 필요합니다.");
                return;
              }
              openToast("검증 이미지 업로드 기능은 준비 중입니다.");
            }}
          />
        ) : null}

        {activeTab === "history" ? (
          <HistoryPage items={filteredHistory} historyFilter={historyFilter} onFilterChange={setHistoryFilter} />
        ) : null}

        {activeTab === "mypage" ? (
          <MyPage
            displayName={displayName || "VeriMarka 사용자"}
            profileEmail={profileEmail}
            profilePhone={profilePhone}
            avatarInitial={avatarInitial}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            onOpenProfileEdit={() => setProfileEditOpen(true)}
            onOpenPhoneIdentity={() => setPhoneVerificationModalOpen(true)}
            onOpenEmailIdentity={() => setEmailVerificationModalOpen(true)}
            onLogout={handleLogout}
            onOpenWithdraw={() => setWithdrawOpen(true)}
          />
        ) : null}
      </main>

      <Footer />

      <LoginChoiceModal
        open={modal === "loginChoice"}
        onClose={() => setModal("none")}
        onEmailLogin={() => setModal("emailLogin")}
        onSignup={() => setModal("signup")}
      />

      <EmailLoginModal
        open={modal === "emailLogin"}
        onClose={() => setModal("none")}
        onSubmit={handleLogin}
        onSignup={() => setModal("signup")}
      />

      <SignupModal
        open={modal === "signup"}
        onClose={() => setModal("none")}
        onSubmit={handleSignup}
        onLogin={() => setModal("emailLogin")}
      />

      <PhoneVerificationModal
        open={phoneVerificationModalOpen}
        phone={phoneInput}
        phoneCode={phoneCodeInput}
        phoneTimer={phoneTimer}
        sendingPhone={sendingPhoneCode}
        verifyingPhone={verifyingPhoneCode}
        phoneVerified={phoneVerified}
        onPhoneChange={setPhoneInput}
        onPhoneCodeChange={setPhoneCodeInput}
        onClose={() => setPhoneVerificationModalOpen(false)}
        onSendPhoneCode={sendPhoneVerificationCode}
        onVerifyPhone={verifyPhone}
      />

      <PhoneRequiredModal
        open={phoneRequiredModalOpen}
        onClose={() => setPhoneRequiredModalOpen(false)}
        onMoveToMyPage={() => {
          setPhoneRequiredModalOpen(false);
          setActiveTab("mypage");
        }}
      />

      <EmailVerificationModal
        open={emailVerificationModalOpen}
        email={emailInput}
        emailCode={emailCodeInput}
        emailTimer={emailTimer}
        sendingEmail={sendingEmailCode}
        verifyingEmail={verifyingEmailCode}
        emailVerified={emailVerified}
        onEmailChange={setEmailInput}
        onEmailCodeChange={setEmailCodeInput}
        onClose={() => setEmailVerificationModalOpen(false)}
        onSendEmailCode={sendEmailVerificationCode}
        onVerifyEmail={verifyEmail}
      />

      <ProfileEditModal
        open={profileEditOpen}
        initialDisplayName={displayName || ""}
        submitting={profileSaving}
        onClose={() => setProfileEditOpen(false)}
        onSubmit={handleProfileUpdate}
      />

      <WithdrawConfirmModal
        open={withdrawOpen}
        submitting={withdrawing}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
      />

      <LoginSuccessToast
        open={toast.open}
        message={toast.message}
        duration={toast.duration}
        onClose={closeToast}
      />
    </div>
  );
}
