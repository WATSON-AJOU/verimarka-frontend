import LoginChoiceModal from "../auth/LoginChoiceModal";
import EmailLoginModal from "../auth/EmailLoginModal";
import SignupModal from "../auth/SignupModal";
import WalletConnectModal from "../auth/WalletConnectModal";
import PhoneVerificationModal from "../auth/PhoneVerificationModal";
import PhoneRequiredModal from "../auth/PhoneRequiredModal";
import EmailVerificationModal from "../auth/EmailVerificationModal";
import ProfileEditModal from "../auth/ProfileEditModal";
import WithdrawConfirmModal from "../auth/WithdrawConfirmModal";
import LoginSuccessToast from "../auth/LoginSuccessToast";
import type { AppController } from "../../hooks/useAppController";

interface AppModalsProps {
  controller: AppController;
}

export default function AppModals({ controller }: AppModalsProps) {
  return (
    <>
      <LoginChoiceModal
        open={controller.auth.modal === "loginChoice"}
        onClose={() => controller.auth.setModal("none")}
        onEmailLogin={() => controller.auth.setModal("emailLogin")}
        onSignup={() => controller.auth.setModal("signup")}
      />

      <EmailLoginModal
        open={controller.auth.modal === "emailLogin"}
        onClose={() => controller.auth.setModal("none")}
        onSubmit={controller.auth.handleLogin}
        onSignup={() => controller.auth.setModal("signup")}
      />

      <SignupModal
        open={controller.auth.modal === "signup"}
        onClose={() => controller.auth.setModal("none")}
        onSubmit={controller.auth.handleSignup}
        onLogin={() => controller.auth.setModal("emailLogin")}
      />

      <WalletConnectModal
        open={controller.wallet.walletConnectModalOpen}
        connectors={controller.wallet.walletModalConnectors}
        walletConnectEnabled={controller.common.walletConnectEnabled}
        connecting={controller.wallet.walletConnecting}
        connectingLabel={controller.wallet.walletConnectingLabel}
        onClose={() => controller.wallet.setWalletConnectModalOpen(false)}
        onSelectConnector={(connector) => {
          void controller.wallet.connectWalletWithConnector(connector.id);
        }}
      />

      <PhoneVerificationModal
        open={controller.identity.phoneVerificationModalOpen}
        phone={controller.identity.phoneInput}
        phoneCode={controller.identity.phoneCodeInput}
        phoneTimer={controller.identity.phoneTimer}
        sendingPhone={controller.identity.sendingPhoneCode}
        verifyingPhone={controller.identity.verifyingPhoneCode}
        phoneVerified={controller.session.phoneVerified}
        onPhoneChange={controller.identity.setPhoneInput}
        onPhoneCodeChange={controller.identity.setPhoneCodeInput}
        onClose={() => controller.identity.setPhoneVerificationModalOpen(false)}
        onSendPhoneCode={controller.identity.sendPhoneVerificationCode}
        onVerifyPhone={controller.identity.verifyPhone}
      />

      <PhoneRequiredModal
        open={controller.identity.phoneRequiredModalOpen}
        onClose={() => controller.identity.setPhoneRequiredModalOpen(false)}
        onMoveToMyPage={() => {
          controller.identity.setPhoneRequiredModalOpen(false);
          controller.navigation.navigateToTab("mypage");
        }}
      />

      <EmailVerificationModal
        open={controller.identity.emailVerificationModalOpen}
        email={controller.identity.emailInput}
        emailCode={controller.identity.emailCodeInput}
        emailTimer={controller.identity.emailTimer}
        sendingEmail={controller.identity.sendingEmailCode}
        verifyingEmail={controller.identity.verifyingEmailCode}
        emailVerified={controller.session.emailVerified}
        onEmailChange={controller.identity.setEmailInput}
        onEmailCodeChange={controller.identity.setEmailCodeInput}
        onClose={() => controller.identity.setEmailVerificationModalOpen(false)}
        onSendEmailCode={controller.identity.sendEmailVerificationCode}
        onVerifyEmail={controller.identity.verifyEmail}
      />

      <ProfileEditModal
        open={controller.auth.profileEditOpen}
        initialDisplayName={controller.session.displayName || ""}
        submitting={controller.auth.profileSaving}
        onClose={() => controller.mypage.setProfileEditOpen(false)}
        onSubmit={controller.auth.handleProfileUpdate}
      />

      <WithdrawConfirmModal
        open={controller.auth.withdrawOpen}
        submitting={controller.auth.withdrawing}
        onClose={() => controller.mypage.setWithdrawOpen(false)}
        onConfirm={controller.auth.handleWithdraw}
      />

      <LoginSuccessToast
        toastId={controller.toast.toast.id}
        open={controller.toast.toast.open}
        message={controller.toast.toast.message}
        duration={controller.toast.toast.duration}
        onClose={controller.toast.closeToast}
      />
    </>
  );
}
