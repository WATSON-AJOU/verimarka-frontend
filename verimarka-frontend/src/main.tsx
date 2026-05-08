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
import { LegacyRouteRedirect, LocaleRoute, LocalizedApp } from "./components/routing/LocaleRoutes";

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
            <Route path="/auth/apple/callback" element={<AppleCallback />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
            <Route path="/" element={<LegacyRouteRedirect />} />
            <Route path="/register" element={<LegacyRouteRedirect />} />
            <Route path="/verify" element={<LegacyRouteRedirect />} />
            <Route path="/history" element={<LegacyRouteRedirect />} />
            <Route path="/mypage" element={<LegacyRouteRedirect />} />
            <Route path="/terms" element={<LegacyRouteRedirect />} />
            <Route path="/privacy" element={<LegacyRouteRedirect />} />
            <Route path="/support" element={<LegacyRouteRedirect />} />
            <Route path="/:locale" element={<LocalizedApp><App /></LocalizedApp>} />
            <Route path="/:locale/register" element={<LocalizedApp><App /></LocalizedApp>} />
            <Route path="/:locale/verify" element={<LocalizedApp><App /></LocalizedApp>} />
            <Route path="/:locale/history" element={<LocalizedApp><App /></LocalizedApp>} />
            <Route path="/:locale/mypage" element={<LocalizedApp><App /></LocalizedApp>} />
            <Route path="/:locale/terms" element={<LocaleRoute><TermsPage /></LocaleRoute>} />
            <Route path="/:locale/privacy" element={<LocaleRoute><PrivacyPage /></LocaleRoute>} />
            <Route path="/:locale/support" element={<LocaleRoute><SupportPage /></LocaleRoute>} />
            <Route path="/403" element={<ErrorPage statusCode={403} />} />
            <Route path="/404" element={<ErrorPage statusCode={404} />} />
            <Route path="/:locale/*" element={<LocaleRoute><ErrorPage statusCode={404} /></LocaleRoute>} />
            <Route path="*" element={<ErrorPage statusCode={404} />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
