import type { TabName } from "../../types/app";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { withLocalePath, type SupportedLocale } from "../../lib/locales";

interface HeaderTab {
  key: TabName;
  label: string;
}

interface HeaderProps {
  tabs: HeaderTab[];
  activeTab: TabName;
  loading: boolean;
  isLoggedIn: boolean;
  displayName: string;
  avatarInitial: string;
  onMoveTab: (tab: TabName) => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onLogout: () => void;
}

export default function Header({
  tabs,
  activeTab,
  loading,
  isLoggedIn,
  displayName,
  avatarInitial,
  onMoveTab,
  onOpenLogin,
  onOpenSignup,
  onLogout,
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const languages = useMemo(
    () => [
      { code: "ko" as const, label: t("language.ko") },
      { code: "en" as const, label: t("language.en") },
      { code: "ja" as const, label: t("language.ja") },
      { code: "zh-CN" as const, label: t("language.zhCN") },
    ],
    [t],
  );
  const currentLanguageLabel = languages.find((language) => language.code === i18n.language)?.label || t("language.ko");

  function changeLanguage(language: SupportedLocale) {
    void i18n.changeLanguage(language);
    navigate(
      {
        pathname: withLocalePath(location.pathname, language),
        search: location.search,
        hash: location.hash,
      },
      { replace: true },
    );
    setLanguageMenuOpen(false);
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab, isLoggedIn, loading]);

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="topbar-main">
          <button className="brand" type="button" onClick={() => onMoveTab("home")}>
            <span className="brand-word">VeriMarka</span>
          </button>

          <button
            type="button"
            className={`topbar-menu-toggle ${mobileMenuOpen ? "is-open" : ""}`}
            aria-expanded={mobileMenuOpen}
            aria-controls="site-navigation-panel"
            aria-label={mobileMenuOpen ? t("home.close") : t("header.mainMenu")}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div id="site-navigation-panel" className={`topbar-panel ${mobileMenuOpen ? "is-open" : ""}`}>
          <nav className="tabs" aria-label={t("header.mainMenu")}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tab ${activeTab === tab.key ? "is-active" : ""}`}
                onClick={() => {
                  onMoveTab(tab.key);
                  setMobileMenuOpen(false);
                }}
              >
                {t(`tabs.${tab.key}`)}
              </button>
            ))}
          </nav>

          <div className="auth-slot">
            {!loading && !isLoggedIn ? (
              <div className="guest-actions">
                <button className="auth-text-btn" type="button" onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}>
                  {t("header.login")}
                </button>
                <button className="auth-text-btn signup-link" type="button" onClick={() => {
                  onOpenSignup();
                  setMobileMenuOpen(false);
                }}>
                  {t("header.signup")}
                </button>
              </div>
            ) : null}

            {!loading && isLoggedIn ? (
              <>
                <button className="user-session" type="button" onClick={() => {
                  onMoveTab("mypage");
                  setMobileMenuOpen(false);
                }}>
                  <span className="user-nickname">{t("header.greeting", { name: displayName })}</span>
                  <span className="profile-shortcut">
                    <span className="profile-shortcut-circle">{avatarInitial}</span>
                  </span>
                </button>
                <button className="logout-btn" type="button" onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}>
                  {t("header.logout")}
                </button>
              </>
            ) : null}

            <div className="lang-switch">
              <button className="lang-trigger" type="button" onClick={() => setLanguageMenuOpen((current) => !current)}>
                <span className="lang-button-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 3a9 9 0 1 0 9 9a9.01 9.01 0 0 0-9-9Zm6.92 8h-3.01a14.8 14.8 0 0 0-1.53-5.03A7.02 7.02 0 0 1 18.92 11Zm-6.92 8a12.8 12.8 0 0 1-2.05-6h4.1A12.8 12.8 0 0 1 12 19Zm-2.05-8A12.8 12.8 0 0 1 12 5a12.8 12.8 0 0 1 2.05 6Zm-4.33 2h3.01a14.8 14.8 0 0 0 1.53 5.03A7.02 7.02 0 0 1 5.62 13Zm0-2A7.02 7.02 0 0 1 10.16 5.97A14.8 14.8 0 0 0 8.63 11Zm8.22 6.03A14.8 14.8 0 0 0 15.37 13h3.01a7.02 7.02 0 0 1-4.54 4.03Z" />
                  </svg>
                </span>
                {currentLanguageLabel}
                <span className="lang-caret">⌄</span>
              </button>
              {languageMenuOpen ? (
                <div className="lang-dropdown">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      className={`lang-option ${i18n.language === language.code ? "is-active" : ""}`}
                      onClick={() => changeLanguage(language.code)}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
