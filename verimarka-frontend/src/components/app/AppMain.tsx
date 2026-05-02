import Header from "../layout/Header";
import Footer from "../layout/Footer";
import HomePage from "../pages/HomePage";
import RegisterPage from "../pages/RegisterPage";
import VerifyPage from "../pages/VerifyPage";
import HistoryPage from "../pages/HistoryPage";
import MyPage from "../pages/MyPage";
import type { AppController } from "../../hooks/useAppController";

interface AppMainProps {
  controller: AppController;
}

export default function AppMain({ controller }: AppMainProps) {
  return (
    <div className="page-shell">
      <Header
        tabs={controller.navigation.tabs}
        activeTab={controller.navigation.activeTab}
        loading={controller.session.loading}
        isLoggedIn={controller.session.isLoggedIn}
        displayName={controller.session.displayName}
        avatarInitial={controller.session.avatarInitial}
        onMoveTab={controller.navigation.moveToHeaderTab}
        onOpenLogin={() => controller.auth.setModal("loginChoice")}
        onOpenSignup={() => controller.auth.setModal("signup")}
        onLogout={controller.auth.handleLogout}
      />

      <main>
        {controller.navigation.activeTab === "home" ? (
          <HomePage
            systemCards={controller.home.systemCards}
            activities={controller.home.recentActivities}
            onMoveTab={controller.navigation.moveToTab}
            onCastReviewVote={controller.home.castHistoryReviewVote}
            reviewVoteSubmitting={controller.home.historyVoteSubmitting}
          />
        ) : null}

        {controller.navigation.activeTab === "add" ? (
          <RegisterPage
            isLoggedIn={controller.session.isLoggedIn}
            selectedFile={controller.register.selectedFile}
            previewUrl={controller.register.previewUrl}
            analysisStage={controller.register.analysisStage}
            analysisProgress={controller.register.analysisProgress}
            registerResult={controller.register.registerResult}
            contentResult={controller.register.contentResult}
            recentUploads={controller.register.recentUploads}
            onOpenOngoingVote={controller.common.openOngoingVoteHistory}
            onPickFile={controller.register.handlePickFile}
            onTriggerPicker={controller.register.triggerFilePicker}
            onStartAnalysis={controller.register.startAnalysis}
            onResetToHome={() => {
              controller.register.setSelectedFile(null);
              controller.navigation.navigateToTab("home");
            }}
            onResetToReady={controller.register.resetRegisterFlow}
            onSelectAnother={() => {
              controller.register.setSelectedFile(null);
              controller.register.setPreviewUrl("");
              controller.register.resetRegisterFlow();
              controller.register.triggerFilePicker();
            }}
            onPrimaryAction={() => {
              if (controller.register.registerResult?.tone === "block") {
                controller.register.triggerFilePicker();
                return;
              }
              if (!controller.session.phoneVerified) {
                controller.register.promptPhoneRequired("휴대폰 인증이 필요합니다.");
                return;
              }
              if (controller.register.registerResult?.tone === "allow") {
                if (controller.register.contentResult?.watermark?.applied) {
                  void controller.register.startMint();
                  return;
                }
                void controller.register.startWatermark();
                return;
              }
              if (controller.register.registerResult?.tone === "review") {
                controller.register.setReviewConsentNotifyByEmail(false);
                controller.register.setReviewConsentOpenedAt(Date.now());
                controller.register.setReviewConsentModalOpen(true);
                return;
              }
              if (controller.register.registerResult) {
                controller.register.openToast(controller.register.registerResult.primaryAction);
              }
            }}
            onDownloadWatermarked={() => {
              const currentContent = controller.register.contentResult;
              const watermarkDownloadUrl = currentContent?.public_id
                ? `/api/contents/${currentContent.public_id}/watermark-download/`
                : null;
              if (watermarkDownloadUrl) {
                void (async () => {
                  await controller.register.saveFileWithPicker(
                    watermarkDownloadUrl,
                    controller.register.buildWatermarkedFileName(
                      controller.register.selectedFile?.name || currentContent?.original_filename || "watermarked.jpg",
                    ),
                  );
                  controller.register.openToast("이미지 다운로드에 성공했습니다.");
                })();
                return;
              }
              controller.register.openToast("워터마크 결과 파일이 아직 준비되지 않았습니다.");
            }}
            onMoveToHistory={() => controller.navigation.navigateToTab("history")}
            onCopyVerificationUrl={() => {
              void navigator.clipboard.writeText(window.location.href);
              controller.toast.openToast("URL 복사가 완료되었습니다.");
            }}
            uploadInputRef={controller.register.uploadInputRef}
            formatFileSize={controller.common.formatFileSize}
            reviewVoteProgress={controller.register.reviewVoteProgress}
            emailVerified={controller.session.emailVerified}
            emailAddress={controller.session.user?.email || "-"}
            reviewConsentModalOpen={controller.register.reviewConsentModalOpen}
            reviewConsentNotifyByEmail={controller.register.reviewConsentNotifyByEmail}
            reviewConsentEndAtLabel={controller.register.reviewConsentEndAtLabel}
            reviewVoteDraft={controller.register.reviewVoteDraft}
            reviewVoteModalOpen={controller.register.reviewVoteModalOpen}
            watermarkProgress={controller.register.watermarkProgress}
            mintProgress={controller.register.mintProgress}
            mintErrorMessage={controller.register.mintErrorMessage}
            onCloseReviewConsentModal={() => controller.register.setReviewConsentModalOpen(false)}
            onToggleReviewConsentNotify={() => {
              if (!controller.session.emailVerified) return;
              controller.register.setReviewConsentNotifyByEmail((current) => !current);
            }}
            onConfirmReviewConsent={() => {
              controller.register.setReviewConsentModalOpen(false);
              void controller.register.startReviewVote();
            }}
            onOpenReviewVoteModal={() => controller.register.setReviewVoteModalOpen(true)}
            onCloseReviewVoteModal={() => controller.register.setReviewVoteModalOpen(false)}
            onCastReviewVote={(choice) => {
              void controller.register.castReviewVote(choice).catch(() => {
                // vote handler already normalizes feedback
              });
            }}
            onRefreshReviewVote={() => {
              if (!controller.register.contentResult?.public_id) {
                void controller.register.refreshReviewVote();
                return;
              }
              controller.common.openOngoingVoteHistory(controller.register.contentResult.public_id);
            }}
          />
        ) : null}

        {controller.navigation.activeTab === "verify" ? (
          <VerifyPage
            selectedFile={controller.verify.selectedFile}
            previewUrl={controller.verify.previewUrl}
            verifyProgress={controller.verify.verifyProgress}
            verifyRunning={controller.verify.verifyRunning}
            verifyResult={controller.verify.verifyResult}
            verifierName={controller.session.verifyUserLabel}
            verifyRequestedAt={controller.verify.verifyRequestedAt}
            recentItems={controller.verify.recentItems}
            onOpenOngoingVote={controller.common.openOngoingVoteHistory}
            uploadInputRef={controller.verify.uploadInputRef}
            formatFileSize={controller.common.formatFileSize}
            onPickFile={controller.verify.handlePickVerifyFile}
            onTriggerPicker={controller.verify.triggerVerifyPicker}
            onStartVerify={controller.verify.startVerify}
            onResetVerify={controller.verify.resetVerifyFlow}
          />
        ) : null}

        {controller.navigation.activeTab === "history" ? (
          <HistoryPage
            items={controller.history.filteredHistory}
            historyFilter={controller.history.historyFilter}
            onFilterChange={controller.history.setHistoryFilter}
            onOpenToast={controller.toast.openToast}
            onCastReviewVote={controller.history.castHistoryReviewVote}
            onResumeAllowFlow={controller.history.openAllowHistoryFlow}
            reviewVoteSubmitting={controller.history.historyVoteSubmitting}
            initialExpandedId={controller.navigation.historyEntryFromUrl}
            initialDetailType={controller.navigation.historyDetailTypeFromUrl}
          />
        ) : null}

        {controller.navigation.activeTab === "mypage" ? (
          <MyPage
            displayName={controller.session.displayName || "VeriMarka 사용자"}
            profileEmail={controller.session.profileEmail}
            profilePhone={controller.session.profilePhone}
            lastLoginLabel={controller.session.lastLoginLabel}
            avatarInitial={controller.session.avatarInitial}
            emailVerified={controller.session.emailVerified}
            phoneVerified={controller.session.phoneVerified}
            walletAddress={controller.mypage.linkedWalletAddress}
            walletNetworkLabel={controller.mypage.walletNetworkLabel}
            walletTypeLabel={controller.mypage.walletTypeLabel}
            nftCount={controller.mypage.walletSummary.nft_count}
            voteMinimum={controller.mypage.walletSummary.vote_minimum}
            voteEligible={controller.mypage.walletSummary.vote_eligible}
            walletLookupStatus={controller.mypage.walletSummary.lookup_status}
            walletLookupError={controller.mypage.walletSummary.lookup_error}
            walletSummaryLoading={controller.mypage.walletSummaryLoading}
            walletConnecting={controller.mypage.walletConnecting}
            walletDisconnecting={controller.mypage.walletDisconnecting}
            onOpenProfileEdit={() => controller.mypage.setProfileEditOpen(true)}
            onOpenPhoneIdentity={() => controller.mypage.setPhoneVerificationModalOpen(true)}
            onOpenEmailIdentity={() => controller.mypage.setEmailVerificationModalOpen(true)}
            onLogout={controller.auth.handleLogout}
            onOpenWithdraw={() => controller.mypage.setWithdrawOpen(true)}
            onConnectWallet={controller.mypage.handleConnectWallet}
            onDisconnectWallet={controller.mypage.handleDisconnectWallet}
          />
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
