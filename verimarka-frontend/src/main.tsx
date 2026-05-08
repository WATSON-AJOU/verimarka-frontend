import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import "./i18n";
import "./index.css";
import App from "./App";
import { walletConfig, walletQueryClient } from "./lib/wallet";
import { appLogger } from "./lib/logger";
import { initSentry } from "./lib/sentry";
import AppleCallback from "./pages/auth/AppleCallback";
import GoogleCallback from "./pages/auth/GoogleCallback";
import KakaoCallback from "./pages/auth/KakaoCallback";
import PrivacyPage from "./pages/legal/PrivacyPage";
import SupportPage from "./pages/legal/SupportPage";
import TermsPage from "./pages/legal/TermsPage";
import ErrorPage from "./pages/ErrorPage";

void initSentry();

window.addEventListener("error", (event) => {
  appLogger.error("frontend.runtime_error", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  appLogger.error("frontend.unhandled_rejection", {
    reason: event.reason,
  });
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={walletQueryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/register" element={<App />} />
            <Route path="/verify" element={<App />} />
            <Route path="/history" element={<App />} />
            <Route path="/mypage" element={<App />} />
            <Route path="/auth/apple/callback" element={<AppleCallback />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/403" element={<ErrorPage statusCode={403} />} />
            <Route path="/404" element={<ErrorPage statusCode={404} />} />
            <Route path="*" element={<ErrorPage statusCode={404} />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
