import type { TabName } from "../../types/app";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languages = useMemo(
    () => [
      { code: "ko", label: t("language.ko") },
      { code: "en", label: t("language.en") },
      { code: "ja", label: t("language.ja") },
      { code: "zh-CN", label: t("language.zhCN") },
    ],
    [t],
  );
  const currentLanguageLabel = languages.find((language) => language.code === i18n.language)?.label || t("language.ko");

  return (
    <header className="site-header">
      <div className="topbar">
        <button className="brand" type="button" onClick={() => onMoveTab("home")}>
          <span className="brand-word">VeriMarka</span>
        </button>

        <nav className="tabs" aria-label={t("header.mainMenu")}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab ${activeTab === tab.key ? "is-active" : ""}`}
              onClick={() => onMoveTab(tab.key)}
            >
              {t(`tabs.${tab.key}`)}
            </button>
          ))}
        </nav>

        <div className="auth-slot">
          {!loading && !isLoggedIn ? (
            <div className="guest-actions">
              <button className="auth-text-btn" type="button" onClick={onOpenLogin}>
                {t("header.login")}
              </button>
              <button className="auth-text-btn signup-link" type="button" onClick={onOpenSignup}>
                {t("header.signup")}
              </button>
            </div>
          ) : null}

          {!loading && isLoggedIn ? (
            <>
              <button className="user-session" type="button" onClick={() => onMoveTab("mypage")}>
                <span className="user-nickname">{t("header.greeting", { name: displayName })}</span>
                <span className="profile-shortcut">
                  <span className="profile-shortcut-circle">{avatarInitial}</span>
                </span>
              </button>
              <button className="logout-btn" type="button" onClick={onLogout}>
                {t("header.logout")}
              </button>
            </>
          ) : null}

          <div className="lang-switch">
            <button className="lang-trigger" type="button" onClick={() => setLanguageMenuOpen((current) => !current)}>
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
                    onClick={() => {
                      void i18n.changeLanguage(language.code);
                      setLanguageMenuOpen(false);
                    }}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
