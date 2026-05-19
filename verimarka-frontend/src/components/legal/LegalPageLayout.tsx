import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import { buildTabPath } from "../../lib/app-utils";
import { getLocaleFromPathname, withLocalePath } from "../../lib/locales";
import { tabs } from "../../lib/mockData";
import type { TabName } from "../../types/app";

interface LegalPageLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export default function LegalPageLayout({ title, updatedAt, children }: LegalPageLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentLocale = getLocaleFromPathname(location.pathname) || "ko";

  function moveToTab(tab: TabName) {
    navigate(buildTabPath(tab, { locale: currentLocale }));
  }

  return (
    <div className="page-shell legal-shell">
      <Header
        tabs={tabs}
        activeTab={null}
        loading={false}
        isLoggedIn={false}
        displayName=""
        avatarInitial=""
        onMoveTab={moveToTab}
        onOpenLogin={() => moveToTab("home")}
        onOpenSignup={() => moveToTab("home")}
        onLogout={() => undefined}
        showAuthActions={false}
      />

      <main className="legal-main">
        <div className="legal-page">
          <div className="legal-card">
            <a className="legal-brand" href={withLocalePath("/", currentLocale)}>
              VeriMarka
            </a>
            <h1>{title}</h1>
            <p className="legal-updated">최종 업데이트: {updatedAt}</p>
            <div className="legal-content">{children}</div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
